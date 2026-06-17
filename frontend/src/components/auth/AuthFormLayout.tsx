import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';
import { motion, type Variants } from 'framer-motion';

import { FaGithub } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import { HiCubeTransparent } from 'react-icons/hi2';
import { useMutation } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import SidePanel from '@/components/auth/SidePanel';

import { URLs } from '@/common/urls';
import { useAuthStore } from '@/store/auth.store';
import { handleOAuthClick } from './utils/Oauth';
import queryClient from '@/utils/request/queryClient';

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
    const login = useAuthStore((state) => state.handleLogin);

    const handleSocialLogin = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ["OAuth"] });
        navigate(URLs.problems.list);
    }, []);

    const { mutate: handleGoogleLogin, isPending: isGooglePending } = useMutation({
        mutationFn: () => handleOAuthClick(login, "google"),
        onSuccess: handleSocialLogin
    });

    const { mutate: handleGithubLogin, isPending: isGithubPending } = useMutation({
        mutationFn: () => handleOAuthClick(login, "github"),
        onSuccess: handleSocialLogin
    });

    return (
        <div className="min-h-screen grid lg:grid-cols-2">
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
                                onClick={() => handleGoogleLogin()}
                                loading={isGooglePending}
                            >
                                <FcGoogle className="h-4 w-4" />
                                Google
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                className="h-10 gap-2"
                                onClick={() => handleGithubLogin()}
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