import { defineRoute } from "@/utils/request/types";
import type {
  ProblemEntity,
  CreateProblemRequest,
} from "./problem";

export default {
  create: defineRoute<ProblemEntity, CreateProblemRequest>({
    path: "/problems",
    method: "POST",
  }),
  list: defineRoute<ProblemEntity[]>({
    path: "/problems",
    method: "GET",
  }),
  findBySlug: defineRoute<ProblemEntity>({
    path: "/problems/slug/:slug",
    method: "GET",
  }),
  findById: defineRoute<ProblemEntity>({
    path: "/problems/:id",
    method: "GET",
  }),
} as const;