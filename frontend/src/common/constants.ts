export const QUEUE_NAMES = {
    EXECUTIONS: 'executions',
};

export const NODE_ENVS = {
    PRODUCTION: 'PRODUCTION',
    DEVELOPMENT: 'DEVELOPMENT',
}

export const LANGUAGES = [
    { label: 'JavaScript', value: 'javascript' },
    { label: 'TypeScript', value: 'typescript' },
    { label: 'Python', value: 'python' },
    { label: 'Ruby', value: 'ruby' },
    { label: 'PHP', value: 'php' },
    { label: 'C++', value: 'cpp' },
    { label: 'C', value: 'c' },
]

export type Language = (typeof LANGUAGES)[number]['value'];