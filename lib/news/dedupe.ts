import type { NewsCluster, NewsDuplicateDebug, NewsItem, NewsSourceId } from "@/lib/types";

type NormalizedArticle = {
  article: NewsItem;
  canonicalUrlNormalized: string | null;
  normalizedUrl: string;
  normalizedTitle: string;
  normalizedSummary: string;
  normalizedSource: string;
  normalizedPublishedAt: string;
  publishedDay: string;
  titleSkeleton: string;
  summarySkeleton: string;
  fingerprintFields: {
    simplifiedTitleTokensSorted: string[];
    topMeaningfulTokens: string[];
    topEntities: string[];
    topTickers: string[];
    coreAction: string;
    approximateTimeBucket: string;
    normalizedSummaryTokens: string[];
    titleTrigrams: string[];
    summaryTrigrams: string[];
  };
  fingerprints: {
    exactUrlKey: string;
    canonicalUrlKey: string | null;
    titleDayKey: string;
    fuzzyTitleKey: string;
    contentKey: string;
    eventKey: string;
    titleSkeletonKey: string;
    summarySkeletonKey: string;
  };
};

type ClusterRecord = {
  id: string;
  articleIds: string[];
  debug: NewsDuplicateDebug[];
};

type ComparisonResult = {
  isDuplicate: boolean;
  shouldCluster: boolean;
  score: number;
  reasons: string[];
  matchedFields: string[];
};

type DedupeStats = {
  total_in: number;
  total_out: number;
  duplicates_removed: number;
  clusters_created: number;
  exact_url_matches: number;
  fuzzy_title_matches: number;
  same_event_clusters: number;
};

type DedupeFeedResult = {
  deduped_articles: NewsItem[];
  clusters: NewsCluster[];
  stats: DedupeStats;
};

type DedupeOptions = {
  recentWindowDays?: number;
};

const DEFAULT_RECENT_WINDOW_DAYS = 7;
const DUPLICATE_THRESHOLD = 0.88;
const PROBABLE_DUPLICATE_THRESHOLD = 0.76;
const RELATED_CLUSTER_THRESHOLD = 0.68;
const DUPLICATE_WINDOW_HOURS = 48;
const CLUSTER_WINDOW_HOURS = 72;
const FAR_APART_DAYS = 7;

const TITLE_PREFIXES = /^(breaking|update|opinion|analysis|report)\s*:\s*/i;
const BOILERPLATE_PATTERNS = [
  /\bread more\b/gi,
  /\bcontinue reading\b/gi,
  /\bclick here to read more\b/gi,
  /\bthis article originally appeared on\b.*$/gi,
] as const;
const TRACKING_PARAM_PATTERN = /^(utm_.+|fbclid|gclid|mc_cid|mc_eid|ref|ref_src|source)$/i;
const TEMPLATED_HEADLINE_PATTERNS = [
  /^novedad .* sobre /,
  /^actualizacion .* en /,
  /^comunicacion oficial .*$/,
  /^reporte .* para /,
  /^anuncio .* sobre /,
  /^policy update on /,
  /^official communication on /,
  /^report on /,
] as const;
const INSTITUTION_PATTERNS = [
  /\bfederal reserve\b/g,
  /\breserve federal\b/g,
  /\becb\b/g,
  /\beuropean central bank\b/g,
  /\bimf\b/g,
  /\bfmi\b/g,
  /\bbank of england\b/g,
  /\bboe\b/g,
  /\bbank of japan\b/g,
  /\bboj\b/g,
  /\bcentral bank\b/g,
] as const;
const MACRO_TEMPLATE_VARIABLES = new Set([
  "inflation",
  "tasas",
  "rates",
  "rate",
  "growth",
  "crecimiento",
  "forex",
  "currency",
  "debt",
  "deuda",
  "employment",
  "empleo",
  "jobs",
  "oil",
  "crude",
  "bitcoin",
  "ethereum",
  "crypto",
]);
const TITLE_STOPWORDS = new Set([
  "a",
  "an",
  "and",
  "as",
  "at",
  "for",
  "from",
  "in",
  "into",
  "of",
  "on",
  "or",
  "the",
  "to",
  "up",
  "with",
  "after",
  "amid",
  "ahead",
  "over",
  "under",
  "by",
  "is",
  "are",
  "was",
  "were",
  "be",
  "this",
  "that",
  "these",
  "those",
  "news",
  "crypto",
  "market",
  "markets",
  "today",
]);
const ACTION_KEYWORDS = [
  "jumps",
  "jump",
  "rises",
  "rise",
  "rebounds",
  "rebound",
  "falls",
  "fall",
  "drops",
  "drop",
  "slides",
  "slide",
  "surges",
  "surge",
  "gains",
  "gain",
  "approves",
  "approve",
  "files",
  "file",
  "launches",
  "launch",
  "announces",
  "announce",
  "cuts",
  "cut",
  "hikes",
  "hike",
  "warns",
  "warn",
  "eyes",
  "eye",
  "extends",
  "extend",
  "settles",
  "settle",
] as const;
const ENTITY_STOPWORDS = new Set([
  ...TITLE_STOPWORDS,
  "btc",
  "eth",
  ...ACTION_KEYWORDS,
  "higher",
  "lower",
  "stronger",
  "weaker",
  "improves",
  "improve",
  "increases",
  "increase",
  "watch",
  "week",
  "weeks",
]);
const SOURCE_PRIORITY: Record<NewsSourceId, number> = {
  coindesk: 100,
  theblock: 95,
  messari: 90,
  cointelegraph: 85,
  blockworks: 80,
  cryptonews: 75,
  beincrypto: 70,
  utoday: 65,
  freeCryptoNews: 60,
  investing: 55,
  marketaux: 50,
  fed: 95,
  ecb: 95,
  imf: 95,
  bitcoinmagazine: 72,
};

