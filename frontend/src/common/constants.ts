export const QUEUE_NAMES = {
    EXECUTIONS: 'executions',
};

export const NODE_ENVS = {
    PRODUCTION: 'PRODUCTION',
    DEVELOPMENT: 'DEVELOPMENT',
}

export type Language = "javascript" | "typescript" | "python" | "cpp" | "java"

export const LANGUAGES: { label: string; value: Language }[] = [
    {
        label: "JavaScript",
        value: "javascript",
    },
    {
        label: "TypeScript",
        value: "typescript",
    },
    {
        label: "Python",
        value: "python",
    },
    {
        label: "C++",
        value: "cpp",
    },
    {
        label: "Java",
        value: "java",
    },
];

export const DEFAULT_CODE: Record<Language, string> = {
    javascript:
        "// Read from stdin via process.stdin\nconst lines = require('fs').readFileSync('/dev/stdin','utf8').split('\\n');\n",
    typescript:
        "// Read from stdin\nconst lines = require('fs').readFileSync('/dev/stdin','utf8').split('\\n');\n",
    python: "import sys\nlines = sys.stdin.read().split('\\n')\n",
    cpp: "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // your code here\n    return 0;\n}\n",
    java: "import java.util.*;\n\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // your code here\n    }\n}\n",
}

export const LANGUAGE_LOCAL_STORAGE_KEY = "LANGUAGE_LOCAL_STORAGE_KEY";
export const SOURCE_CODE_LOCAL_STORAGE_KEY = "LANGUAGE_LOCAL_STORAGE_KEY";