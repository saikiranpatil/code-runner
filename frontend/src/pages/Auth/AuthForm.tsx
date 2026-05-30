import { useState } from 'react';

import { FaGithub } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import { HiCubeTransparent } from 'react-icons/hi2';
import { ImSpinner2 } from 'react-icons/im';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

export default function AuthForm() {
  const [isRegister, setIsRegister] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();

    setLoading(true);

    // Replace with real auth logic
    await new Promise((r) => setTimeout(r, 1200));

    setLoading(false);
  };

  return (
    <div className="flex flex-col justify-center h-full px-8 py-12 sm:px-12 lg:px-16 xl:px-20">
      <div className="w-full max-w-sm mx-auto">
        <div className="flex items-center gap-2 mb-10 lg:hidden">
          <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
            <HiCubeTransparent className="w-4 h-4 text-white" />
          </div>

          <span className="font-semibold text-sm tracking-tight">
            Code Runner
          </span>
        </div>

        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {isRegister ? "Create an account" : "Welcome back"}
          </h1>

          <p className="text-muted-foreground text-sm mt-1.5">
            {isRegister
              ? "Register to start using Code Runner"
              : "Sign in to your account to continue"}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <Button
            variant="outline"
            className="w-full h-10 font-normal text-sm gap-2"
            type="button"
          >
            <FcGoogle className="w-4 h-4 shrink-0" />
            Google
          </Button>

          <Button
            variant="outline"
            className="w-full h-10 font-normal text-sm gap-2"
            type="button"
          >
            <FaGithub className="w-4 h-4 shrink-0 text-foreground" />
            GitHub
          </Button>
        </div>

        <div className="relative mb-6">
          <Separator />

          <span className="absolute inset-0 flex items-center justify-center">
            <span className="bg-background px-2 text-xs text-muted-foreground">
              or continue with email
            </span>
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div className="space-y-1.5">
              <Label
                htmlFor="name"
                className="text-sm font-medium"
              >
                Full name
              </Label>

              <Input
                id="name"
                type="text"
                placeholder="Sahil Kumar"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-10"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm font-medium">
              Email address
            </Label>

            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="password"
                className="text-sm font-medium"
              >
                Password
              </Label>

              {!isRegister && (
                <a
                  href="#"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
                >
                  Forgot password?
                </a>
              )}
            </div>

            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete={
                isRegister
                  ? "new-password"
                  : "current-password"
              }
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-10"
            />
          </div>

          {!isRegister && (
            <div className="flex items-center gap-2">
              <Checkbox
                id="remember"
                checked={remember}
                onCheckedChange={(v) => setRemember(!!v)}
              />

              <Label
                htmlFor="remember"
                className="text-sm font-normal text-muted-foreground cursor-pointer"
              >
                Remember me for 30 days
              </Label>
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-10"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <ImSpinner2 className="h-4 w-4 animate-spin" />
                {isRegister
                  ? "Creating account..."
                  : "Signing in..."}
              </span>
            ) : isRegister ? (
              "Create account"
            ) : (
              "Sign in"
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {isRegister
            ? "Already have an account?"
            : "Don't have an account?"}{" "}
          <button
            type="button"
            onClick={() => setIsRegister(!isRegister)}
            className="font-medium text-foreground hover:underline underline-offset-4 transition-colors"
          >
            {isRegister ? "Sign in" : "Create one"}
          </button>
        </p>
      </div>
    </div>
  );
}