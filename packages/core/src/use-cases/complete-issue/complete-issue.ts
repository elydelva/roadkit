import type { Issue } from "../../entities/index.js";
import { GatesNotClearedError, IssueNotFoundError } from "../../errors/index.js";
import type { IRealmRepository } from "../../ports/index.js";
import { DAGService, StateMachineService } from "../../services/index.js";
import type { IssueId } from "../../value-objects/index.js";
import { recordTrace } from "../record-trace.js";
import type { UseCase } from "../use-case.js";

interface CompleteIssueInput {
  id: IssueId;
  actor: string;
  actorType?: "human" | "agent";
  note?: string;
  assignee?: string;
  branch?: string;
}

export class CompleteIssueUseCase implements UseCase<CompleteIssueInput, Issue> {
  private readonly stateMachine = new StateMachineService();
  private readonly dagService = new DAGService();

  constructor(private readonly repo: IRealmRepository) {}

  async execute(input: CompleteIssueInput): Promise<Issue> {
    const issue = await this.repo.findIssue(input.id);
    if (!issue) {
      throw new IssueNotFoundError(input.id.toString());
    }

    const allIssues = await this.repo.findAllIssues();
    if (!this.dagService.areGatesCleared(issue, allIssues)) {
      throw new GatesNotClearedError(issue.id.toString());
    }

    this.stateMachine.validateIssueTransition(issue.status, "completed");

    const now = new Date();
    const updated: Issue = {
      ...issue,
      status: "completed",
      completedAt: now,
      updatedAt: now,
      ...(input.assignee !== undefined ? { assignee: input.assignee } : {}),
      ...(input.branch !== undefined ? { branch: input.branch } : {}),
    };
    await this.repo.saveIssue(updated);

    await recordTrace(this.repo, {
      projectId: issue.projectId,
      issueId: issue.id,
      actor: input.actor,
      actorType: input.actorType ?? "human",
      event: "issue_completed",
      from: issue.status,
      to: "completed",
      body: input.note,
    });

    return updated;
  }
}
