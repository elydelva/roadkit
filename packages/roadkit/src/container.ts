import {
  CompleteIssueUseCase,
  CreateIssueUseCase,
  CreateMilestoneUseCase,
  CreateProjectUseCase,
  CreateSpecUseCase,
  GetContextUseCase,
  GetHistoryUseCase,
  GetNextUseCase,
  type IRealmRepository,
  type RealmConfig,
  SetMilestoneStatusUseCase,
  SetProjectStatusUseCase,
  SetSpecStatusUseCase,
  StartIssueUseCase,
} from "@roadkit/core";
import { FsRealmRepository, readRealmConfig } from "@roadkit/fs";
import { GitAdapter } from "@roadkit/git";

export interface Container {
  realmRoot: string;
  config: RealmConfig;
  repo: IRealmRepository;
  createProject: CreateProjectUseCase;
  createMilestone: CreateMilestoneUseCase;
  createIssue: CreateIssueUseCase;
  startIssue: StartIssueUseCase;
  completeIssue: CompleteIssueUseCase;
  createSpec: CreateSpecUseCase;
  setSpecStatus: SetSpecStatusUseCase;
  setProjectStatus: SetProjectStatusUseCase;
  setMilestoneStatus: SetMilestoneStatusUseCase;
  getNext: GetNextUseCase;
  getContext: GetContextUseCase;
  getHistory: GetHistoryUseCase;
}

export async function createContainer(realmRoot: string): Promise<Container> {
  // Git runs in the realm root so staging works when ROADKIT_ROOT points
  // outside the current working directory. Staging is performed by the
  // repository (best-effort) using absolute, realm-rooted paths; the use-cases
  // are deliberately git-less to avoid double-staging.
  const git = new GitAdapter(realmRoot);
  const repo = new FsRealmRepository(realmRoot, git);
  const config = await readRealmConfig(realmRoot);

  return {
    realmRoot,
    config,
    repo,
    createProject: new CreateProjectUseCase(repo),
    createMilestone: new CreateMilestoneUseCase(repo),
    createIssue: new CreateIssueUseCase(repo),
    startIssue: new StartIssueUseCase(repo),
    completeIssue: new CompleteIssueUseCase(repo),
    createSpec: new CreateSpecUseCase(repo),
    setSpecStatus: new SetSpecStatusUseCase(repo),
    setProjectStatus: new SetProjectStatusUseCase(repo),
    setMilestoneStatus: new SetMilestoneStatusUseCase(repo),
    getNext: new GetNextUseCase(repo, config),
    getContext: new GetContextUseCase(repo),
    getHistory: new GetHistoryUseCase(repo),
  };
}
