import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import {
  CompleteIssueUseCase,
  CreateIssueUseCase,
  CreateMilestoneUseCase,
  CreateProjectUseCase,
  CreateSpecUseCase,
  GetContextUseCase,
  GetHistoryUseCase,
  GetNextUseCase,
  ProjectId,
  SetSpecStatusUseCase,
  StartIssueUseCase,
} from "@roadkit/core";
import { FsRealmRepository, ROADKIT_DIR } from "@roadkit/fs";
import type { Container } from "../container.js";
import { runContext } from "./context.js";
import { runHistory } from "./history.js";
import { runInit } from "./init.js";
import { runIssueAdd } from "./issue/add.js";
import { runIssueComplete } from "./issue/complete.js";
import { runIssueStart } from "./issue/start.js";
import { runMilestoneNew } from "./milestone/new.js";
import { runNext } from "./next.js";
import { runProjectList } from "./project/list.js";
import { runProjectNew } from "./project/new.js";
import { runSpecNew } from "./spec/new.js";
import { runSpecStatus } from "./spec/status.js";

async function mkTempDir(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "roadkit-cli-test-"));
}

// Build a git-less container so tests don't try to `git add` outside this repo.
function testContainer(realmRoot: string): Container {
  const repo = new FsRealmRepository(realmRoot);
  return {
    realmRoot,
    repo,
    createProject: new CreateProjectUseCase(repo),
    createMilestone: new CreateMilestoneUseCase(repo),
    createIssue: new CreateIssueUseCase(repo),
    startIssue: new StartIssueUseCase(repo),
    completeIssue: new CompleteIssueUseCase(repo),
    createSpec: new CreateSpecUseCase(repo),
    setSpecStatus: new SetSpecStatusUseCase(repo),
    getNext: new GetNextUseCase(repo),
    getContext: new GetContextUseCase(repo),
    getHistory: new GetHistoryUseCase(repo),
  };
}

function captureLog(): { lines: string[]; restore: () => void } {
  const lines: string[] = [];
  const original = console.log;
  console.log = (...args: unknown[]) => {
    lines.push(args.map((a) => (typeof a === "string" ? a : String(a))).join(" "));
  };
  return {
    lines,
    restore: () => {
      console.log = original;
    },
  };
}

describe("roadkit CLI commands", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkTempDir();
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it("init scaffolds the realm", async () => {
    const cap = captureLog();
    await runInit(tempDir);
    cap.restore();

    const state = JSON.parse(await fs.readFile(path.join(tempDir, ROADKIT_DIR, ".state"), "utf-8"));
    expect(state).toEqual({ project: 0, milestone: 0, issue: 0, spec: 0 });

    const templates = await fs.readdir(path.join(tempDir, ROADKIT_DIR, "templates"));
    expect(templates.sort()).toEqual(["issue.md", "milestone.md", "project.md", "spec.md"]);
  });

  it("runs the full project lifecycle end to end", async () => {
    await runInit(tempDir);
    const container = testContainer(tempDir);

    const cap = captureLog();
    await runProjectNew(container, { title: "Checkout revamp" });
    expect(cap.lines.join("\n")).toContain("PROJ-0001");
    cap.restore();

    await runMilestoneNew(container, { project: "PROJ-0001", title: "MVP", order: "1" });
    await runIssueAdd(container, {
      project: "PROJ-0001",
      milestone: "MILE-0001",
      title: "Fix auth redirect",
      priority: "high",
    });
    await runIssueStart(container, "ISSUE-0001");
    await runIssueComplete(container, "ISSUE-0001");

    // Project files landed under the project-rooted layout.
    const projectsDir = path.join(tempDir, ROADKIT_DIR, "projects");
    const projDirs = await fs.readdir(projectsDir);
    expect(projDirs.some((d) => d.startsWith("PROJ-0001"))).toBe(true);

    const issueFiles = await fs.readdir(path.join(projectsDir, projDirs[0] as string, "issues"));
    expect(issueFiles.some((f) => f.startsWith("ISSUE-0001"))).toBe(true);

    const traceFiles = await fs.readdir(path.join(projectsDir, projDirs[0] as string, "traces"));
    expect(traceFiles.length).toBeGreaterThan(0);
    expect(traceFiles.every((f) => /^TRACE-.+\.md$/.test(f))).toBe(true);
  });

  it("emits machine-readable context and history", async () => {
    await runInit(tempDir);
    const container = testContainer(tempDir);
    await runProjectNew(container, { title: "Checkout revamp" });
    await runSpecNew(container, { project: "PROJ-0001", title: "Auth approach", tags: "auth,api" });
    await runSpecStatus(container, "SPEC-0001", "proposed");

    const ctxCap = captureLog();
    await runContext(container, { json: true });
    ctxCap.restore();
    const ctx = JSON.parse(ctxCap.lines.join("\n"));
    expect(ctx.projects).toHaveLength(1);
    expect(ctx.specs).toHaveLength(1);
    expect(ctx.specs[0].status).toBe("proposed");

    const histCap = captureLog();
    await runHistory(container, { json: true });
    histCap.restore();
    const traces = JSON.parse(histCap.lines.join("\n"));
    const events = traces.map((t: { event: string }) => t.event);
    expect(events).toContain("project_created");
    expect(events).toContain("spec_status_changed");

    const listCap = captureLog();
    await runProjectList(container, { json: true });
    listCap.restore();
    expect(JSON.parse(listCap.lines.join("\n"))).toHaveLength(1);
  });

  it("next reports the eligible issue", async () => {
    await runInit(tempDir);
    const container = testContainer(tempDir);
    await runProjectNew(container, { title: "Checkout revamp" });
    await runIssueAdd(container, {
      project: "PROJ-0001",
      title: "Fix auth redirect",
      priority: "high",
    });

    // `next` only surfaces issues under active projects.
    const project = await container.repo.findProject(ProjectId.from("PROJ-0001"));
    if (!project) throw new Error("project missing");
    await container.repo.saveProject({ ...project, status: "active" });

    const cap = captureLog();
    await runNext(container, {});
    cap.restore();
    expect(cap.lines.join("\n")).toContain("ISSUE-0001");
  });
});
