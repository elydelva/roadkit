import { ProjectId, type ProjectStatus } from "@roadkit/core";
import type { Container } from "../../container.js";
import { fail, resolveAuthor } from "../shared.js";

const PROJECT_STATUSES: ReadonlySet<string> = new Set([
  "planned",
  "active",
  "paused",
  "completed",
  "cancelled",
]);

export async function runProjectStatus(
  container: Container,
  idRaw: string,
  statusRaw: string
): Promise<void> {
  if (!PROJECT_STATUSES.has(statusRaw)) {
    fail(`Invalid status: ${statusRaw} (expected planned|active|paused|completed|cancelled)`);
  }

  const project = await container.setProjectStatus.execute({
    id: ProjectId.from(idRaw),
    to: statusRaw as ProjectStatus,
    actor: resolveAuthor(),
  });

  console.log(`✓ ${project.id.toString()} → ${project.status}`);
}

export async function runProjectStart(container: Container, idRaw: string): Promise<void> {
  await runProjectStatus(container, idRaw, "active");
}
