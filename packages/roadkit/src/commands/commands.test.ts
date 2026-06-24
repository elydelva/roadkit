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
  DEFAULT_CONFIG,
  GetContextUseCase,
  GetHistoryUseCase,
  GetNextUseCase,
  ProjectId,
  SetMilestoneStatusUseCase,
  SetProjectStatusUseCase,
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
import { setJsonMode } from "./json-mode.js";
import { runMilestoneNew } from "./milestone/new.js";
import { runMilestoneStart, runMilestoneStatus } from "./milestone/status.js";
import { runNext } from "./next.js";
import { runProjectList } from "./project/list.js";
import { runProjectNew } from "./project/new.js";
import { runProjectStart, runProjectStatus } from "./project/status.js";
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
    config: DEFAULT_CONFIG,
    repo,
    createProject: new CreateProjectUseCase(repo),
    createMilestone: new CreateMilestoneUseCase(repo),
    createIssue: new CreateIssueUseCase(repo),
    startIssue: new StartIssueUseCase(repo),
    completeIssue: new CompleteIssueUseCase(repo),
    createSpec: new CreateSpecUseCase(repo),
    setSpecStatus: new SetSpecStatusUseCase(repo),
    setProjectStatus: new SetProjectStatusUseCase(repo),
    setMilestoneStatus: new SetMilestoneStatusUseCase(repo),
    getNext: new GetNextUseCase(repo),
    getContext: new GetContextUseCase(repo),
    getHistory: new GetHistoryUseCase(repo),
  };
}

