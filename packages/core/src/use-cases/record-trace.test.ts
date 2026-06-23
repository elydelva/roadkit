import { describe, expect, it } from "bun:test";
import { IssueId, ProjectId, SpecId } from "../value-objects/index.js";
import { makeInMemoryRepo } from "./in-memory-repo.test-helper.js";
import { recordTrace } from "./record-trace.js";

const projectId = ProjectId.from("PROJ-0001");

describe("recordTrace", () => {
  it("appends a trace with a generated id and defaults", async () => {
    const repo = makeInMemoryRepo();

    await recordTrace(repo, {
      projectId,
      actor: "ely",
      event: "project_created",
    });

    const traces = await repo.findTraces({ projectId });
    expect(traces).toHaveLength(1);
    const trace = traces[0];
    if (!trace) throw new Error("expected trace");
    expect(trace.id.toString()).toMatch(/^TRACE-/);
    expect(trace.event).toBe("project_created");
    expect(trace.actor).toBe("ely");
    expect(trace.actorType).toBe("human");
    expect(trace.issueId).toBeNull();
    expect(trace.specId).toBeNull();
    expect(trace.ref).toBeNull();
    expect(trace.from).toBeNull();
    expect(trace.to).toBeNull();
  });

  it("forwards all optional fields", async () => {
    const repo = makeInMemoryRepo();
    const issueId = IssueId.from("ISSUE-0001");
    const specId = SpecId.from("SPEC-0001");

    await recordTrace(repo, {
      projectId,
      actor: "agent-x",
      actorType: "agent",
      event: "issue_started",
      issueId,
      specId,
      ref: "MILE-0001",
      from: "not-started",
      to: "in-progress",
    });

    const [trace] = await repo.findTraces({ projectId });
    if (!trace) throw new Error("expected trace");
    expect(trace.actorType).toBe("agent");
    expect(trace.event).toBe("issue_started");
    expect(trace.issueId?.toString()).toBe("ISSUE-0001");
    expect(trace.specId?.toString()).toBe("SPEC-0001");
    expect(trace.ref).toBe("MILE-0001");
    expect(trace.from).toBe("not-started");
    expect(trace.to).toBe("in-progress");
  });
});
