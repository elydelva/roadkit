import type { Issue, Milestone, Project, Spec, Trace } from "../../entities/index.js";
import type { IRealmRepository } from "../../ports/index.js";
import type { ProjectId } from "../../value-objects/index.js";
import type { UseCase } from "../use-case.js";

export interface ContextFilter {
  projectId?: ProjectId;
  activeOnly?: boolean;
}

export interface RealmContext {
  projects: Project[];
  milestones: Milestone[];
  issues: Issue[];
  specs: Spec[];
  traces: Trace[];
}

export class GetContextUseCase implements UseCase<ContextFilter, RealmContext> {
  constructor(private readonly repo: IRealmRepository) {}

  async execute(filter: ContextFilter = {}): Promise<RealmContext> {
    let projects = filter.projectId
      ? await this.repo.findProject(filter.projectId).then((p) => (p ? [p] : []))
      : await this.repo.findAllProjects();

    if (filter.activeOnly) {
      projects = projects.filter((p) => p.status === "active");
    }

    const projectIds = new Set(projects.map((p) => p.id.toString()));

    const [allMilestones, allIssues, allSpecs] = await Promise.all([
      this.repo.findAllMilestones(),
      this.repo.findAllIssues(),
      this.repo.findAllSpecs(),
    ]);

    const milestones = allMilestones.filter((m) => projectIds.has(m.projectId.toString()));
    const issues = allIssues.filter((i) => projectIds.has(i.projectId.toString()));
    const specs = allSpecs.filter((s) => projectIds.has(s.projectId.toString()));

    const traces = await this.repo.findTraces(
      filter.projectId ? { projectId: filter.projectId } : {}
    );

    return { projects, milestones, issues, specs, traces };
  }
}
