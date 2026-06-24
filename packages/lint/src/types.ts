export type LintSeverity = "error" | "warning";

export interface LintFinding {
  severity: LintSeverity;
  /** Stable rule code, e.g. "references-exist". */
  code: string;
  /** Realm-relative file the finding applies to. */
  file: string;
  /** Entity id when known, else null. */
  entityId: string | null;
  message: string;
}

export interface LintReport {
  findings: LintFinding[];
  errorCount: number;
  warningCount: number;
}
