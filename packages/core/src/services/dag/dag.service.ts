import type { Issue } from "../../entities/issue/issue.js";
import type { Milestone } from "../../entities/milestone/milestone.js";
import type { Project } from "../../entities/project/project.js";
import { IssueId } from "../../value-objects/issue-id/issue-id.js";

export class DAGService {
  areGatesCleared(issue: Issue, allIssues: Issue[]): boolean {
    for (const gate of issue.gates) {
      if (gate instanceof IssueId) {
        const dep = allIssues.find((i) => i.id.equals(gate));
        if (!dep || dep.status !== "completed") {
          return false;
        }
      }
      // String gates are treated as external references — assumed cleared
    }
    return true;
  }

  getBlockedIssues(issues: Issue[]): Issue[] {
    return issues.filter((i) => i.status === "blocked" || !this.areGatesCleared(i, issues));
  }

  getEligibleIssues(issues: Issue[], projects: Project[], _milestones: Milestone[]): Issue[] {
    const activeProjectIds = new Set(
      projects.filter((p) => p.status === "active").map((p) => p.id.toString())
    );

    return issues.filter((issue) => {
      if (!activeProjectIds.has(issue.projectId.toString())) return false;
      if (issue.status !== "not-started" && issue.status !== "blocked") return false;
      if (!this.areGatesCleared(issue, issues)) return false;
      return true;
    });
  }
}
