import type { ProjectId } from "../../value-objects/project-id/project-id.js";
import type { ProjectStatus } from "../../value-objects/status/status.js";

export interface Project {
  id: ProjectId;
  title: string;
  status: ProjectStatus;
  leads: string[];
  author: string;
  createdAt: Date;
  updatedAt: Date;
  body: string;
}

export interface CreateProjectParams {
  id: ProjectId;
  title: string;
  author: string;
  leads?: string[];
  body?: string;
}

export const Project = {
  create(params: CreateProjectParams): Project {
    const now = new Date();
    return {
      id: params.id,
      title: params.title,
      status: "planned",
      leads: params.leads ?? [],
      author: params.author,
      createdAt: now,
      updatedAt: now,
      body: params.body ?? "",
    };
  },
};
