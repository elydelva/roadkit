export type ProjectStatus = "planned" | "active" | "paused" | "completed" | "cancelled";

export type MilestoneStatus = "pending" | "active" | "done";

export type IssueStatus =
  | "not-started"
  | "in-progress"
  | "completed"
  | "abandoned"
  | "blocked"
  | "skipped";

export type SpecStatus =
  | "draft"
  | "proposed"
  | "accepted"
  | "superseded"
  | "deferred"
  | "abandoned";

/**
 * Priority levels are fully customizable via `RealmConfig.priority.levels`, so
 * this is an open string type. The default levels remain
 * `urgent | high | medium | low | none`.
 */
export type Priority = string;
