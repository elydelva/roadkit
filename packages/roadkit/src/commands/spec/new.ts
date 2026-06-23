import { ProjectId } from "@roadkit/core";
import type { Container } from "../../container.js";
import { fail, parseList, resolveAuthor } from "../shared.js";

interface SpecNewOptions {
  project?: string;
  title?: string;
  tags?: string;
  body?: string;
}

export async function runSpecNew(container: Container, opts: SpecNewOptions): Promise<void> {
  if (!opts.project) fail("--project is required");
  if (!opts.title) fail("--title is required");

  const author = resolveAuthor();
  const spec = await container.createSpec.execute({
    projectId: ProjectId.from(opts.project),
    title: opts.title,
    author,
    tags: parseList(opts.tags),
    body: opts.body ?? "",
  });

  console.log(`✓ Created ${spec.id.toString()} — ${spec.title}`);
  console.log(`  Project: ${spec.projectId.toString()}`);
}