function captureError(): { lines: string[]; restore: () => void } {
  const lines: string[] = [];
  const original = console.error;
  console.error = (...args: unknown[]) => {
    lines.push(args.map((a) => (typeof a === "string" ? a : String(a))).join(" "));
  };
  return {
    lines,
    restore: () => {
      console.error = original;
    },
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

  it("context prints a human-readable summary with filters", async () => {
    await runInit(tempDir);
    const container = testContainer(tempDir);
    await runProjectNew(container, { title: "Checkout revamp" });
    await runMilestoneNew(container, { project: "PROJ-0001", title: "MVP", order: "1" });
    await runIssueAdd(container, {
      project: "PROJ-0001",
      milestone: "MILE-0001",
      title: "Fix auth redirect",
      priority: "high",
    });
    await runSpecNew(container, { project: "PROJ-0001", title: "Auth approach", tags: "auth" });

    const cap = captureLog();
    await runContext(container, {});
    cap.restore();
    const out = cap.lines.join("\n");
    expect(out).toContain("Projects: 1");
    expect(out).toContain("PROJ-0001");
    expect(out).toContain("MILE-0001");
    expect(out).toContain("ISSUE-0001");
    expect(out).toContain("SPEC-0001");
    expect(out).toContain("(high)");

    // --project filter exercises the ContextFilter.projectId branch.
    const projectCap = captureLog();
    await runContext(container, { project: "PROJ-0001" });
    projectCap.restore();
    expect(projectCap.lines.join("\n")).toContain("PROJ-0001");

    // --active filter exercises the ContextFilter.activeOnly branch (project is
    // still pending, so no project body is rendered — just the summary line).
    const activeCap = captureLog();
    await runContext(container, { active: true });
    activeCap.restore();
    expect(activeCap.lines.join("\n")).toContain("Projects: 0");
  });

  it("context handles an empty realm", async () => {
    await runInit(tempDir);
    const container = testContainer(tempDir);

    const cap = captureLog();
    await runContext(container, {});
    cap.restore();
    expect(cap.lines.join("\n")).toContain("Projects: 0");
  });

  it("history prints human-readable rows and honours filters", async () => {
    await runInit(tempDir);
    const container = testContainer(tempDir);
    await runProjectNew(container, { title: "Checkout revamp" });
    await runIssueAdd(container, {
      project: "PROJ-0001",
      title: "Fix auth redirect",
      priority: "high",
    });
    await runIssueStart(container, "ISSUE-0001");

    const cap = captureLog();
    await runHistory(container, {});
    cap.restore();
    const out = cap.lines.join("\n");
    expect(out).toContain("project_created");
    expect(out).toContain("issue_started");
    // formatTrace renders the from → to transition for status changes.
    expect(out).toContain("→");

    const filteredCap = captureLog();
    await runHistory(container, {
      project: "PROJ-0001",
      issue: "ISSUE-0001",
      event: "issue_started",
      since: "2000-01-01",
    });
    filteredCap.restore();
    expect(filteredCap.lines.join("\n")).toContain("issue_started");

    const actorCap = captureLog();
    await runHistory(container, { actor: "no-such-actor" });
    actorCap.restore();
    expect(actorCap.lines.join("\n")).toBe("No history found.");
  });

  it("history rejects an invalid --since", async () => {
    await runInit(tempDir);
    const container = testContainer(tempDir);

    const originalExit = process.exit;
    const originalError = console.error;
    const errors: string[] = [];
    console.error = (...args: unknown[]) => {
      errors.push(args.map(String).join(" "));
    };
    // @ts-expect-error test stub that throws to short-circuit `never`.
    process.exit = () => {
      throw new Error("exit");
    };
    try {
      await expect(runHistory(container, { since: "not-a-date" })).rejects.toThrow("exit");
      expect(errors.join("\n")).toContain("Invalid --since");
    } finally {
      process.exit = originalExit;
      console.error = originalError;
    }
  });

  it("next reports no eligible issue and emits JSON", async () => {
    await runInit(tempDir);
    const container = testContainer(tempDir);

    const cap = captureLog();
    await runNext(container, {});
    cap.restore();
    expect(cap.lines.join("\n")).toBe("No eligible issue.");

    const jsonCap = captureLog();
    await runNext(container, { json: true });
    jsonCap.restore();
    expect(JSON.parse(jsonCap.lines.join("\n"))).toBeNull();
  });

  it("next emits JSON for an eligible issue", async () => {
    await runInit(tempDir);
    const container = testContainer(tempDir);
    await runProjectNew(container, { title: "Checkout revamp" });
    await runMilestoneNew(container, { project: "PROJ-0001", title: "MVP", order: "1" });
    await runIssueAdd(container, {
      project: "PROJ-0001",
      milestone: "MILE-0001",
      title: "Fix auth redirect",
      priority: "high",
    });
    const project = await container.repo.findProject(ProjectId.from("PROJ-0001"));
    if (!project) throw new Error("project missing");
    await container.repo.saveProject({ ...project, status: "active" });

    const cap = captureLog();
    await runNext(container, { json: true });
    cap.restore();
    const result = JSON.parse(cap.lines.join("\n"));
    expect(result.issue.id).toBe("ISSUE-0001");
    expect(result.project.id).toBe("PROJ-0001");
    expect(result.milestone.id).toBe("MILE-0001");
  });

  it("project list prints projects and the empty case", async () => {
    await runInit(tempDir);
    const container = testContainer(tempDir);

    const emptyCap = captureLog();
    await runProjectList(container, {});
    emptyCap.restore();
    expect(emptyCap.lines.join("\n")).toBe("No projects.");

    await runProjectNew(container, { title: "Checkout revamp" });

    const cap = captureLog();
    await runProjectList(container, {});
    cap.restore();
    const out = cap.lines.join("\n");
    expect(out).toContain("PROJ-0001");
    expect(out).toContain("Checkout revamp");
  });

  it("mutations emit the created/updated entity as JSON", async () => {
    await runInit(tempDir);
    const container = testContainer(tempDir);

    const projCap = captureLog();
    await runProjectNew(container, { title: "Checkout revamp", json: true });
    projCap.restore();
    const proj = JSON.parse(projCap.lines.join("\n"));
    expect(proj.id).toBe("PROJ-0001");
    expect(proj.status).toBe("planned");

    const statusCap = captureLog();
    await runProjectStart(container, "PROJ-0001", { json: true });
    statusCap.restore();
    expect(JSON.parse(statusCap.lines.join("\n")).status).toBe("active");

    // Explicit status path (planned→paused→active) covers runProjectStatus directly.
    const pauseCap = captureLog();
    await runProjectStatus(container, "PROJ-0001", "paused", { json: true });
    pauseCap.restore();
    expect(JSON.parse(pauseCap.lines.join("\n")).status).toBe("paused");
    await runProjectStatus(container, "PROJ-0001", "active");

    const mileCap = captureLog();
    await runMilestoneNew(container, {
      project: "PROJ-0001",
      title: "MVP",
      order: "1",
      json: true,
    });
    mileCap.restore();
    expect(JSON.parse(mileCap.lines.join("\n")).id).toBe("MILE-0001");

    const mileStatusCap = captureLog();
    await runMilestoneStart(container, "MILE-0001", { json: true });
    mileStatusCap.restore();
    expect(JSON.parse(mileStatusCap.lines.join("\n")).status).toBe("active");

    const issueCap = captureLog();
    await runIssueAdd(container, {
      project: "PROJ-0001",
      milestone: "MILE-0001",
      title: "Fix auth redirect",
      priority: "high",
      json: true,
    });
    issueCap.restore();
    const issue = JSON.parse(issueCap.lines.join("\n"));
    expect(issue.id).toBe("ISSUE-0001");
    expect(issue.priority).toBe("high");

    const startCap = captureLog();
    await runIssueStart(container, "ISSUE-0001", { json: true });
    startCap.restore();
    expect(JSON.parse(startCap.lines.join("\n")).status).toBe("in-progress");

    const completeCap = captureLog();
    await runIssueComplete(container, "ISSUE-0001", { json: true });
    completeCap.restore();
    expect(JSON.parse(completeCap.lines.join("\n")).status).toBe("completed");

    const specCap = captureLog();
    await runSpecNew(container, { project: "PROJ-0001", title: "Auth approach", json: true });
    specCap.restore();
    expect(JSON.parse(specCap.lines.join("\n")).id).toBe("SPEC-0001");

    const specStatusCap = captureLog();
    await runSpecStatus(container, "SPEC-0001", "proposed", { json: true });
    specStatusCap.restore();
    expect(JSON.parse(specStatusCap.lines.join("\n")).status).toBe("proposed");
  });

  it("emits a structured error envelope under --json and exits non-zero", async () => {
    await runInit(tempDir);
    const container = testContainer(tempDir);
    await runProjectNew(container, { title: "Checkout revamp" });

    const originalExit = process.exit;
    const errCap = captureError();
    // @ts-expect-error test stub that throws to short-circuit `never`.
    process.exit = () => {
      throw new Error("exit");
    };
    try {
      await expect(
        runIssueAdd(container, {
          project: "PROJ-0001",
          title: "Bad",
          priority: "NOPE",
          json: true,
        })
      ).rejects.toThrow("exit");
      const payload = JSON.parse(errCap.lines.join("\n"));
      expect(payload.error.code).toBe("ValidationError");
      expect(payload.error.message).toContain("Invalid --priority");
    } finally {
      process.exit = originalExit;
      errCap.restore();
      setJsonMode(false);
    }
  });
});
