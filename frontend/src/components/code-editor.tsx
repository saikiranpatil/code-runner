import { useMemo, type Dispatch } from "react";

import Editor from "@monaco-editor/react";

import type {
    OnChange,
    OnMount,
} from "@monaco-editor/react";

import type * as Monaco from "monaco-editor";

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

    const handleMount: OnMount = (
        editor,
        monaco
    ) => {
        editor.focus();
    };

    return (
        <Editor
            height="100%"
            defaultLanguage={language}
            theme="vs-light"
            defaultValue={initialCode}
            onChange={handleChange}
            onMount={handleMount}
            options={options}
        />
    );
}