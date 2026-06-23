import { Command } from "commander";
import { runContext } from "./commands/context.js";
import { runHistory } from "./commands/history.js";
import { runInit } from "./commands/init.js";
import { runIssueAdd } from "./commands/issue/add.js";
import { runIssueComplete } from "./commands/issue/complete.js";
import { runIssueStart } from "./commands/issue/start.js";
import { runMilestoneNew } from "./commands/milestone/new.js";
import { runMilestoneStart, runMilestoneStatus } from "./commands/milestone/status.js";
import { runNext } from "./commands/next.js";
import { runProjectList } from "./commands/project/list.js";
import { runProjectNew } from "./commands/project/new.js";
import { runProjectStart, runProjectStatus } from "./commands/project/status.js";
import { runSpecNew } from "./commands/spec/new.js";
import { runSpecStatus } from "./commands/spec/status.js";
import { createContainer } from "./container.js";

// Kept in sync with package.json "version".
const CLI_VERSION = "0.1.1";

function getRealmRoot(): string {
  return process.env.ROADKIT_ROOT ?? process.cwd();
}

export function buildCLI(): Command {
  const program = new Command();

  program
    .name("rkit")
    .description("Decision-first, agent-native project management for git repositories")
    .version(CLI_VERSION);

  program
    .command("init")
    .description("Initialize roadkit in the current repository")
    .action(async () => {
      await runInit(getRealmRoot());
    });

  // --- project ---
  const project = program.command("project").description("Manage projects");

  project
    .command("new")
    .description("Create a new project")
    .requiredOption("--title <title>", "Project title")
    .option("--leads <leads>", "Comma-separated leads")
    .option("--body <body>", "Project body")
    .action(async (opts: { title?: string; leads?: string; body?: string }) => {
      await runProjectNew(await createContainer(getRealmRoot()), opts);
    });

  project
    .command("list")
    .description("List all projects")
    .option("--json", "Machine-readable output")
    .action(async (opts: { json?: boolean }) => {
      await runProjectList(await createContainer(getRealmRoot()), opts);
    });

  project
    .command("status <projectId> <status>")
    .description("Change a project's status (planned|active|paused|completed|cancelled)")
    .action(async (projectId: string, status: string) => {
      await runProjectStatus(await createContainer(getRealmRoot()), projectId, status);
    });

  project
    .command("start <projectId>")
    .description("Transition a planned project to active")
    .action(async (projectId: string) => {
      await runProjectStart(await createContainer(getRealmRoot()), projectId);
    });

  // --- milestone ---
  const milestone = program.command("milestone").description("Manage milestones");

  milestone
    .command("new")
    .description("Create a new milestone")
    .requiredOption("--project <id>", "Project id (e.g. PROJ-0001)")
    .requiredOption("--title <title>", "Milestone title")
    .requiredOption("--order <n>", "Milestone order")
    .option("--target-date <iso>", "Target date (ISO 8601)")
    .option("--body <body>", "Milestone body")
    .action(
      async (opts: {
        project?: string;
        title?: string;
        order?: string;
        targetDate?: string;
        body?: string;
      }) => {
        await runMilestoneNew(await createContainer(getRealmRoot()), opts);
      }
    );

  milestone
    .command("status <milestoneId> <status>")
    .description("Change a milestone's status (pending|active|done)")
    .action(async (milestoneId: string, status: string) => {
      await runMilestoneStatus(await createContainer(getRealmRoot()), milestoneId, status);
    });

  milestone
    .command("start <milestoneId>")
    .description("Transition a pending milestone to active")
    .action(async (milestoneId: string) => {
      await runMilestoneStart(await createContainer(getRealmRoot()), milestoneId);
    });

  // --- issue ---
  const issue = program.command("issue").description("Manage issues");

  issue
    .command("add")
    .description("Add an issue to a project")
    .requiredOption("--project <id>", "Project id (e.g. PROJ-0001)")
    .option("--milestone <id>", "Milestone id (e.g. MILE-0001)")
    .requiredOption("--title <title>", "Issue title")
    .option("--priority <priority>", "Priority level (see roadfig.yml)")
    .option("--estimate <label|number>", "Estimate (scale label or number)")
    .option("--labels <labels>", "Comma-separated labels")
    .option("--parent <id>", "Parent issue id")
    .option("--gates <ids>", "Comma-separated gate ids")
    .option("--assignee <assignee>", "Assignee")
    .option("--body <body>", "Issue body")
    .action(
      async (opts: {
        project?: string;
        milestone?: string;
        title?: string;
        priority?: string;
        estimate?: string;
        labels?: string;
        parent?: string;
        gates?: string;
        assignee?: string;
        body?: string;
      }) => {
        await runIssueAdd(await createContainer(getRealmRoot()), opts);
      }
    );

  issue
    .command("start <issueId>")
    .description("Mark an issue as in-progress")
    .action(async (issueId: string) => {
      await runIssueStart(await createContainer(getRealmRoot()), issueId);
    });

  issue
    .command("complete <issueId>")
    .description("Mark an issue as completed")
    .action(async (issueId: string) => {
      await runIssueComplete(await createContainer(getRealmRoot()), issueId);
    });

  // --- spec ---
  const spec = program.command("spec").description("Manage specs");

  spec
    .command("new")
    .description("Create a new spec")
    .requiredOption("--project <id>", "Project id (e.g. PROJ-0001)")
    .requiredOption("--title <title>", "Spec title")
    .option("--tags <tags>", "Comma-separated tags")
    .option("--body <body>", "Spec body")
    .action(async (opts: { project?: string; title?: string; tags?: string; body?: string }) => {
      await runSpecNew(await createContainer(getRealmRoot()), opts);
    });

  spec
    .command("status <specId> <status>")
    .description("Change a spec's status")
    .action(async (specId: string, status: string) => {
      await runSpecStatus(await createContainer(getRealmRoot()), specId, status);
    });

  // --- top-level reads ---
  program
    .command("next")
    .description("Get the next eligible issue to work on")
    .option("--json", "Machine-readable output")
    .action(async (opts: { json?: boolean }) => {
      await runNext(await createContainer(getRealmRoot()), opts);
    });

  program
    .command("context")
    .description("Dump realm context")
    .option("--project <id>", "Scope to a specific project (e.g. PROJ-0001)")
    .option("--active", "Filter to active projects only")
    .option("--json", "Output as JSON")
    .action(async (opts: { project?: string; active?: boolean; json?: boolean }) => {
      await runContext(await createContainer(getRealmRoot()), opts);
    });

  program
    .command("history")
    .description("Show audit trail of events")
    .option("--project <id>", "Scope to a specific project")
    .option("--issue <id>", "Scope to a specific issue")
    .option("--spec <id>", "Scope to a specific spec")
    .option("--actor <name>", "Filter by actor")
    .option("--event <event>", "Filter by event type")
    .option("--since <date>", "Filter events after this date (ISO 8601)")
    .option("--json", "Machine-readable output")
    .action(
      async (opts: {
        project?: string;
        issue?: string;
        spec?: string;
        actor?: string;
        event?: string;
        since?: string;
        json?: boolean;
      }) => {
        await runHistory(await createContainer(getRealmRoot()), opts);
      }
    );

  return program;
}
