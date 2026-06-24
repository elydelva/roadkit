import type { Issue } from "../../entities/index.js";
import { IssueNotFoundError } from "../../errors/index.js";
import type { IRealmRepository } from "../../ports/index.js";
import type { IssueId, MilestoneId, Priority } from "../../value-objects/index.js";
import { recordTrace } from "../record-trace.js";
import type { UseCase } from "../use-case.js";

/**
 * A patch of issue fields. Only keys present are changed; a key set to `null`
 * clears the field (milestone/assignee/branch/parent). Fields absent from the
 * patch are left untouched.
 */
export interface EditIssuePatch {
  title?: string;
  priority?: Priority;
  estimate?: number | null;
  milestoneId?: MilestoneId | null;
  assignee?: string | null;
  branch?: string | null;
  labels?: string[];
  parentId?: IssueId | null;
  gates?: Array<IssueId | string>;
}

interface EditIssueInput extends EditIssuePatch {
  id: IssueId;
  actor: string;
  actorType?: "human" | "agent";
  note?: string;
}

export class EditIssueUseCase implements UseCase<EditIssueInput, Issue> {
  constructor(private readonly repo: IRealmRepository) {}

  async execute(input: EditIssueInput): Promise<Issue> {
    const issue = await this.repo.findIssue(input.id);
    if (!issue) {
      throw new IssueNotFoundError(input.id.toString());
    }

    const updated: Issue = { ...issue, updatedAt: new Date() };
    if (input.title !== undefined) updated.title = input.title;
    if (input.priority !== undefined) updated.priority = input.priority;
    if (input.estimate !== undefined) updated.estimate = input.estimate;
    if (input.milestoneId !== undefined) updated.milestoneId = input.milestoneId;
    if (input.assignee !== undefined) updated.assignee = input.assignee;
    if (input.branch !== undefined) updated.branch = input.branch;
    if (input.labels !== undefined) updated.labels = input.labels;
    if (input.parentId !== undefined) updated.parentId = input.parentId;
    if (input.gates !== undefined) updated.gates = input.gates;

    await this.repo.saveIssue(updated);

    await recordTrace(this.repo, {
      projectId: issue.projectId,
      issueId: issue.id,
      actor: input.actor,
      actorType: input.actorType ?? "human",
      event: "issue_edited",
      body: input.note,
    });

    return updated;
  }
}
