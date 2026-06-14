import type { JSX } from "react"

export default function InlineMarkdown({ text }: { text: string }): JSX.Element | null {
    if (!text) return null
    const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/)
    return (
        <>
            {parts.map((part, i) => {
                if (part.startsWith("`") && part.endsWith("`"))
                    return <code key={i} className="rounded bg-muted px-1 py-0.5 font-mono text-xs">{part.slice(1, -1)}</code>
                if (part.startsWith("**") && part.endsWith("**"))
                    return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>
                return part
            })}
        </>
    )
}