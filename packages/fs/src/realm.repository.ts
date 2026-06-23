import * as fs from "node:fs/promises";
import * as path from "node:path";
import type {
  CounterKey,
  IGitAdapter,
  IRealmRepository,
  Issue,
  Milestone,
  Project,
  RealmState,
  Spec,
  Trace,
  TraceFilter,
} from "@roadkit/core";
import type { IssueId, MilestoneId, ProjectId, SpecId } from "@roadkit/core";
import { getState, incrementCounter } from "./config/state.manager.js";
import {
  ISSUES_DIR,
  MD_EXT,
  MILESTONES_DIR,
  PROJECTS_DIR,
  ROADKIT_DIR,
  SPECS_DIR,
  TRACES_DIR,
} from "./constants.js";
import { parseIssue } from "./parsers/issue.parser.js";
import { parseMilestone } from "./parsers/milestone.parser.js";
import { parseProject } from "./parsers/project.parser.js";
import { parseSpec } from "./parsers/spec.parser.js";
import { parseTrace } from "./parsers/trace.parser.js";
import { serializeIssue } from "./serializers/issue.serializer.js";
import { serializeMilestone } from "./serializers/milestone.serializer.js";
import { serializeProject } from "./serializers/project.serializer.js";
import { serializeSpec } from "./serializers/spec.serializer.js";
import { serializeTrace } from "./serializers/trace.serializer.js";
import { slugify } from "./slug.js";

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readdirSafe(dir: string): Promise<string[]> {
  try {
    return await fs.readdir(dir);
  } catch {
    return [];
  }
}

/**
 * A project directory is named `${id}` or `${id}-<slug>`. This matches the id
 * portion at the start of a directory entry.
 */
function dirMatchesId(entry: string, id: string): boolean {
  return entry === id || entry.startsWith(`${id}-`);
}

function applyTraceFilter(traces: Trace[], filter: TraceFilter): Trace[] {
  return traces.filter((t) => {
    if (filter.projectId && !t.projectId.equals(filter.projectId)) return false;
    if (filter.issueId && !t.issueId?.equals(filter.issueId)) return false;
    if (filter.specId && !t.specId?.equals(filter.specId)) return false;
    if (filter.actor && t.actor !== filter.actor) return false;
    if (filter.event && t.event !== filter.event) return false;
    if (filter.since && t.at < filter.since) return false;
    return true;
  });
}

export class FsRealmRepository implements IRealmRepository {
  constructor(
    private readonly realmRoot: string,
    private readonly git?: IGitAdapter
  ) {}

  private get projectsRoot(): string {
    return path.join(this.realmRoot, ROADKIT_DIR, PROJECTS_DIR);
  }

  /** Resolve the on-disk directory for a project id, or null if absent. */
  private async findProjectDir(id: ProjectId): Promise<string | null> {
    const target = id.toString();
    for (const entry of await readdirSafe(this.projectsRoot)) {
      if (dirMatchesId(entry, target)) {
        return path.join(this.projectsRoot, entry);
      }
    }
    return null;
  }

  private async stage(filePath: string): Promise<void> {
    if (this.git) {
      await this.git.stage([filePath]);
    }
  }

  // ----- Project -----

  async findProject(id: ProjectId): Promise<Project | null> {
    const dir = await this.findProjectDir(id);
    if (!dir) return null;
    const filePath = path.join(dir, `${id.toString()}${MD_EXT}`);
    if (!(await fileExists(filePath))) return null;
    try {
      return parseProject(await fs.readFile(filePath, "utf-8"));
    } catch {
      return null;
    }
  }

  async findAllProjects(): Promise<Project[]> {
    const projects: Project[] = [];
    for (const entry of await readdirSafe(this.projectsRoot)) {
      if (!entry.startsWith("PROJ-")) continue;
      // The project file is named after the id, without slug.
      const idPart = entry.split("-").slice(0, 2).join("-");
      const filePath = path.join(this.projectsRoot, entry, `${idPart}${MD_EXT}`);
      if (!(await fileExists(filePath))) continue;
      try {
        projects.push(parseProject(await fs.readFile(filePath, "utf-8")));
      } catch {
        // skip malformed
      }
    }
    return projects;
  }

  async saveProject(project: Project): Promise<void> {
    const id = project.id.toString();
    const existing = await this.findProjectDir(project.id);
    const dir = existing ?? path.join(this.projectsRoot, `${id}-${slugify(project.title)}`);
    await fs.mkdir(dir, { recursive: true });
    const filePath = path.join(dir, `${id}${MD_EXT}`);
    await fs.writeFile(filePath, serializeProject(project), "utf-8");
    await this.stage(filePath);
  }

  // ----- Generic child helpers -----

  private async childDir(projectId: ProjectId, subdir: string): Promise<string | null> {
    const projectDir = await this.findProjectDir(projectId);
    if (!projectDir) return null;
    return path.join(projectDir, subdir);
  }

