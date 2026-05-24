import { useMemo, type Dispatch } from "react";

import Editor from "@monaco-editor/react";

import type {
    OnChange,
    OnMount,
} from "@monaco-editor/react";

import type * as Monaco from "monaco-editor";
import { useTheme } from "./theme-provider";

const options: Monaco.editor.IStandaloneEditorConstructionOptions = {
    fontSize: 14,
    minimap: {
        enabled: false,
    },
    automaticLayout: true,
};

interface CodeEditorProps {
    initialCode?: string;
    onCodeChange?: Dispatch<React.SetStateAction<string>>
    language: string
};

export default function CodeEditor({ initialCode = "", onCodeChange, language }: CodeEditorProps) {
    const handleChange: OnChange = (value) => {
        onCodeChange?.(value ?? "");
    };

    const handleMount: OnMount = (editor) => { editor.focus() };

    const { resolvedTheme } = useTheme();
    const editorTheme = resolvedTheme === "dark" ? "vs-dark" : "vs-light";

    return (
        <Editor
            height="100%"
            language={language}
            value={initialCode}
            theme={editorTheme}
            onChange={handleChange}
            onMount={handleMount}
            options={options}
        />
    );
}