import type { Container } from "../../container.js";
import { parseList, resolveAuthor } from "../shared.js";
import { parseProjectId, requireOption } from "../validators.js";

interface SpecNewOptions {
  project?: string;
  title?: string;
  tags?: string;
  body?: string;
}

export async function runSpecNew(container: Container, opts: SpecNewOptions): Promise<void> {
  const projectId = parseProjectId(opts.project);
  const title = requireOption(opts.title, "--title");

  const author = resolveAuthor();
  const spec = await container.createSpec.execute({
    projectId,
    title,
    author,
    tags: parseList(opts.tags),
    body: opts.body ?? "",
  });

  console.log(`✓ Created ${spec.id.toString()} — ${spec.title}`);
  console.log(`  Project: ${spec.projectId.toString()}`);
}
