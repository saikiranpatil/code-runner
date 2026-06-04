import { Link, useNavigate } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { ImSpinner2 } from 'react-icons/im';

import { useMutation } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { URLs } from '@/common/urls';

import AuthFormLayout from '@/components/auth/AuthFormLayout';
import { useAuthStore } from '../../store/auth.store';
import { z } from 'zod'
import mutate from '@/utils/request/mutate';
import authApi from '@/types/auth/authApi';
import type { RegisterResponse } from '@/types/auth/auth';

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.4,
            ease: [0.25, 0.46, 0.45, 0.94],
        },
    },
};

export default function Register() {
    const navigate = useNavigate();
    const login = useAuthStore(store => store.handleLogin);

    const registerSchema = z.object({
        email: z.email('Invalid email'),
        name: z.string().min(1, 'Name is required'),
        password: z.string().min(8),
        confirmPassword: z.string(),
    }).refine(d => d.password === d.confirmPassword, {
        message: "Passwords don't match",
        path: ['confirmPassword'],
    })

    type RegisterFormValues = z.infer<typeof registerSchema>;

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            name: '',
            email: '',
            password: '',
            confirmPassword: '',
        },
    });

    const { mutate: handleRegister, isPending } = useMutation({
        mutationFn: mutate(authApi.auth.register),
        onSuccess: (data: RegisterResponse) => {
            console.log("REGISTER SUCCESS DATA", data);
            login(data.user, data.accessToken, data.expiresIn);
            navigate(URLs.home);
        },
    });

    const onSubmit = ({
        confirmPassword,
        ...payload
    }: RegisterFormValues) => {
        handleRegister(payload);
    };

    return (
        <AuthFormLayout
            title="Create an account"
            description="Register to start using Code Runner"
            footer={
                <p className="mt-6 text-center text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <Link
                        to={URLs.auth.login}
                        className="font-medium text-foreground hover:underline"
                    >
                        Sign in
                    </Link>
                </p>
            }
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Name */}
                <motion.div
                    variants={itemVariants}
                    className="space-y-1.5"
                >
                    <Label htmlFor="name">Full name</Label>

                    <Input
                        id="name"
                        type="text"
                        placeholder="Sahil Kumar"
                        autoComplete="name"
                        aria-invalid={!!errors.name}
                        {...register('name')}
                    />

                    {errors.name && (
                        <p className="text-xs text-destructive">
                            {errors.name.message}
                        </p>
                    )}
                </motion.div>

                {/* Email */}
                <motion.div
                    variants={itemVariants}
                    className="space-y-1.5"
                >
                    <Label htmlFor="email">Email address</Label>

                    <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        autoComplete="email"
                        aria-invalid={!!errors.email}
                        {...register('email')}
                    />

                    {errors.email && (
                        <p className="text-xs text-destructive">
                            {errors.email.message}
                        </p>
                    )}
                </motion.div>

                {/* Password */}
                <motion.div
                    variants={itemVariants}
                    className="space-y-1.5"
                >
                    <Label htmlFor="password">Password</Label>

                    <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        autoComplete="new-password"
                        aria-invalid={!!errors.password}
                        {...register('password')}
                    />

                    {errors.password && (
                        <p className="text-xs text-destructive">
                            {errors.password.message}
                        </p>
                    )}
                </motion.div>

                {/* Confirm Password */}
                <motion.div
                    variants={itemVariants}
                    className="space-y-1.5"
                >
                    <Label htmlFor="confirmPassword">
                        Confirm password
                    </Label>

                    <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        autoComplete="new-password"
                        aria-invalid={!!errors.confirmPassword}
                        {...register('confirmPassword')}
                    />

                    {errors.confirmPassword && (
                        <p className="text-xs text-destructive">
                            {errors.confirmPassword.message}
                        </p>
                    )}
                </motion.div>

                {/* Submit */}
                <motion.div variants={itemVariants}>
                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isPending}
                    >
                        {isPending ? (
                            <span className="flex items-center gap-2">
                                <ImSpinner2 className="h-4 w-4 animate-spin" />
                                Creating account...
                            </span>
                        ) : (
                            'Create account'
                        )}
                    </Button>
                </motion.div>
            </form>
        </AuthFormLayout>
    );
}