import { defineRoute } from "@/utils/request/types";
import type {
  CreateExecutionRequest,
  CreateExecutionResponse,
  GetExecutionResponse,
} from "./execution";

export default {
  post: defineRoute<CreateExecutionResponse, CreateExecutionRequest>({
    path: "/execution",
    method: "POST",
  }),
  get: defineRoute<GetExecutionResponse>({
    path: "/execution/:jobId",
    method: "GET",
  }),
} as const;