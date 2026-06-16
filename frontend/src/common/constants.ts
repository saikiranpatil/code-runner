export const QUEUE_NAMES = {
    EXECUTIONS: 'executions',
};

export const NODE_ENVS = {
    PRODUCTION: 'PRODUCTION',
    DEVELOPMENT: 'DEVELOPMENT',
}

export type Language = "javascript" | "typescript" | "python" | "cpp" | "java"

export const LANGUAGES: { label: string; value: Language, defaultCode: string }[] = [
    {
        label: "JavaScript",
        value: "javascript",
        defaultCode: `function main() {
    // Your code here
}

main();` },
    {
        label: "TypeScript",
        value: "typescript",
        defaultCode: `function main(): void {
    // Your code here
}

main();` },
    {
        label: "Python",
        value: "python",
        defaultCode: `def main():
    # Your code here

if __name__ == "__main__":
    main()` },
    {
        label: "C++",
        value: "cpp",
        defaultCode: `#include <iostream>
using namespace std;

int main() {
    // Your code here
    return 0;
}`,
    },
    {
        label: "Java",
        value: "java",
        defaultCode: `public class Solution {
    public static void main(String[] args) {
        // Your code here
    }
}` },
];