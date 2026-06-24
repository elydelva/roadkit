import type { Container } from "../../container.js";
import { setJsonMode } from "../json-mode.js";
import { getFormatter } from "../output.js";
import { parseList, resolveAuthor, serializeSpec } from "../shared.js";
import { parseProjectId, requireOption } from "../validators.js";

interface SpecNewOptions {
  project?: string;
  title?: string;
  tags?: string;
  body?: string;
  json?: boolean;
}

export async function runSpecNew(container: Container, opts: SpecNewOptions): Promise<void> {
  setJsonMode(opts.json ?? false);
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

  getFormatter(opts.json ?? false).emit({
    json: serializeSpec(spec),
    human: () => {
      console.log(`✓ Created ${spec.id.toString()} — ${spec.title}`);
      console.log(`  Project: ${spec.projectId.toString()}`);
    },
  });
}
