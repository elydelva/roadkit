import type { Issue, Milestone, Project, Spec, Trace } from "../entities/index.js";
import type { CounterKey, IRealmRepository, TraceFilter } from "../ports/index.js";

export function makeInMemoryRepo(): IRealmRepository {
  const projects = new Map<string, Project>();
  const milestones = new Map<string, Milestone>();
  const issues = new Map<string, Issue>();
  const specs = new Map<string, Spec>();
  const traces: Trace[] = [];
  const counters: Record<CounterKey, number> = {
    project: 0,
    milestone: 0,
    issue: 0,
    spec: 0,
  };

  return {
    findProject: async (id) => projects.get(id.toString()) ?? null,
    findAllProjects: async () => [...projects.values()],
    saveProject: async (p) => {
      projects.set(p.id.toString(), p);
    },

    findMilestone: async (id) => milestones.get(id.toString()) ?? null,
    findMilestonesForProject: async (projectId) =>
      [...milestones.values()].filter((m) => m.projectId.equals(projectId)),
    findAllMilestones: async () => [...milestones.values()],
    saveMilestone: async (m) => {
      milestones.set(m.id.toString(), m);
    },

    findIssue: async (id) => issues.get(id.toString()) ?? null,
    findIssuesForProject: async (projectId) =>
      [...issues.values()].filter((i) => i.projectId.equals(projectId)),
    findAllIssues: async () => [...issues.values()],
    saveIssue: async (i) => {
      issues.set(i.id.toString(), i);
    },

    findSpec: async (id) => specs.get(id.toString()) ?? null,
    findSpecsForProject: async (projectId) =>
      [...specs.values()].filter((s) => s.projectId.equals(projectId)),
    findAllSpecs: async () => [...specs.values()],
    saveSpec: async (s) => {
      specs.set(s.id.toString(), s);
    },

    appendTrace: async (t) => {
      traces.push(t);
    },
    findTraces: async (filter: TraceFilter) =>
      traces.filter((t) => {
        if (filter.projectId && !t.projectId.equals(filter.projectId)) return false;
        if (filter.issueId && (!t.issueId || !t.issueId.equals(filter.issueId))) return false;
        if (filter.specId && (!t.specId || !t.specId.equals(filter.specId))) return false;
        if (filter.actor && t.actor !== filter.actor) return false;
        if (filter.event && t.event !== filter.event) return false;
        if (filter.since && t.at < filter.since) return false;
        return true;
      }),

    getState: async () => ({ counters: { ...counters } }),
    incrementCounter: async (key) => {
      counters[key] += 1;
      return counters[key];
    },
  };
}
