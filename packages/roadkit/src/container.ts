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
  SetMilestoneStatusUseCase,
  SetProjectStatusUseCase,
  SetSpecStatusUseCase,
  StartIssueUseCase,
} from "@roadkit/core";
import { FsRealmRepository } from "@roadkit/fs";
import { GitAdapter } from "@roadkit/git";

export interface Container {
  realmRoot: string;
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

export function createContainer(realmRoot: string): Container {
  const git = new GitAdapter();
  // Git staging is performed by the repository using absolute, realm-rooted
  // paths. The use-cases are intentionally constructed without a git adapter to
  // avoid double-staging with incorrectly-rooted relative paths.
  const repo = new FsRealmRepository(realmRoot, git);

  return {
    realmRoot,
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
    getNext: new GetNextUseCase(repo),
    getContext: new GetContextUseCase(repo),
    getHistory: new GetHistoryUseCase(repo),
  };
}
