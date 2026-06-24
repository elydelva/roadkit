import { ProjectId, type ProjectStatus } from "@roadkit/core";
import type { Container } from "../../container.js";
import { setJsonMode } from "../json-mode.js";
import { getFormatter } from "../output.js";
import { fail, resolveAuthor, serializeProject } from "../shared.js";

const PROJECT_STATUSES: ReadonlySet<string> = new Set([
  "planned",
  "active",
  "paused",
  "completed",
  "cancelled",
]);

interface StatusOptions {
  json?: boolean;
}

export async function runProjectStatus(
  container: Container,
  idRaw: string,
  statusRaw: string,
  opts: StatusOptions = {}
): Promise<void> {
  setJsonMode(opts.json ?? false);
  if (!PROJECT_STATUSES.has(statusRaw)) {
    fail(`Invalid status: ${statusRaw} (expected planned|active|paused|completed|cancelled)`);
  }

  const project = await container.setProjectStatus.execute({
    id: ProjectId.from(idRaw),
    to: statusRaw as ProjectStatus,
    actor: resolveAuthor(),
  });

  getFormatter(opts.json ?? false).emit({
    json: serializeProject(project),
    human: () => console.log(`✓ ${project.id.toString()} → ${project.status}`),
  });
}

export async function runProjectStart(
  container: Container,
  idRaw: string,
  opts: StatusOptions = {}
): Promise<void> {
  await runProjectStatus(container, idRaw, "active", opts);
}
