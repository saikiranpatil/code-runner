import { z } from 'zod'

export const loginSchema = z.object({
    email: z
        .email('Enter a valid email address')
        .min(1, 'Email is required'),
    password: z
        .string()
        .min(1, 'Password is required')
        .min(8, 'Password must be at least 8 characters'),
    remember: z.boolean(),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
    email: z.email('Invalid email'),
    name: z.string().min(1, 'Name is required'),
    password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
    confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
})

export type RegisterFormValues = z.infer<typeof registerSchema>;