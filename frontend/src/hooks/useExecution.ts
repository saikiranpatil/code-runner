import { useCallback, useEffect, useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { Query } from "@tanstack/react-query"
import mutate from "@/utils/request/mutate"
import query from "@/utils/request/query"
import type { ApiRoute } from "@/utils/request/types"
import type { EnqueueJobResponse, JobStatusResponse } from "@/api/execution/execution"

const POLL_INTERVAL_MS = 1200
const CLIENT_TIMEOUT_MS = 30_000
const TERMINAL_STATES = new Set(["completed", "failed"])

export type ExecutionStatus = "idle" | "submitting" | "polling" | "done" | "failed" | "timeout"

interface UseExecutionJobOptions<TBody, TResult> {
  enqueueRoute: ApiRoute<EnqueueJobResponse, TBody>
  statusRoute: ApiRoute<JobStatusResponse<TResult>>
}

export default function useExecutionJob<TBody, TResult>({
  enqueueRoute,
  statusRoute,
}: UseExecutionJobOptions<TBody, TResult>) {
  const queryClient = useQueryClient()
  const [jobId, setJobId] = useState<string | null>(null)
  const [status, setStatus] = useState<ExecutionStatus>("idle")
  const [error, setError] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const { mutate: enqueue } = useMutation({
    mutationFn: mutate(enqueueRoute),
    onMutate: () => {
      clearTimer()
      setError(null)
      setJobId(null)
      setStatus("submitting")
      queryClient.removeQueries({ queryKey: [statusRoute.path] })
    },
    onSuccess: ({ jobId: newJobId }: EnqueueJobResponse) => {
      setJobId(newJobId)
      setStatus("polling")
      timerRef.current = setTimeout(() => {
        setStatus("timeout")
        setJobId(null)
      }, CLIENT_TIMEOUT_MS)
    },
    onError: (err: any) => {
      setError(err?.message ?? "Failed to submit code. Please try again.")
      setStatus("failed")
    },
  })

  const { data: jobStatus } = useQuery({
    queryKey: [statusRoute.path, jobId],
    queryFn: query(statusRoute, { pathParams: { jobId: jobId! } }),
    enabled: !!jobId && status === "polling",
    refetchInterval: (q: Query<JobStatusResponse<TResult>>) => {
      const state = q.state.data?.state
      return state && TERMINAL_STATES.has(state) ? false : POLL_INTERVAL_MS
    },
    refetchIntervalInBackground: true,
  })

  useEffect(() => {
    if (!jobStatus) return
    if (jobStatus.state === "completed") {
      clearTimer()
      setStatus("done")
    } else if (jobStatus.state === "failed") {
      clearTimer()
      setError(jobStatus.error ?? "Execution failed.")
      setStatus("failed")
    }
  }, [jobStatus, clearTimer])

  useEffect(() => () => clearTimer(), [clearTimer])

  const execute = useCallback((body: TBody) => enqueue(body), [enqueue])

  const reset = useCallback(() => {
    clearTimer()
    setJobId(null)
    setStatus("idle")
    setError(null)
    queryClient.removeQueries({ queryKey: [statusRoute.path] })
  }, [clearTimer, queryClient, statusRoute.path])

  return {
    execute,
    reset,
    status,
    isBusy: status === "submitting" || status === "polling",
    error,
    result: jobStatus?.state === "completed" ? jobStatus.result : null,
  }
}