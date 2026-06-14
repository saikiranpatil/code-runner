import { LANGUAGES, type Language } from "@/common/constants"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Check, Copy, Loader2, Play, RotateCcw, Send } from "lucide-react"
import { useState, type JSX } from "react"

interface EditorToolbarProps {
    language: Language
    onLanguageChange: (lang: Language) => void
    onReset: () => void
    onRun: () => void
    onSubmit: () => void
    isRunning: boolean
    isSubmitting: boolean
    code: string
}

export default function EditorToolbar({
    language,
    onLanguageChange,
    onReset,
    onRun,
    onSubmit,
    isRunning,
    isSubmitting,
    code,
}: EditorToolbarProps): JSX.Element {
    const [copied, setCopied] = useState<boolean>(false)

    const handleCopy = async (): Promise<void> => {
        await navigator.clipboard.writeText(code)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
    }

    return (
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-background px-3">
            <div className="flex items-center gap-2">
                <Select value={language} onValueChange={(v) => onLanguageChange(v as Language)}>
                    <SelectTrigger className="h-8 w-36 rounded-lg text-xs">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                        <SelectGroup>
                            {LANGUAGES.map((l) => (
                                <SelectItem key={l.value} value={l.value} className="text-xs">
                                    {l.label}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </div>

            <div className="flex items-center gap-1.5">
                <TooltipProvider delayDuration={300}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={handleCopy}>
                                {copied
                                    ? <Check className="h-3.5 w-3.5 text-emerald-500" />
                                    : <Copy className="h-3.5 w-3.5" />}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-xs">Copy code</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-lg"
                                onClick={onReset}
                            >
                                <RotateCcw className="h-3.5 w-3.5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-xs">Reset to default</TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                <Separator orientation="vertical" className="mx-1 h-5" />

                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-lg gap-1.5 text-xs font-medium"
                    onClick={onRun}
                    disabled={isRunning || isSubmitting || !code.trim()}
                >
                    {isRunning
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <Play className="h-3.5 w-3.5 fill-current" />}
                    Run
                </Button>

                <Button
                    size="sm"
                    className="h-8 rounded-lg gap-1.5 text-xs font-medium"
                    onClick={onSubmit}
                    disabled={isRunning || isSubmitting || !code.trim()}
                >
                    {isSubmitting
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <Send className="h-3.5 w-3.5" />}
                    Submit
                </Button>
            </div>
        </div>
    )
}
