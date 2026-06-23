import type { Container } from "../../container.js";
import { parseList, resolveAuthor } from "../shared.js";
import { requireOption } from "../validators.js";

interface ProjectNewOptions {
  title?: string;
  leads?: string;
  body?: string;
}

export async function runProjectNew(container: Container, opts: ProjectNewOptions): Promise<void> {
  const title = requireOption(opts.title, "--title");

  const author = resolveAuthor();
  const project = await container.createProject.execute({
    title,
    author,
    leads: parseList(opts.leads),
    body: opts.body ?? "",
  });

  console.log(`✓ Created ${project.id.toString()} — ${project.title}`);
}
