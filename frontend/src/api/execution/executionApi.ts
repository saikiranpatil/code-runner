import { defineRoute } from "@/utils/request/types";
import type { ExecutionResponse, ExecutionRequest } from "./execution";

export default {
  create: defineRoute<ExecutionResponse, ExecutionRequest>({
    path: "/execution",
    method: "POST",
  }),
}