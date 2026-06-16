import { useState, type JSX } from "react"
import { BookOpen, History } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"
import CodeEditor from "@/common/components/code-editor"
import { type Language } from "@/common/constants"
import ProblemDescription from "@/components/problems/ProblemDetails/ProblemDescription"
import SubmissionsTab from "@/components/problems/ProblemDetails/SubmisionsTab"
import EditorToolbar from "@/components/problems/ProblemDetails/EditorToolbar"
import OutputPanel from "@/components/problems/ProblemDetails/OutputPanel"
import { useParams } from "react-router-dom"
import NotFoundPage from "@/pages/NotFoundPage"
import { useMutation, useQuery } from "@tanstack/react-query"
import mutate from "@/utils/request/mutate"
import executionApi from "@/api/execution/executionApi"
import query from "@/utils/request/query"
import problemApi from "@/api/problem/problemApi"
import { Spinner } from "@/components/ui/spinner"
import type { ExecStatus } from "../Problems"
import type { RunResult, RunCodeRequest, SubmitResult } from "@/api/execution/execution"
import queryClient from "@/utils/request/queryClient"

const DEFAULT_CODE: Record<Language, string> = {
    javascript:
        "// Read from stdin via process.stdin\nconst lines = require('fs').readFileSync('/dev/stdin','utf8').split('\\n');\n",
    typescript:
        "// Read from stdin\nconst lines = require('fs').readFileSync('/dev/stdin','utf8').split('\\n');\n",
    python: "import sys\nlines = sys.stdin.read().split('\\n')\n",
    cpp: "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // your code here\n    return 0;\n}\n",
    java: "import java.util.*;\n\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // your code here\n    }\n}\n",
}

export default function ProblemDetail(): JSX.Element {
    const { slug } = useParams<{ slug: string }>()

    const [language, setLanguage] = useState<Language>("javascript")
    const [code, setCode] = useState<string>(DEFAULT_CODE["javascript"])
    const [status, setStatus] = useState<ExecStatus>("idle")
    const [runResult, setRunResult] = useState<RunResult | null>(null)
    const [judgeResult, setJudgeResult] = useState<SubmitResult | null>(null)

    const {
        data: problem,
        isLoading,
        isError,
    } = useQuery({
        queryKey: ["GetProblemDetails", slug],
        queryFn: query(problemApi.findBySlug, { pathParams: { slug: slug! } }),
        enabled: !!slug,
    });

    const runRequestPayload: RunCodeRequest = { language: language, problemId: problem?.id!, sourceCode: code };

    const { mutate: runCode, isPending: isRunning } = useMutation({
        mutationFn: mutate(executionApi.run, { body: runRequestPayload }),
        onMutate: () => {
            setStatus("running")
            setRunResult(null)
            setJudgeResult(null)
        },
        onSuccess: (data: RunResult) => {
            setRunResult(data)
            setStatus("done")
        },
        onError: () => setStatus("error"),
    });

    const submitRequestPayload: RunCodeRequest = { language: language, problemId: problem?.id!, sourceCode: code };

    const { mutate: submitCode, isPending: isSubmitting } = useMutation({
        mutationFn: mutate(executionApi.submit, { body: submitRequestPayload }),
        onMutate: () => {
            setStatus("submitting")
            setRunResult(null)
            setJudgeResult(null)
        },
        onSuccess: (data: SubmitResult) => {
            setJudgeResult(data)
            setStatus("done")
            queryClient.invalidateQueries({
                queryKey: [problemApi.getSubmissions.path],
            })
        },
        onError: () => setStatus("error"),
    });

    const handleLanguageChange = (lang: Language): void => {
        setLanguage(lang)
        setCode(DEFAULT_CODE[lang])
    }

    const handleReset = (): void => setCode(DEFAULT_CODE[language])

    const handleRun = (): void => {
        if (!problem?.id) return
        runCode({ problemId: problem.id, language, sourceCode: code })
    }

    const handleSubmit = (): void => {
        if (!problem?.id) return
        submitCode({ problemId: problem.id, language, sourceCode: code })
    }

    if (isLoading) return <Spinner fullScreen />
    if (isError || !problem) return <NotFoundPage />

    return (
        <ResizablePanelGroup orientation="horizontal" className="h-[calc(100vh-3.5rem)]">
            <ResizablePanel defaultSize={40} minSize={28}>
                <Tabs defaultValue="description" className="flex h-full flex-col">
                    <TabsList variant="line" className="shrink-0 px-4">
                        <TabsTrigger value="description">
                            <BookOpen className="mr-1.5 h-4 w-4" />
                            Description
                        </TabsTrigger>
                        <TabsTrigger value="submissions">
                            <History className="mr-1.5 h-4 w-4" />
                            Submissions
                        </TabsTrigger>
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
                                isRunning={isRunning}
                                isSubmitting={isSubmitting}
                                code={code}
                            />
                            <div className="flex-1 overflow-hidden">
                                <CodeEditor
                                    language={language}
                                    initialCode={code}
                                    onCodeChange={setCode}
                                />
                            </div>
                        </div>
                    </ResizablePanel>

                    <ResizableHandle />

                    <ResizablePanel defaultSize={35} minSize={15}>
                        <OutputPanel
                            status={status}
                            runResult={runResult}
                            judgeResult={judgeResult}
                        />
                    </ResizablePanel>
                </ResizablePanelGroup>
            </ResizablePanel>
        </ResizablePanelGroup>
    )
}