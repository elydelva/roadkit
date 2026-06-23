import { IssueId } from "@roadkit/core";
import type { Container } from "../../container.js";
import { resolveAuthor } from "../shared.js";

export async function runIssueStart(container: Container, idRaw: string): Promise<void> {
  const issue = await container.startIssue.execute({
    id: IssueId.from(idRaw),
    actor: resolveAuthor(),
  });
  console.log(`✓ Started ${issue.id.toString()} — ${issue.title}`);
}
