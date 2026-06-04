import { Link, useNavigate } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { ImSpinner2 } from 'react-icons/im';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { URLs } from '@/common/urls';

import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../../store/auth.store';
import AuthFormLayout from '@/components/auth/AuthFormLayout';
import authApi from '@/types/auth/authApi';
import mutate from '@/utils/request/mutate';
import type { LoginResponse } from '@/types/auth/auth';
import { toast } from 'sonner';
import queryClient from '@/utils/request/queryClient';

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

export default function Login() {
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.handleLogin);

    const loginSchema = z.object({
        email: z
            .email('Enter a valid email address')
            .min(1, 'Email is required'),
        password: z
            .string()
            .min(1, 'Password is required')
            .min(8, 'Password must be at least 8 characters'),
    });

    type LoginFormValues = z.infer<typeof loginSchema>;

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    });

    const { mutate: handleLogin, isPending } = useMutation({
        mutationKey: ["UserLogin"],
        mutationFn: mutate(authApi.auth.login),
        onSuccess: (data: LoginResponse) => {
            queryClient.invalidateQueries({ queryKey: ["UserLogin"] });

            login(data.user, data.accessToken, data.expiresIn);
            navigate(URLs.home);
        },
    });

    const onSubmit = (values: LoginFormValues) => {
        handleLogin(values);
    };

    return (
        <AuthFormLayout
            title="Welcome back"
            description="Sign in to your account to continue"
            footer={
                <p className="mt-6 text-center text-sm text-muted-foreground">
                    Don't have an account?{' '}
                    <Link
                        to={URLs.auth.login}
                        className="font-medium text-foreground hover:underline"
                    >
                        Create one
                    </Link>
                </p>
            }
        >
            {/* Form */}
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-4"
            >
                {/* Email */}
                <motion.div
                    variants={itemVariants}
                    className="space-y-1.5"
                >
                    <Label htmlFor="email">
                        Email address
                    </Label>

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
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password">
                            Password
                        </Label>
                    </div>

                    <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        autoComplete="current-password"
                        aria-invalid={!!errors.password}
                        {...register('password')}
                    />

                    {errors.password && (
                        <p className="text-xs text-destructive">
                            {errors.password.message}
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
                                Signing in...
                            </span>
                        ) : (
                            'Sign in'
                        )}
                    </Button>
                </motion.div>
            </form>
        </AuthFormLayout>
    );
}