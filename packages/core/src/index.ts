// Value Objects
export { ProjectId, MilestoneId, IssueId, SpecId, TraceId } from "./value-objects/index.js";
export type {
  ProjectStatus,
  MilestoneStatus,
  IssueStatus,
  SpecStatus,
  Priority,
} from "./value-objects/index.js";

// Entities
export { Project, Milestone, Issue, Spec, Trace } from "./entities/index.js";
export type {
  Rule,
  CreateProjectParams,
  CreateMilestoneParams,
  CreateIssueParams,
  CreateSpecParams,
  TraceEvent,
  CreateTraceParams,
} from "./entities/index.js";

// Ports
export type {
  IRealmRepository,
  TraceFilter,
  CounterKey,
  RealmState,
  IGitAdapter,
} from "./ports/index.js";

// Services
export { StateMachineService, DAGService } from "./services/index.js";

// Use Cases
export {
  CreateProjectUseCase,
  CreateMilestoneUseCase,
  CreateIssueUseCase,
  StartIssueUseCase,
  CompleteIssueUseCase,
  CreateSpecUseCase,
  SetSpecStatusUseCase,
  SetProjectStatusUseCase,
  SetMilestoneStatusUseCase,
  GetNextUseCase,
  GetContextUseCase,
  GetHistoryUseCase,
} from "./use-cases/index.js";
export type { NextResult, ContextFilter, RealmContext, HistoryFilter } from "./use-cases/index.js";

// Errors
export {
  InvalidTransitionError,
  GatesNotClearedError,
  ProjectNotFoundError,
  MilestoneNotFoundError,
  IssueNotFoundError,
  SpecNotFoundError,
  InvalidIdError,
} from "./errors/index.js";
