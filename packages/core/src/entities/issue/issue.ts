import type { IssueId } from "../../value-objects/issue-id/issue-id.js";
import type { MilestoneId } from "../../value-objects/milestone-id/milestone-id.js";
import type { ProjectId } from "../../value-objects/project-id/project-id.js";
import type { IssueStatus, Priority } from "../../value-objects/status/status.js";
import type { Rule } from "../rule/rule.js";

export interface Issue {
  id: IssueId;
  projectId: ProjectId;
  milestoneId: MilestoneId | null;
  title: string;
  status: IssueStatus;
  priority: Priority;
  estimate: number | null;
  labels: string[];
  parentId: IssueId | null;
  gates: Array<IssueId | string>;
  rules: Rule[];
  assignee: string | null;
  author: string;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  body: string;
}

export interface CreateIssueParams {
  id: IssueId;
  projectId: ProjectId;
  milestoneId?: MilestoneId | null;
  title: string;
  author: string;
  priority?: Priority;
  estimate?: number | null;
  labels?: string[];
  parentId?: IssueId | null;
  gates?: Array<IssueId | string>;
  rules?: Rule[];
  assignee?: string | null;
  body?: string;
}

export const Issue = {
  create(params: CreateIssueParams): Issue {
    const now = new Date();
    return {
      id: params.id,
      projectId: params.projectId,
      milestoneId: params.milestoneId ?? null,
      title: params.title,
      status: "not-started",
      priority: params.priority ?? "none",
      estimate: params.estimate ?? null,
      labels: params.labels ?? [],
      parentId: params.parentId ?? null,
      gates: params.gates ?? [],
      rules: params.rules ?? [],
      assignee: params.assignee ?? null,
      author: params.author,
      startedAt: null,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
      body: params.body ?? "",
    };
  },
};
