export const PROJECT_STRUCTURE = [
  "src/components",
  "src/pages",
  "src/hooks",
  "src/services/apis",
  "src/services/calculators",
  "src/utils",
  "src/types",
  "src/config",
  "src/mocks",
  "server"
] as const;

export const NAMING_CONVENTIONS = {
  components: "PascalCase React components in .tsx files",
  hooks: "camelCase hooks prefixed with use",
  pureCalculators: "camelCase named exports with no framework dependencies",
  adapters: "PascalCase classes or camelCase factories ending in Adapter",
  types: "PascalCase interfaces and types re-exported through src/types/index.ts"
} as const;

export const NULL_STATE_RULES = [
  "No exact API data: keep category visible with sourceType='estimated' and an explanation.",
  "Empty upstream response: surface a warning, never silently coerce to zero.",
  "Missing optional metadata: allow partial rendering and lower confidence."
] as const;

export const LOADING_STATE_RULES = [
  "Request lifecycle is tracked at page and category level.",
  "The UI can show skeletons while keeping previous successful comparisons visible.",
  "Long-running destination comparisons must expose retry without losing form state."
] as const;

export const ERROR_HANDLING_RULES = [
  "All adapter failures return normalized AdapterFailure objects.",
  "Network and rate-limit errors are retryable; validation and auth errors are not.",
  "Budget summaries collect upstream limitations into human-readable warnings."
] as const;

export const MANUAL_OVERRIDE_RULES = [
  "Every editable category keeps the original computed value for auditability.",
  "Manual overrides switch the category sourceType to 'manual' and retain the original explanation.",
  "Totals are always recalculated from category values, never patched ad hoc."
] as const;