function stripHtml(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function removeEmoji(value: string) {
  return value.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, "");
}

function simplifyNumericFormatting(value: string) {
  return value.replace(/\b(\d{1,3})(,\d{3})+\b/g, (match) => match.replace(/,/g, ""));
}

function normalizeText(value: string) {
  return simplifyNumericFormatting(removeEmoji(stripHtml(value)))
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s$%.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeTitle(title: string) {
  return normalizeText(title)
    .replace(TITLE_PREFIXES, "")
    .replace(/[.,;:!?()[\]{}]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeSummary(summary: string) {
  let normalized = normalizeText(summary);
  for (const pattern of BOILERPLATE_PATTERNS) {
    normalized = normalized.replace(pattern, " ");
  }
  return normalized.replace(/\s+/g, " ").trim();
}

function normalizeToken(token: string) {
  const normalized = token.trim().toLowerCase();
  if (!normalized) return "";
  if (normalized === "btc") return "bitcoin";
  if (normalized === "eth") return "ethereum";
  if (normalized === "inflow" || normalized === "inflows" || normalized === "flows") return "flow";
  if (normalized === "outflow" || normalized === "outflows") return "flow";
  if (normalized === "etfs") return "etf";
  const compactThousands = normalized.match(/^(\d+(?:\.\d+)?)k$/);
  if (compactThousands) {
    return String(Math.round(Number(compactThousands[1]) * 1000));
  }
  const compactMillions = normalized.match(/^(\d+(?:\.\d+)?)m$/);
  if (compactMillions) {
    return String(Math.round(Number(compactMillions[1]) * 1000000));
  }
  return normalized;
}

function tokenize(value: string, stopwords = TITLE_STOPWORDS) {
  return value
    .split(" ")
    .map((token) => normalizeToken(token))
    .filter((token) => token.length > 1 && !stopwords.has(token));
}

function uniqueTokens(tokens: string[]) {
  return Array.from(new Set(tokens));
}

function buildTrigrams(value: string) {
  const compact = value.replace(/\s+/g, " ").trim();
  if (compact.length < 3) return compact ? [compact] : [];

  const trigrams: string[] = [];
  for (let index = 0; index <= compact.length - 3; index += 1) {
    trigrams.push(compact.slice(index, index + 3));
  }
  return uniqueTokens(trigrams);
}

function hashValue(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

function normalizeArticleUrl(rawUrl: string | null | undefined) {
  if (!rawUrl) return "";

  try {
    const url = new URL(rawUrl);
    url.hash = "";
    url.hostname = url.hostname.toLowerCase();

    const keptParams = new URLSearchParams();
    for (const [key, value] of url.searchParams.entries()) {
      if (TRACKING_PARAM_PATTERN.test(key)) continue;
      keptParams.append(key, value);
    }
    url.search = keptParams.toString() ? `?${keptParams.toString()}` : "";

    url.pathname = url.pathname
      .replace(/\/amp\/?/gi, "/")
      .replace(/\/mobile\/?/gi, "/")
      .replace(/\/+$/g, "");

    if (!url.pathname) {
      url.pathname = "/";
    }

    const normalized = `${url.protocol}//${url.hostname}${url.pathname}${url.search}`;
    return normalized.endsWith("/") && url.pathname !== "/" ? normalized.slice(0, -1) : normalized;
  } catch {
    return rawUrl.trim();
  }
}

function normalizePublishedAt(value: string) {
  const timestamp = Date.parse(value);
  const date = Number.isNaN(timestamp) ? new Date(0) : new Date(timestamp);
  return date.toISOString();
}

function publishedDayFromIso(value: string) {
  return value.slice(0, 10);
}

function buildTimeBucket(value: string) {
  const timestamp = Date.parse(value);
  const bucket = Math.floor(timestamp / (1000 * 60 * 60 * 12));
  return String(bucket);
}

function extractTickers(article: NewsItem, combinedText: string) {
  const explicit = uniqueTokens((article.tickers ?? []).map((ticker) => ticker.toLowerCase().replace(/[^a-z0-9]/g, "")));
  const inferred = uniqueTokens(
    [...combinedText.matchAll(/\b[a-z]{2,5}\b/g)]
      .map((match) => normalizeToken(match[0]))
      .filter((token) => ["bitcoin", "ethereum", "sol", "xrp", "usd", "eur", "oil", "spy", "qqq"].includes(token)),
  );
  return uniqueTokens([...explicit, ...inferred]).slice(0, 4);
}

function extractEntities(tokens: string[]) {
  return uniqueTokens(tokens.filter((token) => token.length > 2 && !ENTITY_STOPWORDS.has(token))).slice(0, 4);
}

function extractCoreAction(combinedText: string) {
  return ACTION_KEYWORDS.find((keyword) => combinedText.includes(keyword)) ?? "moves";
}

function replaceCountriesWithPlaceholder(value: string, article: NewsItem) {
  let nextValue = value;

  for (const country of article.relatedCountries) {
    const variants = [
      country.name,
      country.shortName,
      country.slug.replace(/-/g, " "),
      country.iso2,
      country.iso3,
    ].filter(Boolean);

    for (const variant of variants) {
      const escaped = normalizeText(variant).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (!escaped) continue;
      nextValue = nextValue.replace(new RegExp(`\\b${escaped}\\b`, "g"), "{country}");
    }
  }

  return nextValue;
}

function buildSkeleton(article: NewsItem, value: string, mode: "title" | "summary") {
  let skeleton = normalizeText(value);
  skeleton = replaceCountriesWithPlaceholder(skeleton, article);

  for (const pattern of INSTITUTION_PATTERNS) {
    skeleton = skeleton.replace(pattern, "{institution}");
  }

  for (const ticker of article.tickers ?? []) {
    const normalizedTicker = normalizeText(ticker).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (!normalizedTicker) continue;
    skeleton = skeleton.replace(new RegExp(`\\b${normalizedTicker}\\b`, "g"), "{ticker}");
  }

  skeleton = skeleton
    .replace(/\b(?:btc|eth|xrp|sol|eur|usd)\b/g, "{ticker}")
    .replace(/\b\d+(?:\.\d+)?%\b/g, "{percent}")
    .replace(/\b\d+(?:[,.]\d+)?\b/g, "{number}")
    .replace(/\b(?:today|yesterday|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/g, "{time}")
    .replace(/\b(?:jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december)\b/g, "{time}")
    .replace(/\b\d{1,2}:\d{2}\b/g, "{time}");

  const filteredTokens = skeleton
    .split(" ")
    .map((token) => normalizeToken(token))
    .filter((token) => {
      if (!token) return false;
      if (token.startsWith("{") && token.endsWith("}")) return true;
      if (MACRO_TEMPLATE_VARIABLES.has(token)) return true;
      return !TITLE_STOPWORDS.has(token);
    });

  const compact = filteredTokens.join(" ").replace(/\s+/g, " ").trim();
  return mode === "title" ? compact : compact.slice(0, 240);
}

export function isTemplatedHeadline(title: string) {
  const normalized = normalizeTitle(title);
  return TEMPLATED_HEADLINE_PATTERNS.some((pattern) => pattern.test(normalized));
}

function normalizeArticle(article: NewsItem): NormalizedArticle {
  const canonicalUrlNormalized = article.canonicalUrl ? normalizeArticleUrl(article.canonicalUrl) : null;
  const normalizedUrl = normalizeArticleUrl(canonicalUrlNormalized || article.url);
  const normalizedTitle = normalizeTitle(article.title);
  const normalizedSummary = normalizeSummary(article.summary);
  const normalizedSource = normalizeText(article.source);
  const normalizedPublishedAt = normalizePublishedAt(article.publishedAt);
  const publishedDay = publishedDayFromIso(normalizedPublishedAt);
  const titleSkeleton = buildSkeleton(article, article.title, "title");
  const summarySkeleton = buildSkeleton(article, article.summary, "summary");
  const combinedText = `${normalizedTitle} ${normalizedSummary}`.trim();
  const titleTokens = uniqueTokens(tokenize(normalizedTitle));
  const simplifiedTitleTokensSorted = [...titleTokens].sort();
  const contentTokens = uniqueTokens(tokenize(combinedText)).slice(0, 12);
  const normalizedSummaryTokens = uniqueTokens(tokenize(normalizedSummary));
  const topTickers = extractTickers(article, combinedText);
  const topEntities = extractEntities([...titleTokens, ...tokenize(normalizedSummary, ENTITY_STOPWORDS)]);
  const coreAction = extractCoreAction(combinedText);
  const approximateTimeBucket = buildTimeBucket(normalizedPublishedAt);
  const titleTrigrams = buildTrigrams(titleSkeleton || normalizedTitle);
  const summaryTrigrams = buildTrigrams(summarySkeleton || normalizedSummary);

  return {
    article,
    canonicalUrlNormalized,
    normalizedUrl,
    normalizedTitle,
    normalizedSummary,
    normalizedSource,
    normalizedPublishedAt,
    publishedDay,
    titleSkeleton,
    summarySkeleton,
    fingerprintFields: {
      simplifiedTitleTokensSorted,
      topMeaningfulTokens: contentTokens,
      topEntities,
      topTickers,
      coreAction,
      approximateTimeBucket,
      normalizedSummaryTokens,
      titleTrigrams,
      summaryTrigrams,
    },
    fingerprints: {
      exactUrlKey: hashValue(normalizedUrl),
      canonicalUrlKey: canonicalUrlNormalized ? hashValue(canonicalUrlNormalized) : null,
      titleDayKey: hashValue(`${normalizedTitle}|${publishedDay}`),
      fuzzyTitleKey: hashValue(simplifiedTitleTokensSorted.join("|")),
      contentKey: hashValue(contentTokens.join("|")),
      eventKey: hashValue(
        `${topEntities.join("|")}|${topTickers.join("|")}|${coreAction}|${approximateTimeBucket}`,
      ),
      titleSkeletonKey: hashValue(titleSkeleton),
      summarySkeletonKey: hashValue(summarySkeleton),
    },
  };
}

export function buildFingerprints(article: NewsItem | NormalizedArticle) {
  return ("fingerprints" in article ? article : normalizeArticle(article)).fingerprints;
}

function jaccardSimilarity(left: string[], right: string[]) {
  if (left.length === 0 || right.length === 0) return 0;
  const leftSet = new Set(left);
  const rightSet = new Set(right);
  const intersection = [...leftSet].filter((token) => rightSet.has(token)).length;
  const union = new Set([...leftSet, ...rightSet]).size;
  return union === 0 ? 0 : intersection / union;
}

function cosineSimilarity(left: string[], right: string[]) {
  if (left.length === 0 || right.length === 0) return 0;
  const vocabulary = uniqueTokens([...left, ...right]);
  const vector = (tokens: string[]) => vocabulary.map((term) => tokens.filter((token) => token === term).length);
  const leftVector = vector(left);
  const rightVector = vector(right);
  const dot = leftVector.reduce((sum, value, index) => sum + value * rightVector[index]!, 0);
  const magnitude = (values: number[]) => Math.sqrt(values.reduce((sum, value) => sum + value * value, 0));
  const denominator = magnitude(leftVector) * magnitude(rightVector);
  return denominator === 0 ? 0 : dot / denominator;
}

function levenshteinDistance(left: string, right: string) {
  if (left === right) return 0;
  if (!left.length) return right.length;
  if (!right.length) return left.length;

  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  const current = new Array<number>(right.length + 1).fill(0);

  for (let row = 1; row <= left.length; row += 1) {
    current[0] = row;
    for (let column = 1; column <= right.length; column += 1) {
      const cost = left[row - 1] === right[column - 1] ? 0 : 1;
      current[column] = Math.min(
        current[column - 1]! + 1,
        previous[column]! + 1,
        previous[column - 1]! + cost,
      );
    }
    for (let index = 0; index < previous.length; index += 1) {
      previous[index] = current[index]!;
    }
  }

  return previous[right.length]!;
}

function titleSimilarity(left: NormalizedArticle, right: NormalizedArticle) {
  const jaccard = jaccardSimilarity(
    left.fingerprintFields.simplifiedTitleTokensSorted,
    right.fingerprintFields.simplifiedTitleTokensSorted,
  );
  const cosine = cosineSimilarity(
    left.fingerprintFields.simplifiedTitleTokensSorted,
    right.fingerprintFields.simplifiedTitleTokensSorted,
  );
  const longest = Math.max(left.normalizedTitle.length, right.normalizedTitle.length) || 1;
  const levenshtein = 1 - levenshteinDistance(left.normalizedTitle, right.normalizedTitle) / longest;
  return (jaccard + cosine + levenshtein) / 3;
}

function bodySimilarity(left: NormalizedArticle, right: NormalizedArticle) {
  const leftTokens = left.fingerprintFields.topMeaningfulTokens;
  const rightTokens = right.fingerprintFields.topMeaningfulTokens;
  return (jaccardSimilarity(leftTokens, rightTokens) + cosineSimilarity(leftTokens, rightTokens)) / 2;
}

function trigramSimilarity(left: string[], right: string[]) {
  return jaccardSimilarity(left, right);
}

function longestCommonPhraseRatio(left: string, right: string) {
  const leftTokens = left.split(" ").filter(Boolean);
  const rightTokens = right.split(" ").filter(Boolean);
  if (leftTokens.length === 0 || rightTokens.length === 0) return 0;

  let longest = 0;
  for (let leftIndex = 0; leftIndex < leftTokens.length; leftIndex += 1) {
    for (let rightIndex = 0; rightIndex < rightTokens.length; rightIndex += 1) {
      let current = 0;
      while (
        leftTokens[leftIndex + current] &&
        rightTokens[rightIndex + current] &&
        leftTokens[leftIndex + current] === rightTokens[rightIndex + current]
      ) {
        current += 1;
      }
      longest = Math.max(longest, current);
    }
  }

  return longest / Math.max(Math.min(leftTokens.length, rightTokens.length), 1);
}

function hoursBetween(leftIso: string, rightIso: string) {
  return Math.abs(Date.parse(leftIso) - Date.parse(rightIso)) / (1000 * 60 * 60);
}

function samePrimaryEntity(left: NormalizedArticle, right: NormalizedArticle) {
  return left.fingerprintFields.topEntities[0] && left.fingerprintFields.topEntities[0] === right.fingerprintFields.topEntities[0];
}

function entityOverlap(left: NormalizedArticle, right: NormalizedArticle) {
  return jaccardSimilarity(left.fingerprintFields.topEntities, right.fingerprintFields.topEntities);
}

export function detectTemplateSimilarity(left: NewsItem | NormalizedArticle, right: NewsItem | NormalizedArticle) {
  const normalizedLeft = "fingerprints" in left ? left : normalizeArticle(left);
  const normalizedRight = "fingerprints" in right ? right : normalizeArticle(right);

  const titleSkeletonMatch = normalizedLeft.titleSkeleton === normalizedRight.titleSkeleton;
  const summarySkeletonMatch = normalizedLeft.summarySkeleton === normalizedRight.summarySkeleton;
  const titleSkeletonSimilarity = trigramSimilarity(
    normalizedLeft.fingerprintFields.titleTrigrams,
    normalizedRight.fingerprintFields.titleTrigrams,
  );
  const summarySkeletonSimilarity = trigramSimilarity(
    normalizedLeft.fingerprintFields.summaryTrigrams,
    normalizedRight.fingerprintFields.summaryTrigrams,
  );
  const longestSummaryPhraseRatio = longestCommonPhraseRatio(
    normalizedLeft.summarySkeleton,
    normalizedRight.summarySkeleton,
  );
  const templatedHeadline =
    isTemplatedHeadline(normalizedLeft.article.title) && isTemplatedHeadline(normalizedRight.article.title);

  return {
    titleSkeletonMatch,
    summarySkeletonMatch,
    titleSkeletonSimilarity,
    summarySkeletonSimilarity,
    longestSummaryPhraseRatio,
    templatedHeadline,
  };
}

function compareNormalizedArticles(left: NormalizedArticle, right: NormalizedArticle): ComparisonResult {
  const reasons: string[] = [];
  const matchedFields: string[] = [];
  let score = 0;
  const hourDistance = hoursBetween(left.normalizedPublishedAt, right.normalizedPublishedAt);
  const dayDistance = hourDistance / 24;
  const titleScore = titleSimilarity(left, right);
  const contentScore = bodySimilarity(left, right);
  const sameSource = left.article.sourceId === right.article.sourceId;
  const sharedEntityScore = entityOverlap(left, right);
  const templateSignals = detectTemplateSimilarity(left, right);
  const summaryTokenOverlap = jaccardSimilarity(
    left.fingerprintFields.normalizedSummaryTokens,
    right.fingerprintFields.normalizedSummaryTokens,
  );
  const summaryTrigramSimilarity = trigramSimilarity(
    left.fingerprintFields.summaryTrigrams,
    right.fingerprintFields.summaryTrigrams,
  );
  const eventMatch =
    left.fingerprints.eventKey === right.fingerprints.eventKey ||
    sharedEntityScore >= 0.75 ||
    (
      sharedEntityScore >= 0.6 &&
      (
        jaccardSimilarity(left.fingerprintFields.topTickers, right.fingerprintFields.topTickers) >= 0.5 ||
        left.fingerprintFields.coreAction === right.fingerprintFields.coreAction
      )
    );

  if (left.fingerprints.canonicalUrlKey && left.fingerprints.canonicalUrlKey === right.fingerprints.canonicalUrlKey) {
    score = Math.max(score, 1);
    reasons.push("canonical_url_key_match");
    matchedFields.push("canonical_url_key");
  }

  if (left.fingerprints.exactUrlKey === right.fingerprints.exactUrlKey) {
    score = Math.max(score, 0.95);
    reasons.push("exact_url_key_match");
    matchedFields.push("exact_url_key");
  }

  if (left.normalizedUrl === right.normalizedUrl) {
    score = Math.max(score, 0.9);
    reasons.push("normalized_url_match");
    matchedFields.push("normalized_url");
  }

  if (left.normalizedTitle === right.normalizedTitle) {
    score = Math.max(score, 0.85);
    reasons.push("normalized_title_exact_match");
    matchedFields.push("normalized_title");
  }

  if (titleScore >= 0.92) {
    score = Math.max(score, 0.78);
    reasons.push("high_title_similarity");
    matchedFields.push("title_similarity");
  } else if (titleScore >= 0.85 && left.publishedDay === right.publishedDay) {
    score = Math.max(score, 0.6);
    reasons.push("strong_title_similarity_same_day");
    matchedFields.push("title_day");
  }

  if (contentScore >= 0.82 || summaryTokenOverlap >= 0.7 || summaryTrigramSimilarity >= 0.7) {
    score = Math.max(score, 0.72);
    reasons.push("title_summary_similarity");
    matchedFields.push("content_tokens");
  }

  if (templateSignals.titleSkeletonMatch) {
    score = Math.max(score, 0.7);
    reasons.push("title_skeleton_match");
    matchedFields.push("title_skeleton");
  }

  if (templateSignals.summarySkeletonMatch) {
    score = Math.max(score, 0.65);
    reasons.push("summary_skeleton_match");
    matchedFields.push("summary_skeleton");
  }

  if (templateSignals.templatedHeadline) {
    reasons.push("templated_headline");
    matchedFields.push("templated_headline");
  }

  if (summaryTokenOverlap >= 0.78 || summaryTrigramSimilarity >= 0.78 || templateSignals.longestSummaryPhraseRatio >= 0.72) {
    score = Math.max(score, 0.72);
    reasons.push("high_summary_overlap");
    matchedFields.push("summary_overlap");
  }

  if (eventMatch) {
    score = Math.max(score, 0.5);
    reasons.push("event_key_or_entity_action_match");
    matchedFields.push("event_key");
  }

  if (
    titleScore >= 0.72 &&
    contentScore >= 0.58 &&
    samePrimaryEntity(left, right) &&
    hourDistance <= CLUSTER_WINDOW_HOURS
  ) {
    score = Math.max(score, 0.4);
    reasons.push("same_event_rewrite");
    matchedFields.push("entity_rewrite");
  }

  if (
    sameSource &&
    (
      (templateSignals.titleSkeletonMatch && templateSignals.summarySkeletonMatch) ||
      (templateSignals.titleSkeletonSimilarity >= 0.84 && templateSignals.summarySkeletonSimilarity >= 0.84) ||
      (summaryTokenOverlap >= 0.7 && templateSignals.templatedHeadline)
    ) &&
    hourDistance <= 24
  ) {
    score = Math.max(score, 0.88);
    reasons.push("same_source_template_duplicate");
    matchedFields.push("template_duplicate");
  }

  if (
    sameSource &&
    titleScore >= 0.56 &&
    contentScore >= 0.42 &&
    hourDistance <= CLUSTER_WINDOW_HOURS
  ) {
    score = Math.max(score, 0.8);
    reasons.push("same_source_republication_or_rewrite");
    matchedFields.push("same_source");
  }

  if (
    eventMatch &&
    (titleScore >= 0.32 || contentScore >= 0.3) &&
    hourDistance <= CLUSTER_WINDOW_HOURS
  ) {
    score = Math.max(score, 0.78);
    reasons.push("same_event_cluster");
    matchedFields.push("event_cluster");
  }

  if (
    sharedEntityScore >= 0.75 &&
    contentScore >= 0.28 &&
    hourDistance <= CLUSTER_WINDOW_HOURS
  ) {
    score = Math.max(score, 0.72);
    reasons.push("shared_entities_cluster");
    matchedFields.push("shared_entities");
  }

  if (
    sameSource &&
    templateSignals.titleSkeletonSimilarity >= 0.8 &&
    templateSignals.summarySkeletonSimilarity >= 0.8 &&
    hourDistance <= CLUSTER_WINDOW_HOURS
  ) {
    score = Math.max(score, 0.76);
    reasons.push("same_source_same_skeleton_window");
    matchedFields.push("skeleton_window");
  }

  if (dayDistance > FAR_APART_DAYS && left.normalizedTitle === right.normalizedTitle && left.normalizedUrl !== right.normalizedUrl) {
    score = Math.min(score, 0.64);
    reasons.push("same_title_but_far_apart");
  }

  if (
    !sameSource &&
    sharedEntityScore < 0.3 &&
    templateSignals.summarySkeletonSimilarity < 0.45 &&
    summaryTokenOverlap < 0.35 &&
    left.fingerprintFields.coreAction !== right.fingerprintFields.coreAction
  ) {
    score = Math.min(score, 0.6);
    reasons.push("different_entities_or_event");
  }

  if (
    sameSource &&
    templateSignals.titleSkeletonMatch &&
    templateSignals.summarySkeletonMatch &&
    hourDistance <= 24
  ) {
    reasons.push("within_24h");
    matchedFields.push("within_24h");
  }

  const isDuplicate =
    score >= DUPLICATE_THRESHOLD ||
    (score >= PROBABLE_DUPLICATE_THRESHOLD && hourDistance <= DUPLICATE_WINDOW_HOURS) ||
    left.normalizedUrl === right.normalizedUrl;
  const shouldCluster =
    isDuplicate ||
    (score >= PROBABLE_DUPLICATE_THRESHOLD && hourDistance <= CLUSTER_WINDOW_HOURS) ||
    (score >= RELATED_CLUSTER_THRESHOLD && hourDistance <= CLUSTER_WINDOW_HOURS);

  return { isDuplicate, shouldCluster, score: Number(score.toFixed(3)), reasons, matchedFields };
}

export function compareArticles(left: NewsItem | NormalizedArticle, right: NewsItem | NormalizedArticle) {
  return compareNormalizedArticles(
    "fingerprints" in left ? left : normalizeArticle(left),
    "fingerprints" in right ? right : normalizeArticle(right),
  );
}

function createClusterId(articleIds: string[]) {
  return `cluster-${hashValue(articleIds.sort().join("|"))}`;
}

function representativeScore(article: NewsItem) {
  const sourcePriority = SOURCE_PRIORITY[article.sourceId] ?? 10;
  const summaryScore = Math.min(article.summary.length, 400) / 400;
  const recencyScore = Date.parse(article.publishedAt) / 1_000_000_000_000;
  const keywordScore = (article.tags?.length ?? 0) + (article.tickers?.length ?? 0);
  return sourcePriority * 1000 + summaryScore * 100 + recencyScore + keywordScore;
}

export function selectRepresentative(articles: NewsItem[]) {
  return [...articles].sort((left, right) => representativeScore(right) - representativeScore(left))[0]!;
}

function buildClusterSummary(clusterId: string, articles: NewsItem[]): NewsCluster {
  const representative = selectRepresentative(articles);
  const sortedArticles = [...articles].sort((left, right) => Date.parse(left.publishedAt) - Date.parse(right.publishedAt));
  const sources = uniqueTokens(articles.map((article) => article.source));
  const alternateTitles = uniqueTokens(
    articles
      .filter((article) => article.id !== representative.id)
      .map((article) => article.title),
  );

  return {
    id: clusterId,
    representativeArticleId: representative.id,
    clusterArticleIds: articles.map((article) => article.id),
    alternateSources: sources.filter((source) => source !== representative.source),
    alternateTitles,
    earliestPublishedAt: sortedArticles[0]!.publishedAt,
    latestPublishedAt: sortedArticles[sortedArticles.length - 1]!.publishedAt,
    articleCount: articles.length,
    sourceCount: uniqueTokens(articles.map((article) => article.sourceId)).length,
  };
}

function buildCandidateIds(
  article: NormalizedArticle,
  indexes: {
    canonical: Map<string, Set<string>>;
    exactUrl: Map<string, Set<string>>;
    publishedDay: Map<string, Set<string>>;
    titleDay: Map<string, Set<string>>;
    fuzzyTitle: Map<string, Set<string>>;
    event: Map<string, Set<string>>;
    entityTicker: Map<string, Set<string>>;
    entityOnly: Map<string, Set<string>>;
  },
) {
  const candidateIds = new Set<string>();
  const addFromIndex = (index: Map<string, Set<string>>, key: string | null) => {
    if (!key) return;
    const values = index.get(key);
    if (!values) return;
    for (const value of values) candidateIds.add(value);
  };

  addFromIndex(indexes.canonical, article.fingerprints.canonicalUrlKey);
  addFromIndex(indexes.exactUrl, article.fingerprints.exactUrlKey);
  addFromIndex(indexes.publishedDay, article.publishedDay);
  addFromIndex(indexes.titleDay, article.fingerprints.titleDayKey);
  addFromIndex(indexes.fuzzyTitle, article.fingerprints.fuzzyTitleKey);
  addFromIndex(indexes.event, article.fingerprints.eventKey);

  for (const entity of article.fingerprintFields.topEntities.slice(0, 2)) {
    for (const ticker of article.fingerprintFields.topTickers.slice(0, 2)) {
      addFromIndex(indexes.entityTicker, `${entity}|${ticker}` || null);
    }
    addFromIndex(indexes.entityOnly, entity);
  }

  return candidateIds;
}

function addToIndex(index: Map<string, Set<string>>, key: string | null, articleId: string) {
  if (!key) return;
  const current = index.get(key) ?? new Set<string>();
  current.add(articleId);
  index.set(key, current);
}

export function clusterArticles(articles: NewsItem[], options: DedupeOptions = {}) {
  const recentWindowDays = options.recentWindowDays ?? DEFAULT_RECENT_WINDOW_DAYS;
  const normalizedArticles = articles.map((article) => normalizeArticle(article));
  const byId = new Map(normalizedArticles.map((article) => [article.article.id, article]));
  const canonical = new Map<string, Set<string>>();
  const exactUrl = new Map<string, Set<string>>();
  const publishedDay = new Map<string, Set<string>>();
  const titleDay = new Map<string, Set<string>>();
  const fuzzyTitle = new Map<string, Set<string>>();
  const event = new Map<string, Set<string>>();
  const entityTicker = new Map<string, Set<string>>();
  const entityOnly = new Map<string, Set<string>>();
  const clusters = new Map<string, ClusterRecord>();
  const articleToCluster = new Map<string, string>();
  const stats: DedupeStats = {
    total_in: articles.length,
    total_out: 0,
    duplicates_removed: 0,
    clusters_created: 0,
    exact_url_matches: 0,
    fuzzy_title_matches: 0,
    same_event_clusters: 0,
  };

  const ordered = [...normalizedArticles].sort(
    (left, right) => Date.parse(right.normalizedPublishedAt) - Date.parse(left.normalizedPublishedAt),
  );

  for (const article of ordered) {
    const candidateIds = buildCandidateIds(article, { canonical, exactUrl, publishedDay, titleDay, fuzzyTitle, event, entityTicker, entityOnly });
    let bestMatch: { articleId: string; comparison: ComparisonResult } | null = null;

    for (const candidateId of candidateIds) {
      const candidate = byId.get(candidateId);
      if (!candidate) continue;

      const dayDistance = hoursBetween(article.normalizedPublishedAt, candidate.normalizedPublishedAt) / 24;
      if (
        article.normalizedUrl !== candidate.normalizedUrl &&
        dayDistance > recentWindowDays &&
        !(article.fingerprints.canonicalUrlKey && article.fingerprints.canonicalUrlKey === candidate.fingerprints.canonicalUrlKey)
      ) {
        continue;
      }

      const comparison = compareNormalizedArticles(article, candidate);
      if (!comparison.shouldCluster) continue;

      if (!bestMatch || comparison.score > bestMatch.comparison.score) {
        bestMatch = { articleId: candidateId, comparison };
      }
    }

    if (bestMatch) {
      const clusterId = articleToCluster.get(bestMatch.articleId)!;
      const cluster = clusters.get(clusterId)!;
      cluster.articleIds.push(article.article.id);
      cluster.debug.push({
        comparedArticleId: article.article.id,
        matchedArticleId: bestMatch.articleId,
        score: bestMatch.comparison.score,
        reasons: bestMatch.comparison.reasons,
        matchedFields: bestMatch.comparison.matchedFields,
      });
      articleToCluster.set(article.article.id, clusterId);

      if (bestMatch.comparison.reasons.includes("exact_url_key_match") || bestMatch.comparison.reasons.includes("normalized_url_match")) {
        stats.exact_url_matches += 1;
      }
      if (bestMatch.comparison.reasons.includes("high_title_similarity") || bestMatch.comparison.reasons.includes("strong_title_similarity_same_day")) {
        stats.fuzzy_title_matches += 1;
      }
      if (bestMatch.comparison.reasons.includes("event_key_or_entity_action_match") || bestMatch.comparison.reasons.includes("same_event_rewrite")) {
        stats.same_event_clusters += 1;
      }
      if (bestMatch.comparison.isDuplicate) {
        stats.duplicates_removed += 1;
      }
    } else {
      const clusterId = createClusterId([article.article.id]);
      clusters.set(clusterId, { id: clusterId, articleIds: [article.article.id], debug: [] });
      articleToCluster.set(article.article.id, clusterId);
      stats.clusters_created += 1;
    }

    addToIndex(canonical, article.fingerprints.canonicalUrlKey, article.article.id);
    addToIndex(exactUrl, article.fingerprints.exactUrlKey, article.article.id);
    addToIndex(publishedDay, article.publishedDay, article.article.id);
    addToIndex(titleDay, article.fingerprints.titleDayKey, article.article.id);
    addToIndex(fuzzyTitle, article.fingerprints.fuzzyTitleKey, article.article.id);
    addToIndex(event, article.fingerprints.eventKey, article.article.id);
    for (const entity of article.fingerprintFields.topEntities.slice(0, 2)) {
      for (const ticker of article.fingerprintFields.topTickers.slice(0, 2)) {
        addToIndex(entityTicker, `${entity}|${ticker}`, article.article.id);
      }
      addToIndex(entityOnly, entity, article.article.id);
    }
  }

  return { normalizedArticles, byId, clusters, articleToCluster, stats };
}

export function dedupeIntraSource(articles: NewsItem[], options: DedupeOptions = {}) {
  const perSource = new Map<NewsSourceId, NewsItem[]>();

  for (const article of articles) {
    const bucket = perSource.get(article.sourceId) ?? [];
    bucket.push(article);
    perSource.set(article.sourceId, bucket);
  }

  const deduped: NewsItem[] = [];
  const clusters: NewsCluster[] = [];
  const stats: DedupeStats = {
    total_in: articles.length,
    total_out: 0,
    duplicates_removed: 0,
    clusters_created: 0,
    exact_url_matches: 0,
    fuzzy_title_matches: 0,
    same_event_clusters: 0,
  };

  for (const items of perSource.values()) {
    const result = runDedupePass(items, options);
    deduped.push(...result.deduped_articles);
    clusters.push(...result.clusters);
    stats.duplicates_removed += result.stats.duplicates_removed;
    stats.clusters_created += result.stats.clusters_created;
    stats.exact_url_matches += result.stats.exact_url_matches;
    stats.fuzzy_title_matches += result.stats.fuzzy_title_matches;
    stats.same_event_clusters += result.stats.same_event_clusters;
  }

  stats.total_out = deduped.length;
  return { deduped_articles: deduped, clusters, stats };
}

export function dedupeCrossSource(articles: NewsItem[], options: DedupeOptions = {}) {
  return runDedupePass(articles, options);
}

function runDedupePass(articles: NewsItem[], options: DedupeOptions = {}): DedupeFeedResult {
  const { byId, clusters, stats } = clusterArticles(articles, options);
  const clusterSummaries = Array.from(clusters.values()).map((cluster) => {
    const clusterArticlesList = cluster.articleIds
      .map((articleId) => byId.get(articleId)?.article)
      .filter((article): article is NewsItem => Boolean(article));
    const summary = buildClusterSummary(cluster.id, clusterArticlesList);
    const representative = selectRepresentative(clusterArticlesList);
    const decoratedRepresentative: NewsItem = {
      ...representative,
      originalUrl: representative.originalUrl ?? representative.url,
      normalizedUrl: byId.get(representative.id)?.normalizedUrl ?? representative.normalizedUrl,
      canonicalUrlNormalized: byId.get(representative.id)?.canonicalUrlNormalized ?? representative.canonicalUrlNormalized ?? null,
      clusterId: summary.id,
      clusterRepresentativeArticleId: representative.id,
      clusterArticleIds: summary.clusterArticleIds,
      alternateSources: summary.alternateSources,
      alternateTitles: summary.alternateTitles,
      sourceCount: summary.sourceCount,
      articleCount: summary.articleCount,
      earliestPublishedAt: summary.earliestPublishedAt,
      latestPublishedAt: summary.latestPublishedAt,
      representativeReason: `selected_by_priority:${representative.sourceId}`,
      representativeArticleId: representative.id,
      wasHiddenAsDuplicate: false,
      duplicateType: null,
      duplicateDebug: cluster.debug,
    };

    const relatedItems = clusterArticlesList.filter((article) => article.id !== representative.id);
    for (const related of relatedItems) {
      const debugEntry = cluster.debug.find((debug) => debug.comparedArticleId === related.id);
      related.clusterId = summary.id;
      related.clusterRepresentativeArticleId = representative.id;
      related.clusterArticleIds = summary.clusterArticleIds;
      related.duplicateReason = debugEntry?.reasons.join(",") ?? "clustered_duplicate";
      related.wasHiddenAsDuplicate = true;
      related.representativeArticleId = representative.id;
      related.duplicateType = debugEntry?.reasons.includes("canonical_url_key_match") || debugEntry?.reasons.includes("exact_url_key_match")
        ? "exact"
        : debugEntry?.reasons.includes("title_skeleton_match") || debugEntry?.reasons.includes("summary_skeleton_match") || debugEntry?.reasons.includes("same_source_template_duplicate")
          ? "template"
          : debugEntry?.score && debugEntry.score >= PROBABLE_DUPLICATE_THRESHOLD
            ? "fuzzy"
            : "cluster";
      related.duplicateDebug = cluster.debug.filter(
        (debug) => debug.comparedArticleId === related.id || debug.matchedArticleId === related.id,
      );
    }

    return { summary, representative: decoratedRepresentative };
  });

  const dedupedArticles = clusterSummaries
    .map((entry) => entry.representative)
    .sort((left, right) => Date.parse(right.publishedAt) - Date.parse(left.publishedAt) || right.relevanceScore - left.relevanceScore);

  return {
    deduped_articles: dedupedArticles,
    clusters: clusterSummaries.map((entry) => entry.summary),
    stats: {
      ...stats,
      total_out: dedupedArticles.length,
    },
  };
}

export function dedupeFeed(articles: NewsItem[], options: DedupeOptions = {}): DedupeFeedResult {
  const intraSource = dedupeIntraSource(articles, options);
  const crossSource = dedupeCrossSource(intraSource.deduped_articles, options);

  return {
    deduped_articles: crossSource.deduped_articles,
    clusters: [...intraSource.clusters, ...crossSource.clusters],
    stats: {
      total_in: articles.length,
      total_out: crossSource.deduped_articles.length,
      duplicates_removed: intraSource.stats.duplicates_removed + crossSource.stats.duplicates_removed,
      clusters_created: intraSource.stats.clusters_created + crossSource.stats.clusters_created,
      exact_url_matches: intraSource.stats.exact_url_matches + crossSource.stats.exact_url_matches,
      fuzzy_title_matches: intraSource.stats.fuzzy_title_matches + crossSource.stats.fuzzy_title_matches,
      same_event_clusters: intraSource.stats.same_event_clusters + crossSource.stats.same_event_clusters,
    },
  };
}

export { normalizeArticle, buildSkeleton, buildTimeBucket as buildApproximateTimeBucket };
