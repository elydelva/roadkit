import { beforeEach, describe, expect, it } from "bun:test";
import { Spec } from "../../entities/index.js";
import { InvalidTransitionError, SpecNotFoundError } from "../../errors/index.js";
import type { IRealmRepository } from "../../ports/index.js";
import { ProjectId, SpecId } from "../../value-objects/index.js";
import { makeInMemoryRepo } from "../in-memory-repo.test-helper.js";
import { SetSpecStatusUseCase } from "./set-spec-status.js";

describe("SetSpecStatusUseCase", () => {
  let repo: IRealmRepository;
  let useCase: SetSpecStatusUseCase;
  const projectId = ProjectId.generate(1);

  beforeEach(() => {
    repo = makeInMemoryRepo();
    useCase = new SetSpecStatusUseCase(repo);
  });

  it("throws SpecNotFoundError when spec is missing", async () => {
    await expect(
      useCase.execute({ id: SpecId.generate(1), to: "proposed", actor: "alice" })
    ).rejects.toBeInstanceOf(SpecNotFoundError);
  });

  it("transitions a draft spec to proposed", async () => {
    const spec = Spec.create({ id: SpecId.generate(1), projectId, title: "S", author: "a" });
    await repo.saveSpec(spec);
    const updated = await useCase.execute({ id: spec.id, to: "proposed", actor: "alice" });
    expect(updated.status).toBe("proposed");
  });

  it("rejects invalid transitions", async () => {
    const spec = Spec.create({ id: SpecId.generate(1), projectId, title: "S", author: "a" });
    await repo.saveSpec(spec);
    await expect(
      useCase.execute({ id: spec.id, to: "accepted", actor: "alice" })
    ).rejects.toBeInstanceOf(InvalidTransitionError);
  });

  it("appends a spec_status_changed trace", async () => {
    const spec = Spec.create({ id: SpecId.generate(1), projectId, title: "S", author: "a" });
    await repo.saveSpec(spec);
    await useCase.execute({ id: spec.id, to: "proposed", actor: "alice" });
    const traces = await repo.findTraces({});
    expect(traces).toHaveLength(1);
    expect(traces[0]?.event).toBe("spec_status_changed");
    expect(traces[0]?.from).toBe("draft");
    expect(traces[0]?.to).toBe("proposed");
  });
});
