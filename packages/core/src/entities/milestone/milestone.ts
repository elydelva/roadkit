import type { MilestoneId } from "../../value-objects/milestone-id/milestone-id.js";
import type { ProjectId } from "../../value-objects/project-id/project-id.js";
import type { MilestoneStatus } from "../../value-objects/status/status.js";

export interface Milestone {
  id: MilestoneId;
  projectId: ProjectId;
  title: string;
  status: MilestoneStatus;
  targetDate: Date | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  body: string;
}

export interface CreateMilestoneParams {
  id: MilestoneId;
  projectId: ProjectId;
  title: string;
  order: number;
  targetDate?: Date | null;
  body?: string;
}

export const Milestone = {
  create(params: CreateMilestoneParams): Milestone {
    const now = new Date();
    return {
      id: params.id,
      projectId: params.projectId,
      title: params.title,
      status: "pending",
      targetDate: params.targetDate ?? null,
      order: params.order,
      createdAt: now,
      updatedAt: now,
      body: params.body ?? "",
    };
  },
};
