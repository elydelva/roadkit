import { describe, expect, it } from "bun:test";
import { Issue } from "../../entities/issue/issue.js";
import { Project } from "../../entities/project/project.js";
import { IssueId } from "../../value-objects/issue-id/issue-id.js";
import { ProjectId } from "../../value-objects/project-id/project-id.js";
import { DAGService } from "./dag.service.js";

function makeIssue(
  n: number,
  gates: Array<IssueId | string> = [],
  status: Issue["status"] = "not-started"
): Issue {
  const i = Issue.create({
    id: IssueId.generate(n),
    projectId: ProjectId.generate(1),
    title: `Issue ${n}`,
    author: "test",
    gates,
  });
  return { ...i, status };
}

function makeProject(n: number, status: Project["status"] = "active"): Project {
  const p = Project.create({ id: ProjectId.generate(n), title: `Project ${n}`, author: "test" });
  return { ...p, status };
}

describe("DAGService", () => {
  const dag = new DAGService();

  describe("areGatesCleared", () => {
    it("returns true when no gates", () => {
      const issue = makeIssue(1);
      expect(dag.areGatesCleared(issue, [issue])).toBe(true);
    });

    it("returns true when all gate issues are completed", () => {
      const dep = makeIssue(1, [], "completed");
      const issue = makeIssue(2, [dep.id]);
      expect(dag.areGatesCleared(issue, [dep, issue])).toBe(true);
    });

    it("returns false when a gate issue is not completed", () => {
      const dep = makeIssue(1, [], "in-progress");
      const issue = makeIssue(2, [dep.id]);
      expect(dag.areGatesCleared(issue, [dep, issue])).toBe(false);
    });

    it("treats string gates as cleared", () => {
      const issue = makeIssue(1, ["external-thing"]);
      expect(dag.areGatesCleared(issue, [issue])).toBe(true);
    });
  });

  describe("getEligibleIssues", () => {
    it("returns not-started issues from active projects with cleared gates", () => {
      const project = makeProject(1, "active");
      const issue = makeIssue(1);
      const result = dag.getEligibleIssues([issue], [project], []);
      expect(result).toHaveLength(1);
    });

    it("excludes issues from non-active projects", () => {
      const project = makeProject(1, "planned");
      const issue = makeIssue(1);
      const result = dag.getEligibleIssues([issue], [project], []);
      expect(result).toHaveLength(0);
    });

    it("excludes completed issues", () => {
      const project = makeProject(1, "active");
      const issue = makeIssue(1, [], "completed");
      const result = dag.getEligibleIssues([issue], [project], []);
      expect(result).toHaveLength(0);
    });

    it("excludes issues whose gates are not cleared", () => {
      const project = makeProject(1, "active");
      const dep = makeIssue(1, [], "in-progress");
      const issue = makeIssue(2, [dep.id]);
      const result = dag.getEligibleIssues([dep, issue], [project], []);
      expect(result).toHaveLength(0);
    });

    it("includes blocked issues with cleared gates", () => {
      const project = makeProject(1, "active");
      const issue = makeIssue(1, [], "blocked");
      const result = dag.getEligibleIssues([issue], [project], []);
      expect(result).toHaveLength(1);
    });
  });

  describe("getBlockedIssues", () => {
    it("returns blocked status issues", () => {
      const issue = makeIssue(1, [], "blocked");
      expect(dag.getBlockedIssues([issue])).toHaveLength(1);
    });

    it("returns issues with uncleared gates", () => {
      const dep = makeIssue(1, [], "in-progress");
      const issue = makeIssue(2, [dep.id]);
      const blocked = dag.getBlockedIssues([dep, issue]);
      expect(blocked.map((i) => i.id.toString())).toContain("ISSUE-0002");
    });
  });
});
