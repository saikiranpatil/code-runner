import { z } from 'zod'

export const registerSchema = z.object({
    email: z.email('Invalid email'),
    name: z.string().min(1, 'Name is required'),
    password: z.string().min(8),
    confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
})

export type RegisterFormValues = z.infer<typeof registerSchema>;