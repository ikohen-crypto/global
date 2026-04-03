import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { inflateRawSync } from "node:zlib";

import { getIndicatorDefinition } from "@/lib/indicators/registry";
import type { IndicatorPoint, IndicatorSeries } from "@/lib/types";

const WORKBOOK_PATH = join(process.cwd(), "data", "population.xlsx");
const SHEET_NAME = "Estimates";
const HEADER_ROW_INDEX = 17;
const DATA_START_ROW_INDEX = 18;

type CellMap = Map<string, string>;

type WorkbookCache = {
  byIso3: Map<string, IndicatorSeries>;
};

let workbookCache: WorkbookCache | null = null;

function decodeXml(value: string) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'");
}

function stripXml(text: string) {
  return decodeXml(text.replace(/<[^>]+>/g, ""));
}

function extractColumn(ref: string) {
  const match = ref.match(/[A-Z]+/);
  return match?.[0] ?? "";
}

function parseNumber(value: string) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function readZipEntry(entryName: string) {
  const workbookBuffer = await readFile(WORKBOOK_PATH);
  const bytes = new Uint8Array(workbookBuffer);
  const localHeaderSignature = [0x50, 0x4b, 0x03, 0x04];
  let offset = 0;

  while (offset < bytes.length - 4) {
    const isLocalHeader = localHeaderSignature.every((byte, index) => bytes[offset + index] === byte);
    if (!isLocalHeader) {
      offset += 1;
      continue;
    }

    const flags = bytes[offset + 6] | (bytes[offset + 7] << 8);
    const compressionMethod = bytes[offset + 8] | (bytes[offset + 9] << 8);
    const compressedSize =
      bytes[offset + 18] |
      (bytes[offset + 19] << 8) |
      (bytes[offset + 20] << 16) |
      (bytes[offset + 21] << 24);
    const fileNameLength = bytes[offset + 26] | (bytes[offset + 27] << 8);
    const extraLength = bytes[offset + 28] | (bytes[offset + 29] << 8);
    const fileNameStart = offset + 30;
    const fileName = new TextDecoder().decode(bytes.slice(fileNameStart, fileNameStart + fileNameLength));
    const dataStart = fileNameStart + fileNameLength + extraLength;

    if ((flags & 0x08) !== 0) {
      throw new Error("Unsupported XLSX entry with data descriptor.");
    }

    const dataEnd = dataStart + compressedSize;
    if (fileName === entryName) {
      const compressed = Buffer.from(bytes.slice(dataStart, dataEnd));
      if (compressionMethod === 0) {
        return compressed.toString("utf8");
      }

      if (compressionMethod !== 8) {
        throw new Error(`Unsupported XLSX compression method: ${compressionMethod}`);
      }

      return inflateRawSync(compressed).toString("utf8");
    }

    offset = dataEnd;
  }

  throw new Error(`XLSX entry not found: ${entryName}`);
}

async function getSheetPathByName(sheetName: string) {
  const workbookXml = await readZipEntry("xl/workbook.xml");
  const relsXml = await readZipEntry("xl/_rels/workbook.xml.rels");

  const sheetPattern = new RegExp(
    `<sheet[^>]*name="${sheetName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[^>]*r:id="([^"]+)"[^>]*/>`,
  );
  const relationId = workbookXml.match(sheetPattern)?.[1];
  if (!relationId) {
    throw new Error(`Workbook sheet not found: ${sheetName}`);
  }

  const relationPattern = new RegExp(
    `<Relationship[^>]*Id="${relationId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[^>]*Target="([^"]+)"[^>]*/>`,
  );
  const target = relsXml.match(relationPattern)?.[1];
  if (!target) {
    throw new Error(`Workbook relation not found for sheet: ${sheetName}`);
  }

  return `xl/${target.replace(/^\/+/, "")}`;
}

async function getSharedStrings() {
  const sharedStringsXml = await readZipEntry("xl/sharedStrings.xml");
  return [...sharedStringsXml.matchAll(/<si\b[\s\S]*?<\/si>/g)].map((match) =>
    stripXml(match[0]).trim(),
  );
}

