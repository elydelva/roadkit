import { Issue } from "../../entities/index.js";
import type { CreateIssueParams } from "../../entities/index.js";
import { MilestoneNotFoundError, ProjectNotFoundError } from "../../errors/index.js";
import type { IRealmRepository } from "../../ports/index.js";
import { IssueId } from "../../value-objects/index.js";
import { recordTrace } from "../record-trace.js";
import type { UseCase } from "../use-case.js";

type CreateIssueInput = Omit<CreateIssueParams, "id"> & {
  actor?: string;
  actorType?: "human" | "agent";
};

export class CreateIssueUseCase implements UseCase<CreateIssueInput, Issue> {
  constructor(private readonly repo: IRealmRepository) {}

  async execute(input: CreateIssueInput): Promise<Issue> {
    const project = await this.repo.findProject(input.projectId);
    if (!project) {
      throw new ProjectNotFoundError(input.projectId.toString());
    }

    if (input.milestoneId) {
      const milestone = await this.repo.findMilestone(input.milestoneId);
      if (!milestone) {
        throw new MilestoneNotFoundError(input.milestoneId.toString());
      }
    }

    const counter = await this.repo.incrementCounter("issue");
    const id = IssueId.generate(counter);

    const issue = Issue.create({ ...input, id });
    await this.repo.saveIssue(issue);

    await recordTrace(this.repo, {
      projectId: input.projectId,
      issueId: id,
      actor: input.actor ?? input.author,
      actorType: input.actorType ?? "human",
      event: "issue_created",
    });

    return issue;
  }
}
