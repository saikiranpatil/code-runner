import { Link, useNavigate } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { FaGithub } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import { HiCubeTransparent } from 'react-icons/hi2';
import { ImSpinner2 } from 'react-icons/im';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

import { URLs } from '@/shared/urls';
import { ENDPOINTS } from '@/api/endpoints';
import { mutate } from '@/utils/request/mutate';

import { useMutation } from '@tanstack/react-query';

import {
    loginSchema,
    type LoginFormValues,
} from '@/module/auth/schema/login.schema';
import { useAuthStore } from '../auth.store';
import type { LoginResponse } from '../auth.dto';
import AuthFormLayout from '@/components/layout/AuthFormLayout';

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

    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
            rememberMe: false,
        },
    });

    const { mutate: handleLogin, isPending } = useMutation({
        mutationFn: mutate(ENDPOINTS.AUTH.LOGIN),
        onSuccess: (data: LoginResponse) => {
            console.log('LOGIN SUCCESS', data);
            login(data.user, data.accessToken, data.expiresIn);
            navigate(URLs.home.base);
        },
        onError: (error) => {
            console.error('LOGIN ERROR', error);
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
                        to={URLs.auth.register}
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

                        <button
                            type="button"
                            className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
                        >
                            Forgot password?
                        </button>
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

                {/* Remember Me */}
                <motion.div
                    variants={itemVariants}
                    className="flex items-center gap-2"
                >
                    <Controller
                        name="rememberMe"
                        control={control}
                        render={({ field }) => (
                            <Checkbox
                                id="rememberMe"
                                checked={field.value}
                                onCheckedChange={(checked) =>
                                    field.onChange(Boolean(checked))
                                }
                            />
                        )}
                    />

                    <Label
                        htmlFor="rememberMe"
                        className="cursor-pointer text-sm font-normal text-muted-foreground"
                    >
                        Remember me for 30 days
                    </Label>
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