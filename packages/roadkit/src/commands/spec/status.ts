import { SpecId, type SpecStatus } from "@roadkit/core";
import type { Container } from "../../container.js";
import { fail, resolveAuthor } from "../shared.js";

const SPEC_STATUSES: ReadonlySet<string> = new Set([
  "draft",
  "proposed",
  "accepted",
  "superseded",
  "deferred",
  "abandoned",
]);

export async function runSpecStatus(
  container: Container,
  idRaw: string,
  statusRaw: string
): Promise<void> {
  if (!SPEC_STATUSES.has(statusRaw)) {
    fail(
      `Invalid status: ${statusRaw} (expected draft|proposed|accepted|superseded|deferred|abandoned)`
    );
  }

  const spec = await container.setSpecStatus.execute({
    id: SpecId.from(idRaw),
    to: statusRaw as SpecStatus,
    actor: resolveAuthor(),
  });

  console.log(`✓ ${spec.id.toString()} → ${spec.status}`);
}
