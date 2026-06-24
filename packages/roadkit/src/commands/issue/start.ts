import { IssueId } from "@roadkit/core";
import type { Container } from "../../container.js";
import { setJsonMode } from "../json-mode.js";
import { getFormatter } from "../output.js";
import { resolveAuthor, serializeIssue } from "../shared.js";

interface IssueStartOptions {
  json?: boolean;
}

export async function runIssueStart(
  container: Container,
  idRaw: string,
  opts: IssueStartOptions = {}
): Promise<void> {
  setJsonMode(opts.json ?? false);
  const issue = await container.startIssue.execute({
    id: IssueId.from(idRaw),
    actor: resolveAuthor(),
  });
  getFormatter(opts.json ?? false).emit({
    json: serializeIssue(issue),
    human: () => console.log(`✓ Started ${issue.id.toString()} — ${issue.title}`),
  });
}
