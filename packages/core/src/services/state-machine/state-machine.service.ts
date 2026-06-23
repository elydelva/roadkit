import { InvalidTransitionError } from "../../errors/errors.js";
import type {
  IssueStatus,
  MilestoneStatus,
  ProjectStatus,
  SpecStatus,
} from "../../value-objects/status/status.js";

const ISSUE_TRANSITIONS: Record<IssueStatus, IssueStatus[]> = {
  "not-started": ["in-progress", "skipped", "abandoned"],
  "in-progress": ["completed", "abandoned", "blocked"],
  blocked: ["in-progress", "abandoned"],
  skipped: [],
  completed: [],
  abandoned: [],
};

const SPEC_TRANSITIONS: Record<SpecStatus, SpecStatus[]> = {
  draft: ["proposed", "abandoned"],
  proposed: ["accepted", "abandoned", "draft"],
  accepted: ["superseded", "deferred"],
  deferred: ["accepted", "abandoned"],
  superseded: [],
  abandoned: [],
};

const PROJECT_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  planned: ["active", "cancelled"],
  active: ["paused", "completed", "cancelled"],
  paused: ["active", "cancelled"],
  completed: [],
  cancelled: [],
};

const MILESTONE_TRANSITIONS: Record<MilestoneStatus, MilestoneStatus[]> = {
  pending: ["active"],
  active: ["done", "pending"],
  done: ["active"],
};

export class StateMachineService {
  isValidIssueTransition(from: IssueStatus, to: IssueStatus): boolean {
    return ISSUE_TRANSITIONS[from].includes(to);
  }

  isValidSpecTransition(from: SpecStatus, to: SpecStatus): boolean {
    return SPEC_TRANSITIONS[from].includes(to);
  }

  isValidProjectTransition(from: ProjectStatus, to: ProjectStatus): boolean {
    return PROJECT_TRANSITIONS[from].includes(to);
  }

  isValidMilestoneTransition(from: MilestoneStatus, to: MilestoneStatus): boolean {
    return MILESTONE_TRANSITIONS[from].includes(to);
  }

  validateIssueTransition(from: IssueStatus, to: IssueStatus): void {
    if (!this.isValidIssueTransition(from, to)) {
      throw new InvalidTransitionError(from, to);
    }
  }

  validateSpecTransition(from: SpecStatus, to: SpecStatus): void {
    if (!this.isValidSpecTransition(from, to)) {
      throw new InvalidTransitionError(from, to);
    }
  }

  validateProjectTransition(from: ProjectStatus, to: ProjectStatus): void {
    if (!this.isValidProjectTransition(from, to)) {
      throw new InvalidTransitionError(from, to);
    }
  }

  validateMilestoneTransition(from: MilestoneStatus, to: MilestoneStatus): void {
    if (!this.isValidMilestoneTransition(from, to)) {
      throw new InvalidTransitionError(from, to);
    }
  }
}
