import type { ProjectId } from "../../value-objects/project-id/project-id.js";
import type { SpecId } from "../../value-objects/spec-id/spec-id.js";
import type { SpecStatus } from "../../value-objects/status/status.js";
import type { Rule } from "../rule/rule.js";

export interface Spec {
  id: SpecId;
  projectId: ProjectId;
  title: string;
  status: SpecStatus;
  supersedes: SpecId | null;
  supersededBy: SpecId | null;
  relatedTo: SpecId[];
  tags: string[];
  rules: Rule[];
  author: string;
  createdAt: Date;
  updatedAt: Date;
  body: string;
}

export interface CreateSpecParams {
  id: SpecId;
  projectId: ProjectId;
  title: string;
  author: string;
  supersedes?: SpecId | null;
  relatedTo?: SpecId[];
  tags?: string[];
  rules?: Rule[];
  body?: string;
}

export const Spec = {
  create(params: CreateSpecParams): Spec {
    const now = new Date();
    return {
      id: params.id,
      projectId: params.projectId,
      title: params.title,
      status: "draft",
      supersedes: params.supersedes ?? null,
      supersededBy: null,
      relatedTo: params.relatedTo ?? [],
      tags: params.tags ?? [],
      rules: params.rules ?? [],
      author: params.author,
      createdAt: now,
      updatedAt: now,
      body: params.body ?? "",
    };
  },
};
