export class InvalidTransitionError extends Error {
  constructor(from: string, to: string) {
    super(`Invalid transition from "${from}" to "${to}"`);
    this.name = "InvalidTransitionError";
  }
}

export class GatesNotClearedError extends Error {
  constructor(issueId: string) {
    super(`Gates not cleared for issue "${issueId}"`);
    this.name = "GatesNotClearedError";
  }
}

export class ProjectNotFoundError extends Error {
  constructor(id: string) {
    super(`Project not found: "${id}"`);
    this.name = "ProjectNotFoundError";
  }
}

export class MilestoneNotFoundError extends Error {
  constructor(id: string) {
    super(`Milestone not found: "${id}"`);
    this.name = "MilestoneNotFoundError";
  }
}

export class IssueNotFoundError extends Error {
  constructor(id: string) {
    super(`Issue not found: "${id}"`);
    this.name = "IssueNotFoundError";
  }
}

export class SpecNotFoundError extends Error {
  constructor(id: string) {
    super(`Spec not found: "${id}"`);
    this.name = "SpecNotFoundError";
  }
}

export class InvalidIdError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidIdError";
  }
}
