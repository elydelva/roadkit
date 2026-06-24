import { IssueId } from "@roadkit/core";
import type { Container } from "../../container.js";
import { setJsonMode } from "../json-mode.js";
import { getFormatter } from "../output.js";
import { resolveAuthor, serializeIssue } from "../shared.js";

interface IssueCompleteOptions {
  json?: boolean;
}

export async function runIssueComplete(
  container: Container,
  idRaw: string,
  opts: IssueCompleteOptions = {}
): Promise<void> {
  setJsonMode(opts.json ?? false);
  const issue = await container.completeIssue.execute({
    id: IssueId.from(idRaw),
    actor: resolveAuthor(),
  });
  getFormatter(opts.json ?? false).emit({
    json: serializeIssue(issue),
    human: () => console.log(`✓ Completed ${issue.id.toString()} — ${issue.title}`),
  });
}