  private async readEntities<T>(
    subdir: string,
    prefix: string,
    parse: (content: string) => T,
    projectId?: ProjectId
  ): Promise<T[]> {
    const projectDirs: string[] = [];
    if (projectId) {
      const dir = await this.findProjectDir(projectId);
      if (dir) projectDirs.push(dir);
    } else {
      for (const entry of await readdirSafe(this.projectsRoot)) {
        if (entry.startsWith("PROJ-")) projectDirs.push(path.join(this.projectsRoot, entry));
      }
    }

    const result: T[] = [];
    for (const projectDir of projectDirs) {
      const dir = path.join(projectDir, subdir);
      for (const entry of await readdirSafe(dir)) {
        if (!entry.endsWith(MD_EXT) || !entry.startsWith(prefix)) continue;
        try {
          result.push(parse(await fs.readFile(path.join(dir, entry), "utf-8")));
        } catch {
          // skip malformed
        }
      }
    }
    return result;
  }

  private async writeChild(
    projectId: ProjectId,
    subdir: string,
    id: string,
    title: string,
    content: string
  ): Promise<void> {
    const dir = await this.childDir(projectId, subdir);
    if (!dir) {
      throw new Error(`Cannot save under unknown project ${projectId.toString()}`);
    }
    await fs.mkdir(dir, { recursive: true });
    const filePath = path.join(dir, `${id}-${slugify(title)}${MD_EXT}`);
    await fs.writeFile(filePath, content, "utf-8");
    await this.stage(filePath);
  }

  // ----- Milestone -----

  async findMilestone(id: MilestoneId): Promise<Milestone | null> {
    const all = await this.readEntities(MILESTONES_DIR, id.toString(), parseMilestone);
    return all.find((m) => m.id.equals(id)) ?? null;
  }

  async findMilestonesForProject(projectId: ProjectId): Promise<Milestone[]> {
    return this.readEntities(MILESTONES_DIR, "MILE-", parseMilestone, projectId);
  }

  async findAllMilestones(): Promise<Milestone[]> {
    return this.readEntities(MILESTONES_DIR, "MILE-", parseMilestone);
  }

  async saveMilestone(milestone: Milestone): Promise<void> {
    await this.writeChild(
      milestone.projectId,
      MILESTONES_DIR,
      milestone.id.toString(),
      milestone.title,
      serializeMilestone(milestone)
    );
  }

  // ----- Issue -----

  async findIssue(id: IssueId): Promise<Issue | null> {
    const all = await this.readEntities(ISSUES_DIR, id.toString(), parseIssue);
    return all.find((i) => i.id.equals(id)) ?? null;
  }

  async findIssuesForProject(projectId: ProjectId): Promise<Issue[]> {
    return this.readEntities(ISSUES_DIR, "ISSUE-", parseIssue, projectId);
  }

  async findAllIssues(): Promise<Issue[]> {
    return this.readEntities(ISSUES_DIR, "ISSUE-", parseIssue);
  }

  async saveIssue(issue: Issue): Promise<void> {
    await this.writeChild(
      issue.projectId,
      ISSUES_DIR,
      issue.id.toString(),
      issue.title,
      serializeIssue(issue)
    );
  }

  // ----- Spec -----

  async findSpec(id: SpecId): Promise<Spec | null> {
    const all = await this.readEntities(SPECS_DIR, id.toString(), parseSpec);
    return all.find((s) => s.id.equals(id)) ?? null;
  }

  async findSpecsForProject(projectId: ProjectId): Promise<Spec[]> {
    return this.readEntities(SPECS_DIR, "SPEC-", parseSpec, projectId);
  }

  async findAllSpecs(): Promise<Spec[]> {
    return this.readEntities(SPECS_DIR, "SPEC-", parseSpec);
  }

  async saveSpec(spec: Spec): Promise<void> {
    await this.writeChild(
      spec.projectId,
      SPECS_DIR,
      spec.id.toString(),
      spec.title,
      serializeSpec(spec)
    );
  }

  // ----- Trace -----

  async appendTrace(trace: Trace): Promise<void> {
    const dir = await this.childDir(trace.projectId, TRACES_DIR);
    if (!dir) {
      throw new Error(`Cannot append trace under unknown project ${trace.projectId.toString()}`);
    }
    await fs.mkdir(dir, { recursive: true });
    const filePath = path.join(dir, `${trace.id.toString()}${MD_EXT}`);
    await fs.writeFile(filePath, serializeTrace(trace), "utf-8");
    await this.stage(filePath);
  }

  async findTraces(filter: TraceFilter): Promise<Trace[]> {
    const traces = await this.readEntities(TRACES_DIR, "TRACE-", parseTrace, filter.projectId);
    return applyTraceFilter(traces, filter);
  }

  // ----- State -----

  async getState(): Promise<RealmState> {
    return getState(this.realmRoot);
  }

  async incrementCounter(entity: CounterKey): Promise<number> {
    return incrementCounter(this.realmRoot, entity);
  }
}
