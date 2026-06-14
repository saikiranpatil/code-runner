import type { CreateExecutionRequest, CreateExecutionResponse, GetExecutionResponse } from "@/api/execution/execution";
import executionApi from "@/api/execution/executionApi";
import mutate from "@/utils/request/mutate";
import query from "@/utils/request/query";
import { Query, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";

const POLL_INTERVAL_MS = 1500;
const CLIENT_TIMEOUT_MS = 30_000;
const TERMINAL_STATES = new Set(["completed", "failed"]);

export type ExecutionStatus =
    | "idle"
    | "submitting"
    | "waiting"
    | "running"
    | "done"
    | "error"
    | "timeout";

export default function useExecution() {
    const queryClient = useQueryClient();
    const [jobId, setJobId] = useState<string | null>(null);
    const [status, setStatus] = useState<ExecutionStatus>("idle");
    const [submitError, setSubmitError] = useState<string | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearTimer = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const { mutate: submit } = useMutation({
        mutationFn: mutate(executionApi.post),
        onMutate: () => {
            clearTimer();
            setSubmitError(null);
            setJobId(null);
            setStatus("submitting");
            queryClient.removeQueries({ queryKey: ["execution"] });
        },
        onSuccess: ({ jobId }: CreateExecutionResponse) => {
            setJobId(jobId);
            setStatus("waiting");
            timerRef.current = setTimeout(() => {
                setStatus("timeout");
                setJobId(null);
            }, CLIENT_TIMEOUT_MS);
        },
        onError: (err: any) => {
            const msg =
                err?.response?.data?.message ??
                err?.message ??
                "Failed to submit code. Please try again.";
            setSubmitError(msg);
            setStatus("error");
        },
    });

    const { data: executionData } = useQuery({
        queryKey: ["execution", jobId],
        queryFn: query(executionApi.get, { pathParams: { jobId: jobId! } }),
        enabled: !!jobId && (status === "waiting" || status === "running"),
        refetchInterval: (q: Query<GetExecutionResponse>) => {
            const state = q.state.data?.state;
            if (state && TERMINAL_STATES.has(state)) return false;
            return POLL_INTERVAL_MS;
        },
        refetchIntervalInBackground: true,
    });

    // Sync status from polled data
    useEffect(() => {
        if (!executionData) return;
        const { state } = executionData;
        if (state === "active") {
            setStatus("running");
        } else if (TERMINAL_STATES.has(state)) {
            clearTimer();
            setStatus("done");
        }
    }, [executionData, clearTimer]);

    // Cleanup on unmount
    useEffect(() => () => clearTimer(), [clearTimer]);

    const execute = useCallback(
        (req: CreateExecutionRequest) => submit(req),
        [submit]
    );

    const reset = useCallback(() => {
        clearTimer();
        setJobId(null);
        setStatus("idle");
        setSubmitError(null);
        queryClient.removeQueries({ queryKey: ["execution"] });
    }, [clearTimer, queryClient]);

    return {
        execute,
        reset,
        status,
        isRunning:
            status === "submitting" || status === "waiting" || status === "running",
        submitError,
        result: executionData ?? null,
    };
}