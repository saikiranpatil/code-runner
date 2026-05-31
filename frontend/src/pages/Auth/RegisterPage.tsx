import { Link } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import { FaGithub } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import { HiCubeTransparent } from 'react-icons/hi2';
import { ImSpinner2 } from 'react-icons/im';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { URLs } from '@/shared/urls';
import { registerSchema, type RegisterFormValues } from '@/shared/schemas/auth.schema';
import { mutate } from '@/utils/request/mutate';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ENDPOINTS } from '@/api/endpoints';

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
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

export default function RegisterPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '', confirmPassword: '', name: '' },
  });

  const { mutate: handleRegister, isPending } = useMutation({ mutationFn: mutate(ENDPOINTS.AUTH.REGISTER) });
  const onSubmit = (data: RegisterFormValues) => { handleRegister(data) };

  return (
    <div className="flex flex-col justify-center h-full px-8 py-12 sm:px-12 lg:px-16 xl:px-20">
      <motion.div
        className="w-full max-w-sm mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Logo — mobile only */}
        <motion.div variants={itemVariants} className="flex items-center gap-2 mb-10 lg:hidden">
          <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
            <HiCubeTransparent className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-sm tracking-tight">Code Runner</span>
        </motion.div>

        {/* Heading */}
        <motion.div variants={itemVariants} className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Create an account</h1>
          <p className="text-muted-foreground text-sm mt-1.5">Register to start using Code Runner</p>
        </motion.div>

        {/* OAuth */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3 mb-6">
          <Button variant="outline" className="w-full h-10 font-normal text-sm gap-2" type="button">
            <FcGoogle className="w-4 h-4 shrink-0" /> Google
          </Button>
          <Button variant="outline" className="w-full h-10 font-normal text-sm gap-2" type="button">
            <FaGithub className="w-4 h-4 shrink-0 text-foreground" /> GitHub
          </Button>
        </motion.div>

        {/* Divider */}
        <motion.div variants={itemVariants} className="relative mb-6">
          <Separator />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="bg-background px-2 text-xs text-muted-foreground">or continue with email</span>
          </span>
        </motion.div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <motion.div variants={itemVariants} className="space-y-1.5">
            <Label htmlFor="name" className="text-sm font-medium">Full name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Sahil Kumar"
              autoComplete="name"
              className="h-10"
              {...register('name')}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-1.5">
            <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              className="h-10"
              {...register('email')}
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-1.5">
            <Label htmlFor="password" className="text-sm font-medium">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              className="h-10"
              {...register('password')}
            />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </motion.div>

          {/* Confirm Password — add this if it exists in your schema/values */}
          <motion.div variants={itemVariants} className="space-y-1.5">
            <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              className="h-10"
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
          </motion.div>

          <motion.div variants={itemVariants}>
            <Button type="submit" className="w-full h-10" disabled={isPending}>
              {isPending ? (
                <span className="flex items-center gap-2">
                  <ImSpinner2 className="h-4 w-4 animate-spin" /> Creating account...
                </span>
              ) : (
                'Create account'
              )}
            </Button>
          </motion.div>
        </form>

        <motion.p variants={itemVariants} className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link
            to={URLs.auth.login}
            className="font-medium text-foreground hover:underline underline-offset-4 transition-colors"
          >
            Sign in
          </Link>
        </motion.p>
      </motion.div>
    </div>
  );
}