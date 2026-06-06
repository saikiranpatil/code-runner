import type { GetExecutionResponse } from "@/types/execution/execution";
import executionApi from "@/types/execution/executionApi";
import mutate from "@/utils/request/mutate";
import query from "@/utils/request/query";
import { Query, useMutation, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export default function useExecution() {
    const {
        mutate: createExecution,
        isPending: createExecutionLoading,
        data: createExecutionResponse,
        error: createExecutionError,
    } = useMutation({
        mutationKey: ["CreateExecution"],
        mutationFn: mutate(executionApi.createExecution),
    });

    const jobId = createExecutionResponse?.jobId;
    const FETCH_EXECUTION_TIMEOUT_MS = 2000;

    const {
        data: getExecutionResponse,
        error: getExecutionError,
    } = useQuery({
        queryKey: ["GetExecution", jobId],
        queryFn: query(executionApi.getExecution, {
            pathParams: {
                jobId: jobId
            }
        }),
        refetchInterval: (query: Query<GetExecutionResponse>) => {
            const state = query.state.data?.state;
            if (state === "completed" || state === "failed") return false;
            return FETCH_EXECUTION_TIMEOUT_MS;
        },
        enabled: !!jobId
    });
    const loading = useMemo(() => {
        return createExecutionLoading || (!!jobId &&
            getExecutionResponse?.state !== "completed" &&
            getExecutionResponse?.state !== "failed"
        );
    }, [createExecutionLoading, jobId, getExecutionResponse?.state]);

    const error = useMemo(() => getExecutionError?.message ?? createExecutionError?.message, [getExecutionError, createExecutionError]);

    return {
        execute: createExecution,
        loading,
        error,
        executionData: getExecutionResponse,
    };
}