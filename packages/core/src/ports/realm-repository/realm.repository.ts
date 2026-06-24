import type { Issue } from "../../entities/issue/issue.js";
import type { Milestone } from "../../entities/milestone/milestone.js";
import type { Project } from "../../entities/project/project.js";
import type { Spec } from "../../entities/spec/spec.js";
import type { Trace, TraceEvent } from "../../entities/trace/trace.js";
import type { IssueId } from "../../value-objects/issue-id/issue-id.js";
import type { MilestoneId } from "../../value-objects/milestone-id/milestone-id.js";
import type { ProjectId } from "../../value-objects/project-id/project-id.js";
import type { SpecId } from "../../value-objects/spec-id/spec-id.js";

export interface TraceFilter {
  projectId?: ProjectId;
  issueId?: IssueId;
  specId?: SpecId;
  actor?: string;
  event?: TraceEvent;
  since?: Date;
}

export type CounterKey = "project" | "milestone" | "issue" | "spec";

export interface RealmState {
  counters: {
    project: number;
    milestone: number;
    issue: number;
    spec: number;
  };
}

export interface IRealmRepository {
  findProject(id: ProjectId): Promise<Project | null>;
  findAllProjects(): Promise<Project[]>;
  saveProject(project: Project): Promise<void>;

  findMilestone(id: MilestoneId): Promise<Milestone | null>;
  findMilestonesForProject(projectId: ProjectId): Promise<Milestone[]>;
  findAllMilestones(): Promise<Milestone[]>;
  saveMilestone(milestone: Milestone): Promise<void>;

  findIssue(id: IssueId): Promise<Issue | null>;
  findIssuesForProject(projectId: ProjectId): Promise<Issue[]>;
  findAllIssues(): Promise<Issue[]>;
  saveIssue(issue: Issue): Promise<void>;
  /** Delete every on-disk file claiming this issue id. No-op if none exist. */
  deleteIssue(id: IssueId): Promise<void>;

  findSpec(id: SpecId): Promise<Spec | null>;
  findSpecsForProject(projectId: ProjectId): Promise<Spec[]>;
  findAllSpecs(): Promise<Spec[]>;
  saveSpec(spec: Spec): Promise<void>;

  appendTrace(trace: Trace): Promise<void>;
  findTraces(filter: TraceFilter): Promise<Trace[]>;

  getState(): Promise<RealmState>;
  incrementCounter(entity: CounterKey): Promise<number>;
}
