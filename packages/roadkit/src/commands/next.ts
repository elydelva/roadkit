import type { Container } from "../container.js";
import { formatEstimate, serializeIssue, serializeMilestone, serializeProject } from "./shared.js";

interface NextOptions {
  json?: boolean;
}

export async function runNext(container: Container, opts: NextOptions): Promise<void> {
  const result = await container.getNext.execute();

  if (opts.json) {
    if (!result) {
      console.log(JSON.stringify(null));
      return;
    }
    console.log(
      JSON.stringify({
        issue: serializeIssue(result.issue),
        project: serializeProject(result.project),
        milestone: result.milestone ? serializeMilestone(result.milestone) : null,
      })
    );
    return;
  }

  if (!result) {
    console.log("No eligible issue.");
    return;
  }

  const { issue, project, milestone } = result;
  const scope = milestone
    ? `${project.id.toString()} / ${milestone.id.toString()}`
    : project.id.toString();
  const est = formatEstimate(container.config, issue.estimate);
  const tag = est ? `${issue.priority} · ${est}` : issue.priority;
  console.log(`→ ${issue.id.toString()}  ${issue.title}  [${tag}]  (${scope})`);
}
