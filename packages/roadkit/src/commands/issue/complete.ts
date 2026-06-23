import { IssueId } from "@roadkit/core";
import type { Container } from "../../container.js";
import { resolveAuthor } from "../shared.js";

export async function runIssueComplete(container: Container, idRaw: string): Promise<void> {
  const issue = await container.completeIssue.execute({
    id: IssueId.from(idRaw),
    actor: resolveAuthor(),
  });
  console.log(`✓ Completed ${issue.id.toString()} — ${issue.title}`);
}
