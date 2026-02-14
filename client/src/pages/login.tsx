import { useLogin, useUser } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@shared/routes";
import { useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

const loginSchema = api.auth.login.input;
type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { data: user, isLoading: isUserLoading } = useUser();
  const { mutate: login, isPending } = useLogin();

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  const onSubmit = (data: LoginValues) => {
  login(data, {
    onError: (error: any) => {
      form.setError("root", {
        message: error.message || "Invalid username or password",
      });
    },
  });
};

  if (isUserLoading) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex bg-slate-100">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-blue-600/10 z-0" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold tracking-tight">
              AARKAY Packaging Industries Pvt Ltd
            </span>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <h1 className="text-4xl font-bold leading-tight">
            Manage your inventory with <br />
            precision and control.
          </h1>
          <p className="text-slate-400 text-lg max-w-md">
            Complete tracking for reel stock, usage history, and material
            requirements planning in one unified system.
          </p>
        </div>

        <div className="relative z-10 text-sm text-slate-500">
          © 2026 Inventoy ERP System. All rights reserved.
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="w-full max-w-md shadow-2xl border-none bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-8">
            <CardTitle className="text-2xl font-bold tracking-tight">
              Sign in
            </CardTitle>
            <CardDescription>Enter credentials</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  {...form.register("username")}
                  className="bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                />
                {form.formState.errors.username && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.username.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  {...form.register("password")}
                  className="bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                />
                {form.formState.errors.password && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>

              {form.formState.errors.root && (
                <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm font-medium">
                  {form.formState.errors.root.message}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-11 text-base shadow-lg shadow-primary/20"
                disabled={isPending}
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>

              <div className="text-right">
                <a
                  href="/forgot-password"
                  className="text-sm text-slate-600 hover:underline"
                 >
                     Forgot password?
              </a>
             </div>

            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
