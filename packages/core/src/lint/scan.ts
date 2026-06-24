/**
 * Raw realm scan contract. Produced by the fs adapter (which owns YAML parsing)
 * and consumed by the lint engine. Records carry raw frontmatter — NOT parsed
 * entities — so the linter sees malformed values that the defensive entity
 * parsers would otherwise coerce or drop.
 */

export type RawEntityKind = "project" | "milestone" | "issue" | "spec";

export interface RawEntityRecord {
  kind: RawEntityKind;
  /** Realm-relative path, for human-readable findings. */
  file: string;
  /** Raw frontmatter as read from disk. */
  data: Record<string, unknown>;
}

export interface ScanDiagnostic {
  file: string;
  error: string;
}

export interface RealmScan {
  records: RawEntityRecord[];
  diagnostics: ScanDiagnostic[];
}
