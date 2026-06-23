import { Trace } from "../../entities/index.js";
import type { Issue } from "../../entities/index.js";
import { GatesNotClearedError, IssueNotFoundError } from "../../errors/index.js";
import type { IGitAdapter, IRealmRepository } from "../../ports/index.js";
import { DAGService, StateMachineService } from "../../services/index.js";
import { TraceId } from "../../value-objects/index.js";
import type { IssueId } from "../../value-objects/index.js";

interface CompleteIssueInput {
  id: IssueId;
  actor: string;
  actorType?: "human" | "agent";
}

export class CompleteIssueUseCase {
  private readonly stateMachine = new StateMachineService();
  private readonly dagService = new DAGService();

  constructor(
    private readonly repo: IRealmRepository,
    private readonly git?: IGitAdapter
  ) {}

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
    };
    await this.repo.saveIssue(updated);

    const trace = Trace.create({
      id: TraceId.generate(),
      projectId: issue.projectId,
      issueId: issue.id,
      actor: input.actor,
      actorType: input.actorType ?? "human",
      event: "issue_completed",
      from: issue.status,
      to: "completed",
    });
    await this.repo.appendTrace(trace);

    if (this.git) {
      await this.git.stage([
        `projects/${issue.projectId.toString()}/issues/${issue.id.toString()}`,
      ]);
    }

    return updated;
  }
}
