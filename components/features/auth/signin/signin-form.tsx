"use client";

import { cn } from "@/lib/utils";
import {
  Button,
  Card,
  CardContent,
  Input,
  Label,
  Separator,
} from "@/components/shared";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Cookie from "js-cookie";
import { GoogleButton } from "../google-login/google-button";

export function LoginForm({
  className,
  onSwitchToRegister,
  ...props
}: React.ComponentProps<"div"> & {
  onSwitchToRegister?: () => void;
}) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/api/accounts/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Sign In failed");
      }
      // Set the auth token with SameSite=None for cross-site requests
      Cookie.set("auth-token", data.access, {
        expires: 1,
        path: "/",
        sameSite: "none",
        secure: true
      });
      
      // Invalidate React Query cache to force a refetch with the new token
      window.dispatchEvent(new Event('auth-changed'));
      
      router.push("/v1/templates");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      console.error("Sign In error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("", className)} {...props}>
      <Card className="overflow-hidden shadow-md">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold">Welcome back</h1>
                <p className="text-balance text-muted-foreground">
                  Sign in to your Simple ProjeX account
                </p>
              </div>
              {error && (
                <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
                  {error}
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="johndoe25"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <a
                    href="#"
                    className="ml-auto text-xs underline-offset-2 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
              <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
                <span className="relative z-10 bg-white px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
              <GoogleButton className="w-full" />
              <Separator />
              <div className="text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <button
                  onClick={onSwitchToRegister}
                  className="text-black underline cursor-pointer"
                >
                  Sign Up
                </button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
