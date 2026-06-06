import { defineRoute } from "@/utils/request/types";
import type {
  CreateExecutionRequest,
  CreateExecutionResponse,
  GetExecutionResponse,
} from "./execution";

export default {
  createExecution: defineRoute<CreateExecutionResponse, CreateExecutionRequest>({
    path: "/execution",
    method: "POST",
  }),
  getExecution: defineRoute<GetExecutionResponse>({
    path: "/execution/:jobId",
    method: "GET",
  }),
} as const;