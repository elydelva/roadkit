import { Trace } from "../../entities/index.js";
import type { Issue } from "../../entities/index.js";
import { IssueNotFoundError } from "../../errors/index.js";
import type { IRealmRepository } from "../../ports/index.js";
import { StateMachineService } from "../../services/index.js";
import { TraceId } from "../../value-objects/index.js";
import type { IssueId } from "../../value-objects/index.js";

interface StartIssueInput {
  id: IssueId;
  actor: string;
  actorType?: "human" | "agent";
}

export class StartIssueUseCase {
  private readonly stateMachine = new StateMachineService();

  constructor(private readonly repo: IRealmRepository) {}

  async execute(input: StartIssueInput): Promise<Issue> {
    const issue = await this.repo.findIssue(input.id);
    if (!issue) {
      throw new IssueNotFoundError(input.id.toString());
    }

    this.stateMachine.validateIssueTransition(issue.status, "in-progress");

    const now = new Date();
    const updated: Issue = {
      ...issue,
      status: "in-progress",
      startedAt: now,
      updatedAt: now,
    };
    await this.repo.saveIssue(updated);

    const trace = Trace.create({
      id: TraceId.generate(),
      projectId: issue.projectId,
      issueId: issue.id,
      actor: input.actor,
      actorType: input.actorType ?? "human",
      event: "issue_started",
      from: issue.status,
      to: "in-progress",
    });
    await this.repo.appendTrace(trace);

    return updated;
  }
}
