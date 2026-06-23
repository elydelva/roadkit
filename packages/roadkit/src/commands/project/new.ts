import type { Container } from "../../container.js";
import { fail, parseList, resolveAuthor } from "../shared.js";

interface ProjectNewOptions {
  title?: string;
  leads?: string;
  body?: string;
}

export async function runProjectNew(container: Container, opts: ProjectNewOptions): Promise<void> {
  if (!opts.title) {
    fail("--title is required");
  }

  const author = resolveAuthor();
  const project = await container.createProject.execute({
    title: opts.title,
    author,
    leads: parseList(opts.leads),
    body: opts.body ?? "",
  });

  console.log(`✓ Created ${project.id.toString()} — ${project.title}`);
}
