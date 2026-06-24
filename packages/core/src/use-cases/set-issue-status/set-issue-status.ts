import type { Issue } from "../../entities/index.js";
import { GatesNotClearedError, IssueNotFoundError } from "../../errors/index.js";
import type { IRealmRepository } from "../../ports/index.js";
import { DAGService, StateMachineService } from "../../services/index.js";
import type { IssueId, IssueStatus } from "../../value-objects/index.js";
import { recordTrace } from "../record-trace.js";
import type { UseCase } from "../use-case.js";

interface SetIssueStatusInput {
  id: IssueId;
  to: IssueStatus;
  actor: string;
  actorType?: "human" | "agent";
  note?: string;
}

/**
 * Generic issue status transition (block, skip, abandon, unblock, …). Mirrors
 * the spec/project/milestone status commands. Like `complete`, a transition to
 * `completed` still requires all gates cleared, and `startedAt`/`completedAt`
 * are stamped to keep them consistent with `start`/`complete`.
 */
export class SetIssueStatusUseCase implements UseCase<SetIssueStatusInput, Issue> {
  private readonly stateMachine = new StateMachineService();
  private readonly dagService = new DAGService();

  constructor(private readonly repo: IRealmRepository) {}

  async execute(input: SetIssueStatusInput): Promise<Issue> {
    const issue = await this.repo.findIssue(input.id);
    if (!issue) {
      throw new IssueNotFoundError(input.id.toString());
    }

    this.stateMachine.validateIssueTransition(issue.status, input.to);

    if (input.to === "completed") {
      const allIssues = await this.repo.findAllIssues();
      if (!this.dagService.areGatesCleared(issue, allIssues)) {
        throw new GatesNotClearedError(issue.id.toString());
      }
    }

    const now = new Date();
    const updated: Issue = {
      ...issue,
      status: input.to,
      updatedAt: now,
      ...(input.to === "in-progress" && !issue.startedAt ? { startedAt: now } : {}),
      ...(input.to === "completed" ? { completedAt: now } : {}),
    };
    await this.repo.saveIssue(updated);

    await recordTrace(this.repo, {
      projectId: issue.projectId,
      issueId: issue.id,
      actor: input.actor,
      actorType: input.actorType ?? "human",
      event: "issue_status_changed",
      from: issue.status,
      to: input.to,
      body: input.note,
    });

    return updated;
  }
}
