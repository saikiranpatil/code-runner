import { defineRoute } from "@/utils/request/types"
import type {
  RunResult,
  RunCodeRequest,
  SubmitResult,
  SubmitCodeRequest,
  EnqueueJobResponse,
  JobStatusResponse,
} from "@/api/execution/execution"

const executionApi = {
  run: defineRoute<EnqueueJobResponse, RunCodeRequest>({
    path: "/execution/run",
    method: "POST"
  }),
  getRunStatus: defineRoute<JobStatusResponse<RunResult>>({
    path: "/execution/run/:jobId",
    method: "GET"
  }),
  submit: defineRoute<EnqueueJobResponse, SubmitCodeRequest>({
    path: "/execution/submit",
    method: "POST"
  }),
  getSubmitStatus: defineRoute<JobStatusResponse<SubmitResult>>({
    path: "/execution/submit/:jobId",
    method: "GET"
  }),
}
export default executionApi