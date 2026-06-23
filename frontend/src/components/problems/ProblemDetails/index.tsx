import { useEffect, useState, type JSX } from "react"
import { BookOpen, History } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import CodeEditor from "@/common/components/code-editor"
import { DEFAULT_CODE, LANGUAGE_LOCAL_STORAGE_KEY, SOURCE_CODE_LOCAL_STORAGE_KEY, type Language } from "@/common/constants"
import ProblemDescription from "@/components/problems/ProblemDetails/ProblemDescription"
import SubmissionsTab from "@/components/problems/ProblemDetails/SubmisionsTab"
import EditorToolbar from "@/components/problems/ProblemDetails/EditorToolbar"
import OutputPanel from "@/components/problems/ProblemDetails/OutputPanel"
import { useParams } from "react-router-dom"
import NotFoundPage from "@/pages/NotFoundPage"
import { useQuery } from "@tanstack/react-query"
import query from "@/utils/request/query"
import problemApi from "@/api/problem/problemApi"
import { Spinner } from "@/components/ui/spinner"
import type { ExecStatus } from "../Problems"
import type { RunResult, RunCodeRequest, SubmitResult, SubmitCodeRequest } from "@/api/execution/execution"
import executionApi from "@/api/execution/executionApi"
import useExecutionJob from "@/hooks/useExecution"
import queryClient from "@/utils/request/queryClient"

type ActiveKind = "run" | "submit" | null

export default function ProblemDetail(): JSX.Element {
    const { slug } = useParams<{ slug: string }>()
    const [language, setLanguage] = useState<Language>(localStorage.getItem(LANGUAGE_LOCAL_STORAGE_KEY) as Language || "javascript")
    const [code, setCode] = useState<string>(localStorage.getItem(`${SOURCE_CODE_LOCAL_STORAGE_KEY}_${language}_${slug}`) ?? DEFAULT_CODE[language])
    const [activeKind, setActiveKind] = useState<ActiveKind>(null)

    const { data: problem, isLoading, isError } = useQuery({
        queryKey: ["GetProblemDetails", slug],
        queryFn: query(problemApi.findBySlug, { pathParams: { slug: slug! } }),
        enabled: !!slug,
    })

    const runJob = useExecutionJob<RunCodeRequest, RunResult>({
        enqueueRoute: executionApi.run,
        statusRoute: executionApi.getRunStatus,
    })
    const submitJob = useExecutionJob<SubmitCodeRequest, SubmitResult>({
        enqueueRoute: executionApi.submit,
        statusRoute: executionApi.getSubmitStatus,
    })

    useEffect(() => {
        if (activeKind === "submit" && submitJob.status === "done") {
            queryClient.invalidateQueries({ queryKey: [problemApi.getSubmissions.path] })
        }
    }, [activeKind, submitJob.status])

    const handleLanguageChange = (lang: Language): void => {
        setLanguage(lang)
        localStorage.setItem(LANGUAGE_LOCAL_STORAGE_KEY, lang)
        setCode(DEFAULT_CODE[lang])
    }
    const handleCodeChange = (code: string): void => {
        setCode(code)
        localStorage.setItem(`${SOURCE_CODE_LOCAL_STORAGE_KEY}_${language}_${slug}`, code)
    }
    const handleReset = (): void => handleCodeChange(DEFAULT_CODE[language])
    const handleRun = (): void => {
        if (!problem?.id) return
        setActiveKind("run")
        runJob.execute({ problemId: problem.id, language, sourceCode: code })
    }
    const handleSubmit = (): void => {
        if (!problem?.id) return
        setActiveKind("submit")
        submitJob.execute({ problemId: problem.id, language, sourceCode: code })
    }

    const status: ExecStatus =
        activeKind === "run" && (runJob.status === "submitting" || runJob.status === "polling") ? "running"
            : activeKind === "submit" && (submitJob.status === "submitting" || submitJob.status === "polling") ? "submitting"
                : activeKind === "run" && (runJob.status === "failed" || runJob.status === "timeout") ? "error"
                    : activeKind === "submit" && (submitJob.status === "failed" || submitJob.status === "timeout") ? "error"
                        : activeKind ? "done" : "idle"

    if (isLoading) return <Spinner fullScreen />
    if (isError || !problem) return <NotFoundPage />

    return (
        <div className="h-[calc(100vh-3.5rem)]">
            <ResizablePanelGroup orientation="horizontal" className="flex-col! md:flex-row!">
                <ResizablePanel defaultSize={40} minSize={28}>
                    <Tabs defaultValue="description" className="flex h-full flex-col">
                        <TabsList variant="line" className="shrink-0 px-4">
                            <TabsTrigger value="description"><BookOpen className="mr-1.5 h-4 w-4" />Description</TabsTrigger>
                            <TabsTrigger value="submissions"><History className="mr-1.5 h-4 w-4" />Submissions</TabsTrigger>
                        </TabsList>
                        <ScrollArea className="flex-1">
                            <TabsContent value="description" className="m-0">
                                <ProblemDescription problem={problem} />
                            </TabsContent>
                            <TabsContent value="submissions" className="m-0">
                                <SubmissionsTab problemId={problem?.id} />
                            </TabsContent>
                        </ScrollArea>
                    </Tabs>
                </ResizablePanel>
                <ResizableHandle />
                <ResizablePanel defaultSize={60} minSize={40}>
                    <ResizablePanelGroup orientation="vertical">
                        <ResizablePanel defaultSize={65} minSize={40}>
                            <div className="flex h-full flex-col">
                                <EditorToolbar
                                    language={language}
                                    onLanguageChange={handleLanguageChange}
                                    onReset={handleReset}
                                    onRun={handleRun}
                                    onSubmit={handleSubmit}
                                    isRunning={status === "running"}
                                    isSubmitting={status === "submitting"}
                                    code={code}
                                />
                                <div className="flex-1 overflow-hidden">
                                    <CodeEditor language={language} initialCode={code} onCodeChange={handleCodeChange} />
                                </div>
                            </div>
                        </ResizablePanel>
                        <ResizableHandle />
                        <ResizablePanel defaultSize={35} minSize={15}>
                            <OutputPanel
                                status={status}
                                runResult={activeKind === "run" ? runJob.result : null}
                                judgeResult={activeKind === "submit" ? submitJob.result : null}
                            />
                        </ResizablePanel>
                    </ResizablePanelGroup>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    )
}