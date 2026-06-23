import { Issue, Trace } from "../../entities/index.js";
import type { CreateIssueParams } from "../../entities/index.js";
import { MilestoneNotFoundError, ProjectNotFoundError } from "../../errors/index.js";
import type { IRealmRepository } from "../../ports/index.js";
import { IssueId, TraceId } from "../../value-objects/index.js";

type CreateIssueInput = Omit<CreateIssueParams, "id"> & {
  actor?: string;
  actorType?: "human" | "agent";
};

export class CreateIssueUseCase {
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

    const trace = Trace.create({
      id: TraceId.generate(),
      projectId: input.projectId,
      issueId: id,
      actor: input.actor ?? input.author,
      actorType: input.actorType ?? "human",
      event: "issue_created",
    });
    await this.repo.appendTrace(trace);

    return issue;
  }
}
