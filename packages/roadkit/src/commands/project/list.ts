import type { Container } from "../../container.js";
import { serializeProject } from "../shared.js";

interface ProjectListOptions {
  json?: boolean;
}

export async function runProjectList(
  container: Container,
  opts: ProjectListOptions
): Promise<void> {
  const projects = await container.repo.findAllProjects();

  if (opts.json) {
    console.log(JSON.stringify(projects.map(serializeProject), null, 2));
    return;
  }

  if (projects.length === 0) {
    console.log("No projects.");
    return;
  }

  for (const p of projects) {
    console.log(`${p.id.toString()}  ${p.title}  [${p.status}]`);
  }
}
