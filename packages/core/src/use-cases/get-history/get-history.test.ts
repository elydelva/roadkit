import { beforeEach, describe, expect, it } from "bun:test";
import { Trace } from "../../entities/index.js";
import type { IRealmRepository } from "../../ports/index.js";
import { ProjectId, TraceId } from "../../value-objects/index.js";
import { makeInMemoryRepo } from "../in-memory-repo.test-helper.js";
import { GetHistoryUseCase } from "./get-history.js";

describe("GetHistoryUseCase", () => {
  let repo: IRealmRepository;
  let useCase: GetHistoryUseCase;
  const projectId = ProjectId.generate(1);

  beforeEach(() => {
    repo = makeInMemoryRepo();
    useCase = new GetHistoryUseCase(repo);
  });

  it("returns traces sorted by `at` ascending", async () => {
    const older: Trace = {
      ...Trace.create({
        id: TraceId.generate(),
        projectId,
        actor: "a",
        actorType: "human",
        event: "project_created",
      }),
      at: new Date("2026-01-01"),
    };
    const newer: Trace = {
      ...Trace.create({
        id: TraceId.generate(),
        projectId,
        actor: "a",
        actorType: "human",
        event: "issue_created",
      }),
      at: new Date("2026-02-01"),
    };
    await repo.appendTrace(newer);
    await repo.appendTrace(older);

    const result = await useCase.execute();
    expect(result.map((t) => t.event)).toEqual(["project_created", "issue_created"]);
  });

  it("applies a filter", async () => {
    await repo.appendTrace(
      Trace.create({
        id: TraceId.generate(),
        projectId,
        actor: "alice",
        actorType: "human",
        event: "note",
      })
    );
    await repo.appendTrace(
      Trace.create({
        id: TraceId.generate(),
        projectId,
        actor: "bob",
        actorType: "human",
        event: "note",
      })
    );
    const result = await useCase.execute({ actor: "alice" });
    expect(result).toHaveLength(1);
    expect(result[0]?.actor).toBe("alice");
  });
});