function parseSheetRows(sheetXml: string, sharedStrings: string[]) {
  const rows = [...sheetXml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)];

  return rows.map((rowMatch) => {
    const cellMap: CellMap = new Map();
    const rowXml = rowMatch[1];

    for (const cellMatch of rowXml.matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>|<c\b([^>]*)\/>/g)) {
      const attrs = cellMatch[1] ?? cellMatch[3] ?? "";
      const cellBody = cellMatch[2] ?? "";
      const ref = attrs.match(/\br="([^"]+)"/)?.[1] ?? "";
      const column = extractColumn(ref);
      if (!column) continue;

      const type = attrs.match(/\bt="([^"]+)"/)?.[1] ?? null;
      const inlineString = cellBody.match(/<is\b[^>]*>([\s\S]*?)<\/is>/)?.[1] ?? "";
      const valueTag = cellBody.match(/<v\b[^>]*>([\s\S]*?)<\/v>/)?.[1] ?? "";

      let value = valueTag ? stripXml(valueTag).trim() : stripXml(inlineString).trim();
      if (type === "s" && value) {
        value = sharedStrings[Number(value)] ?? "";
      }

      cellMap.set(column, value);
    }

    return cellMap;
  });
}

function buildHeaderMap(headerRow: CellMap) {
  return Array.from(headerRow.entries()).reduce<Map<string, string>>((map, [column, label]) => {
    if (label) {
      map.set(label, column);
    }
    return map;
  }, new Map());
}

async function loadPopulationSeriesByIso3() {
  if (workbookCache) {
    return workbookCache.byIso3;
  }

  const sheetPath = await getSheetPathByName(SHEET_NAME);
  const [sheetXml, sharedStrings] = await Promise.all([readZipEntry(sheetPath), getSharedStrings()]);
  const rows = parseSheetRows(sheetXml, sharedStrings);
  const headerMap = buildHeaderMap(rows[HEADER_ROW_INDEX - 1] ?? new Map());

  const iso3Column = headerMap.get("ISO3 Alpha-code");
  const yearColumn = headerMap.get("Year");
  const populationColumn = headerMap.get("Total Population, as of 1 July (thousands)");

  if (!iso3Column || !yearColumn || !populationColumn) {
    throw new Error("UN population workbook columns could not be mapped.");
  }

  const definition = getIndicatorDefinition("population");
  const pointsByIso3 = new Map<string, IndicatorPoint[]>();

  for (const row of rows.slice(DATA_START_ROW_INDEX - 1)) {
    const iso3 = (row.get(iso3Column) ?? "").trim().toUpperCase();
    const year = parseNumber(row.get(yearColumn) ?? "");
    const populationThousands = parseNumber(row.get(populationColumn) ?? "");

    if (!iso3 || iso3.length !== 3 || year == null || populationThousands == null) {
      continue;
    }

    const bucket = pointsByIso3.get(iso3) ?? [];
    bucket.push({
      year,
      value: Math.round(populationThousands * 1000),
    });
    pointsByIso3.set(iso3, bucket);
  }

  const byIso3 = new Map<string, IndicatorSeries>();
  for (const [iso3, points] of pointsByIso3.entries()) {
    const ordered = points.sort((a, b) => a.year - b.year);
    const latest = [...ordered].reverse().find((point) => point.value != null) ?? null;

    byIso3.set(iso3, {
      indicatorId: definition.id,
      sourceProvider: "un",
      sourceName: "UN World Population Prospects 2024",
      sourceCode: "WPP2024/GEN/F01/Estimates",
      countryIso3: iso3,
      sourceLastUpdated: "2024-07",
      frequency: "annual",
      coverageStartYear: ordered[0]?.year ?? null,
      coverageEndYear: ordered.at(-1)?.year ?? null,
      latestAvailableLabel: latest ? String(latest.year) : null,
      comparableAcrossCountries: true,
      latestYear: latest?.year ?? null,
      latestValue: latest?.value ?? null,
      points: ordered,
    });
  }

  workbookCache = { byIso3 };
  return byIso3;
}

export async function fetchPopulationSeriesFromUn(iso3: string): Promise<IndicatorSeries | null> {
  try {
    const byIso3 = await loadPopulationSeriesByIso3();
    return byIso3.get(iso3.toUpperCase()) ?? null;
  } catch {
    return null;
  }
}

export async function getLatestPopulationValuesFromUn() {
  try {
    const byIso3 = await loadPopulationSeriesByIso3();
    return new Map(
      Array.from(byIso3.entries()).map(([iso3, series]) => [iso3, series.latestValue ?? null]),
    );
  } catch {
    return new Map<string, number | null>();
  }
}
