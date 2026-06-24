import type { Issue } from "../../entities/index.js";
import { IssueNotFoundError } from "../../errors/index.js";
import type { IRealmRepository } from "../../ports/index.js";
import type { IssueId } from "../../value-objects/index.js";
import { recordTrace } from "../record-trace.js";
import type { UseCase } from "../use-case.js";

interface DeleteIssueInput {
  id: IssueId;
  actor: string;
  actorType?: "human" | "agent";
  note?: string;
}

/**
 * Permanently delete an issue's files. A trace is still appended (the audit log
 * is immutable and outlives the entity) so the deletion itself is recorded.
 * The deleted issue is returned for confirmation output.
 */
export class DeleteIssueUseCase implements UseCase<DeleteIssueInput, Issue> {
  constructor(private readonly repo: IRealmRepository) {}

  async execute(input: DeleteIssueInput): Promise<Issue> {
    const issue = await this.repo.findIssue(input.id);
    if (!issue) {
      throw new IssueNotFoundError(input.id.toString());
    }

    await this.repo.deleteIssue(issue.id);

    await recordTrace(this.repo, {
      projectId: issue.projectId,
      issueId: issue.id,
      actor: input.actor,
      actorType: input.actorType ?? "human",
      event: "issue_deleted",
      body: input.note,
    });

    return issue;
  }
}
