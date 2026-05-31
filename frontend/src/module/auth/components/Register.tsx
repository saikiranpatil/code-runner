import { Link, useNavigate } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { FaGithub } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import { HiCubeTransparent } from 'react-icons/hi2';
import { ImSpinner2 } from 'react-icons/im';

import { useMutation } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

import { URLs } from '@/shared/urls';
import { ENDPOINTS } from '@/api/endpoints';
import { mutate } from '@/utils/request/mutate';

import {
    registerSchema,
    type RegisterFormValues,
} from '@/module/auth/schema/register.schema';

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.07,
            delayChildren: 0.1,
        },
    },
};

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
        mutationFn: mutate(ENDPOINTS.AUTH.REGISTER),

        onSuccess: (data) => {
            console.log('REGISTER SUCCESS', data);

            navigate(URLs.auth.login);
        },

        onError: (error) => {
            console.error('REGISTER ERROR', error);
        },
    });

    const onSubmit = ({
        confirmPassword,
        ...payload
    }: RegisterFormValues) => {
        handleRegister(payload);
    };

    return (
        <div className="flex h-full flex-col justify-center px-8 py-12 sm:px-12 lg:px-16 xl:px-20">
            <motion.div
                className="mx-auto w-full max-w-sm"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Mobile Logo */}
                <motion.div
                    variants={itemVariants}
                    className="mb-10 flex items-center gap-2 lg:hidden"
                >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900">
                        <HiCubeTransparent className="h-4 w-4 text-white" />
                    </div>

                    <span className="text-sm font-semibold tracking-tight">
                        Code Runner
                    </span>
                </motion.div>

                {/* Header */}
                <motion.div variants={itemVariants} className="mb-8">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        Create an account
                    </h1>

                    <p className="mt-1.5 text-sm text-muted-foreground">
                        Register to start using Code Runner
                    </p>
                </motion.div>

                {/* OAuth */}
                <motion.div
                    variants={itemVariants}
                    className="mb-6 grid grid-cols-2 gap-3"
                >
                    <Button
                        variant="outline"
                        className="h-10 w-full gap-2 text-sm font-normal"
                        type="button"
                    >
                        <FcGoogle className="h-4 w-4 shrink-0" />
                        Google
                    </Button>

                    <Button
                        variant="outline"
                        className="h-10 w-full gap-2 text-sm font-normal"
                        type="button"
                    >
                        <FaGithub className="h-4 w-4 shrink-0 text-foreground" />
                        GitHub
                    </Button>
                </motion.div>

                {/* Divider */}
                <motion.div variants={itemVariants} className="relative mb-6">
                    <Separator />

                    <span className="absolute inset-0 flex items-center justify-center">
                        <span className="bg-background px-2 text-xs text-muted-foreground">
                            or continue with email
                        </span>
                    </span>
                </motion.div>

                {/* Form */}
                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="space-y-4"
                >
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

                {/* Footer */}
                <motion.p
                    variants={itemVariants}
                    className="mt-6 text-center text-sm text-muted-foreground"
                >
                    Already have an account?{' '}
                    <Link
                        to={URLs.auth.login}
                        className="font-medium text-foreground transition-colors hover:underline"
                    >
                        Sign in
                    </Link>
                </motion.p>
            </motion.div>
        </div>
    );
}