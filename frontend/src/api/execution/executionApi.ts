import { defineRoute } from "@/utils/request/types"
import type { RunResult, RunCodeRequest, SubmitResult, SubmitCodeRequest } from "./execution"

const executionApi = {
  run: defineRoute<RunResult, RunCodeRequest>({
    path: "/execution/run",
    method: "POST",
  }),
  submit: defineRoute<SubmitResult, SubmitCodeRequest>({
    path: "/execution/submit",
    method: "POST",
  }),
}

export default executionApi