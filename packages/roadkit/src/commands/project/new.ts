import type { Container } from "../../container.js";
import { setJsonMode } from "../json-mode.js";
import { getFormatter } from "../output.js";
import { parseList, resolveAuthor, serializeProject } from "../shared.js";
import { requireOption } from "../validators.js";

interface ProjectNewOptions {
  title?: string;
  leads?: string;
  body?: string;
  json?: boolean;
}

export async function runProjectNew(container: Container, opts: ProjectNewOptions): Promise<void> {
  setJsonMode(opts.json ?? false);
  const title = requireOption(opts.title, "--title");

  const author = resolveAuthor();
  const project = await container.createProject.execute({
    title,
    author,
    leads: parseList(opts.leads),
    body: opts.body ?? "",
  });

  getFormatter(opts.json ?? false).emit({
    json: serializeProject(project),
    human: () => console.log(`✓ Created ${project.id.toString()} — ${project.title}`),
  });
}
