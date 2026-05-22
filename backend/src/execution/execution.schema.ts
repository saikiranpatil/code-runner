import { z } from 'zod';

export const executionSchema = z.object({
    code: z.string().min(1),

    language: z.enum([
        'js',
        'python',
    ]),
});

export type ExecutionInput = z.infer<typeof executionSchema>;