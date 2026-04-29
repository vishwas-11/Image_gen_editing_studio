"use client";
import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Sparkles, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/index";
import { useAuth } from "@/hooks";
import { getErrorMessage } from "@/lib/api/client";
import { ROUTES } from "@/lib/constants";

const schema = z.object({
  email:    z.string().email("Invalid email"),
  password: z.string().min(1, "Required"),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuth();
  const [showPass, setShowPass] = useState(false);
  const [serverError, setServerError] = useState("");

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setServerError("");
    try {
      await login(data.email, data.password);
    } catch (err) {
      setServerError(getErrorMessage(err));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-black bg-grid">
      <div className="absolute inset-0 bg-gradient-to-br from-studio-blue/3 via-transparent to-transparent pointer-events-none" />

      <div className="relative w-full max-w-sm animate-scale-in">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-11 h-11 rounded-xl bg-studio-blue flex items-center justify-center mb-4 glow-blue">
            <Sparkles size={20} className="text-white" />
          </div>
          <h1 className="font-display text-2xl text-white tracking-tight">Welcome back</h1>
          <p className="font-mono text-xs text-studio-subtle mt-1.5">Sign in to your account</p>
        </div>

        <div className="border border-studio-border rounded-xl bg-studio-surface/50 p-6 backdrop-blur-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            {serverError && (
              <div className="px-3 py-2.5 rounded border border-red-800/60 bg-red-950/40 font-mono text-xs text-red-400">
                {serverError}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-studio-subtle" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="pl-9"
                  {...register("email")}
                />
              </div>
              {errors.email && <p className="font-mono text-xs text-red-400">{errors.email.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-studio-subtle" />
                <Input
                  id="password"
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-9 pr-9"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-studio-subtle hover:text-white transition-colors"
                >
                  {showPass ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
              {errors.password && <p className="font-mono text-xs text-red-400">{errors.password.message}</p>}
            </div>

            <Button type="submit" loading={isSubmitting} className="w-full mt-1" size="default">
              Sign In
            </Button>
          </form>
        </div>

        <p className="text-center font-mono text-xs text-studio-subtle mt-5">
          No account?{" "}
          <Link href={ROUTES.REGISTER} className="text-studio-blue hover:underline">
            Create one free
          </Link>
        </p>
      </div>
    </div>
  );
}