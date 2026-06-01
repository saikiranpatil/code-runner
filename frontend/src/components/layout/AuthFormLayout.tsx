import { motion, type Variants } from 'framer-motion';
import { FaGithub } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import { HiCubeTransparent } from 'react-icons/hi2';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import SidePanel from '@/module/auth/components/SidePanel';
import { useMutation, useQuery } from '@tanstack/react-query';
import { mutate } from '@/utils/request/mutate';
import { ENDPOINTS } from '@/api/endpoints';
import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';
import { URLs } from '@/shared/urls';
import { query } from '@/utils/request/query';

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

export const itemVariants: Variants = {
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

type Props = {
    title: string;
    description: string;
    children: React.ReactNode;
    footer: React.ReactNode;
};

export default function AuthFormLayout({
    title,
    description,
    children,
    footer,
}: Props) {
    const navigate = useNavigate();

    const handleSocialLogin = useCallback(() => {
        navigate(URLs.problems.base);
    }, []);

    const { mutate: handleGoogleLogin, isPending: isGooglePending } = useMutation({
        mutationFn: mutate(ENDPOINTS.AUTH.GOOGLE),
        onSuccess: handleSocialLogin
    });

    const { mutate: handleGithubLogin, isPending: isGithubPending } = useMutation({
        mutationFn: mutate(ENDPOINTS.AUTH.GITHUB),
        onSuccess: handleSocialLogin
    });

    return (
        <div className="h-full grid lg:grid-cols-2">
            <SidePanel />
            <div className="h-full my-4 overflow-y-auto">
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
                            <h1 className="text-2xl font-bold tracking-tight">
                                {title}
                            </h1>

                            <p className="mt-1.5 text-sm text-muted-foreground">
                                {description}
                            </p>
                        </motion.div>

                        {/* OAuth */}
                        <motion.div
                            variants={itemVariants}
                            className="mb-6 grid grid-cols-2 gap-3"
                        >
                            <Button
                                type="button"
                                variant="outline"
                                className="h-10 gap-2"
                                onClick={() => handleGoogleLogin({})}
                                loading={isGooglePending}
                            >
                                <FcGoogle className="h-4 w-4" />
                                Google
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                className="h-10 gap-2"
                                onClick={() => {
                                    window.location.href =
                                        `${import.meta.env.VITE_API_URL}/auth/github`;
                                }}
                                loading={isGithubPending}
                            >
                                <FaGithub className="h-4 w-4" />
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

                        {children}

                        {footer}
                    </motion.div>
                </div>
            </div>
        </div>
    );
}