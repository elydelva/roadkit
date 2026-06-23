import * as fs from "node:fs/promises";
import * as path from "node:path";
import { DEFAULT_CONFIG } from "@roadkit/core";
import {
  CONFIG_FILE,
  MD_EXT,
  ROADKIT_DIR,
  STATE_FILE,
  TEMPLATES_DIR,
  writeRealmConfig,
} from "@roadkit/fs";

const PROJECT_TEMPLATE = `---
id: "{{id}}"
title: "{{title}}"
status: planned
leads: []
author: "{{author}}"
---

# {{title}}

## Overview

<!-- What is this project about? -->
`;

const MILESTONE_TEMPLATE = `---
id: "{{id}}"
projectId: "{{projectId}}"
title: "{{title}}"
status: pending
order: 0
targetDate: ~
---

# {{title}}

<!-- Milestone scope and exit criteria -->
`;

const ISSUE_TEMPLATE = `---
id: "{{id}}"
projectId: "{{projectId}}"
milestoneId: ~
title: "{{title}}"
status: not-started
priority: none
estimate: ~
labels: []
parentId: ~
gates: []
rules: []
assignee: ~
author: "{{author}}"
---

<!-- Issue description -->
`;

const SPEC_TEMPLATE = `---
id: "{{id}}"
projectId: "{{projectId}}"
title: "{{title}}"
status: draft
tags: []
rules: []
author: "{{author}}"
---

# {{title}}

## Context

<!-- Why does this decision need to be made? -->

## Decision

<!-- What was decided? -->

## Consequences

<!-- What are the trade-offs? -->
`;

const TEMPLATES: Array<[string, string]> = [
  ["project", PROJECT_TEMPLATE],
  ["milestone", MILESTONE_TEMPLATE],
  ["issue", ISSUE_TEMPLATE],
  ["spec", SPEC_TEMPLATE],
];

async function exists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

export async function runInit(realmRoot: string): Promise<void> {
  const roadkitDir = path.join(realmRoot, ROADKIT_DIR);
  const templatesDir = path.join(roadkitDir, TEMPLATES_DIR);

  await fs.mkdir(roadkitDir, { recursive: true });
  await fs.mkdir(templatesDir, { recursive: true });

  const stateFile = path.join(roadkitDir, STATE_FILE);
  if (!(await exists(stateFile))) {
    await fs.writeFile(
      stateFile,
      JSON.stringify({ project: 0, milestone: 0, issue: 0, spec: 0 }, null, 2),
      "utf-8"
    );
  }

  for (const [name, body] of TEMPLATES) {
    const file = path.join(templatesDir, `${name}${MD_EXT}`);
    if (!(await exists(file))) {
      await fs.writeFile(file, body, "utf-8");
    }
  }

  const configPath = path.join(realmRoot, CONFIG_FILE);
  if (await exists(configPath)) {
    console.log(`✓ ${CONFIG_FILE} already exists, skipping`);
  } else {
    await writeRealmConfig(realmRoot, DEFAULT_CONFIG);
  }

  console.log(`✓ Initialized ${ROADKIT_DIR}/`);
  console.log(`  ${ROADKIT_DIR}/${STATE_FILE}`);
  for (const [name] of TEMPLATES) {
    console.log(`  ${ROADKIT_DIR}/${TEMPLATES_DIR}/${name}${MD_EXT}`);
  }
  console.log(`  ${CONFIG_FILE}`);
  console.log("");
  console.log('Next: rkit project new --title "My first project"');
}
