import { defineRoute } from "@/utils/request/types"
import type {
  ProblemEntity,
  CreateProblemRequest,
  PaginatedProblemsResponse,
  SubmissionEntity,
} from "./problem"

const problemApi = {
  list: defineRoute<PaginatedProblemsResponse>({
    path: "/problems",
    method: "GET",
  }),
  findBySlug: defineRoute<ProblemEntity>({
    path: "/problems/:slug",
    method: "GET",
  }),
  create: defineRoute<ProblemEntity, CreateProblemRequest>({
    path: "/problems",
    method: "POST",
  }),
  getSubmissions: defineRoute<SubmissionEntity[]>({
    path: "/problems/:id/submissions",
    method: "GET",
  }),
}

export default problemApi