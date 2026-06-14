import { useState, type JSX } from "react"
import {
    BookOpen,
    History,
} from "lucide-react"

import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"

import CodeEditor from "@/common/components/code-editor"

import { LANGUAGES, type Language } from "@/common/constants"
import ProblemDescription from "@/components/problems/ProblemDetails/ProblemDescription"
import SubmissionsTab from "@/components/problems/ProblemDetails/SubmisionsTab"
import EditorToolbar from "@/components/problems/ProblemDetails/EditorToolbar"
import OutputPanel from "@/components/problems/ProblemDetails/OutputPanel"
import type { ExecResult, ExecStatus } from "@/api/execution/execution"
import { useParams } from "react-router-dom"
import NotFoundPage from "@/pages/NotFoundPage"

export default function ProblemDetail(): JSX.Element {
    const { slug } = useParams();

    const getDefaultCode = (currentLanguage: Language) => {
        return LANGUAGES.find(language => language.value === currentLanguage)?.defaultCode ?? "";
    };

    const [language, setLanguage] = useState<Language>("javascript");
    const [code, setCode] = useState<string>(getDefaultCode(language));
    const [customInput, setCustomInput] = useState<string>("")

    const [execStatus, setExecStatus] = useState<ExecStatus>("idle")
    const [result, setResult] = useState<ExecResult | null>(null)


    const handleLanguageChange = (lang: Language): void => {
        setLanguage(lang)
        setCode(getDefaultCode(lang))
    }

    const handleReset = (): void => {
        setCode(getDefaultCode(language));
    }

    const handleRun = (): void => {
        setExecStatus("running")
        // Simulate for demo — replace with useExecution / useMutation
        setTimeout(() => {
            setResult({
                state: "completed",
                exitCode: 0,
                timedOut: false,
                oomKilled: false,
                outputLimitHit: false,
                stdout: "[0, 1]",
                stderr: "",
            })
            setExecStatus("done")
        }, 1800)
    }

    const handleSubmit = (): void => {
        setExecStatus("submitting")
        setTimeout(() => {
            setResult({
                state: "completed",
                verdict: "ACCEPTED",
                exitCode: 0,
                timedOut: false,
                oomKilled: false,
                outputLimitHit: false,
                stdout: "[0, 1]",
                stderr: "",
            })
            setExecStatus("done")
        }, 2500)
    }

    if (!slug) {
        return <NotFoundPage />
    }

    return (
        <div className="flex h-[calc(100vh-56px)] flex-col overflow-hidden">
            {/* Main content */}
            <ResizablePanelGroup orientation="horizontal" className="flex-1 overflow-hidden">
                {/* ── Left: description ── */}
                <ResizablePanel defaultSize={35}>
                    <Tabs defaultValue="description" className="flex flex-col">
                        <TabsList className="w-full shrink-0 justify-start gap-0 rounded-none border-b border-border bg-transparent px-2">
                            <div>
                                <TabsTrigger
                                    value="description"
                                    className="h-8 gap-1.5 rounded-lg px-3 my-4 text-xs data-[state=active]:bg-accent data-[state=active]:shadow-none"
                                >
                                    <BookOpen className="h-3 w-3" /> Description
                                </TabsTrigger>
                                <TabsTrigger
                                    value="submissions"
                                    className="h-8 gap-1.5 rounded-lg px-3 my-4 text-xs data-[state=active]:bg-accent data-[state=active]:shadow-none"
                                >
                                    <History className="h-3 w-3" /> Submissions
                                </TabsTrigger>
                            </div>
                        </TabsList>

                        <TabsContent value="description" className="min-h-0 flex-1 overflow-hidden mt-0">
                            <ScrollArea className="h-full">
                                <ProblemDescription />
                            </ScrollArea>
                        </TabsContent>

                        <TabsContent value="submissions" className="min-h-0 flex-1 overflow-hidden mt-0">
                            <ScrollArea className="h-full">
                                <SubmissionsTab />
                            </ScrollArea>
                        </TabsContent>
                    </Tabs>
                </ResizablePanel>

                <ResizableHandle withHandle />

                {/* ── Right: editor + output ── */}
                <ResizablePanel defaultSize={62} minSize={35}>
                    <ResizablePanelGroup orientation="vertical">
                        {/* Editor */}
                        <ResizablePanel defaultSize={62} minSize={30}>
                            <div className="flex h-full flex-col">
                                <EditorToolbar
                                    language={language}
                                    onLanguageChange={handleLanguageChange}
                                    onReset={handleReset}
                                    onRun={handleRun}
                                    onSubmit={handleSubmit}
                                    isRunning={execStatus === "running"}
                                    isSubmitting={execStatus === "submitting"}
                                    code={code}
                                />
                                <div className="min-h-0 flex-1">
                                    <CodeEditor
                                        key={language}
                                        language={language}
                                        initialCode={code}
                                        onCodeChange={setCode}
                                    />
                                </div>
                            </div>
                        </ResizablePanel>

                        <ResizableHandle withHandle />

                        {/* Output */}
                        <ResizablePanel defaultSize={38} minSize={18}>
                            <OutputPanel
                                status={execStatus}
                                result={result}
                                customInput={customInput}
                                onCustomInputChange={setCustomInput}
                            />
                        </ResizablePanel>
                    </ResizablePanelGroup>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    )
}