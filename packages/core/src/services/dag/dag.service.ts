import type { Issue } from "../../entities/issue/issue.js";
import type { Milestone } from "../../entities/milestone/milestone.js";
import type { Project } from "../../entities/project/project.js";
import { IssueId } from "../../value-objects/issue-id/issue-id.js";
import type { IssueStatus } from "../../value-objects/status/status.js";

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

  /**
   * Gates that are not yet cleared for an issue, each with the resolved status of
   * the dependency: the blocker's IssueStatus, "missing" if the referenced issue
   * does not exist, or "external" for string (cross-realm) gates — which never
   * block here. Used to explain *why* an issue is blocked.
   */
  getUnmetGates(
    issue: Issue,
    allIssues: Issue[]
  ): Array<{ gate: string; status: IssueStatus | "missing" }> {
    const unmet: Array<{ gate: string; status: IssueStatus | "missing" }> = [];
    for (const gate of issue.gates) {
      if (gate instanceof IssueId) {
        const dep = allIssues.find((i) => i.id.equals(gate));
        if (!dep) {
          unmet.push({ gate: gate.toString(), status: "missing" });
        } else if (dep.status !== "completed") {
          unmet.push({ gate: gate.toString(), status: dep.status });
        }
      }
      // String gates are external references — assumed cleared, never unmet.
    }
    return unmet;
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
