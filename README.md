# GlobalEcon Dashboard

GlobalEcon is a production-grade Next.js web app for comparing countries across core macroeconomic, development, and sustainability indicators using free public data.

## What it does

- Search countries, regions, indicators, and popular comparisons
- Compare 2 to 6 countries through SEO-friendly compare routes
- Explore country pages with key metrics, FAQs, and related links
- Browse indicator rankings and regional rankings
- Read built-in explainers for every key indicator
- Save favorite countries and comparisons locally
- Support premium gating, analytics, ads, sitemap, robots, and OG images

## Stack

- Next.js 15 App Router
- TypeScript
- Tailwind CSS
- TanStack Query
- Zustand-ready architecture
- Recharts
- Leaflet + OpenStreetMap
- TanStack Table
- Radix/shadcn-style primitives
- Vitest + React Testing Library
- Playwright

## Data sources

- World Bank Indicators API
- REST Countries API

## Core routes

- `/`
- `/compare`
- `/compare/[countries]`
- `/countries`
- `/country/[slug]`
- `/rankings/[indicator]`
- `/region/[region]`
- `/region/[region]/rankings/[indicator]`
- `/indicator/[indicator]`
- `/learn`
- `/pricing`
- `/about`
- `/favorites`

## Architecture

Key folders:

- `src/app`: Next.js App Router pages, metadata, sitemap, robots, OG image
- `components`: shared UI, compare controls, rankings, favorites, map, premium gates
- `lib/api`: World Bank and REST Countries adapters
- `lib/normalizers`: raw API to stable internal shape
- `lib/indicators`: strongly typed indicator registry
- `lib/repository`: app-facing data composition layer
- `lib/seo`: metadata and JSON-LD helpers
- `lib/search`: local search index and matching
- `lib/storage`: localStorage abstraction for favorites/history/preferences
- `lib/featureFlags`: premium and ads gates
- `lib/insights`: deterministic comparison summaries
- `tests/globalecon`: unit and component tests

## Local setup

1. Install dependencies:
   `npm install`
2. Start development:
   `npm run dev`
3. Open:
   `http://localhost:3100`

## Scripts

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run typecheck`
- `npm run test`
- `npm run test:e2e`
- `npm run format`

## Environment

Copy `.env.example` and adjust if needed:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_ANALYTICS_PROVIDER`
- `NEXT_PUBLIC_ENABLE_ADS`
- `NEXT_PUBLIC_ENABLE_PREMIUM`

Recommended local value:

- `NEXT_PUBLIC_SITE_URL=http://localhost:3100`

## Verification status

Validated in this workspace:

- `npm run typecheck`
- `npm run build`
- `npm run test`

Playwright scaffolding is included, but I did not run `npm run test:e2e` in this pass.
