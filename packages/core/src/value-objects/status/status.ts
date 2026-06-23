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

export type Priority = "urgent" | "high" | "medium" | "low" | "none";
