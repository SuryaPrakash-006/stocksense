import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "@/services/auth-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, ArrowLeft, KeyRound, Mail, Terminal } from "lucide-react";

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await authService.forgotPassword(email);
      if (response.dev_otp) {
        setDevOtp(response.dev_otp);
      }
      // Navigate to reset password page with email and optional dev otp
      setTimeout(() => {
        navigate("/reset-password", {
          state: { email, devOtp: response.dev_otp },
        });
      }, response.dev_otp ? 3500 : 1000);
    } catch (err: any) {
      setError(
        err.response?.data?.detail || "Failed to process request. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 items-center justify-center font-bold shadow-sm border border-amber-500/20">
            <KeyRound className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Reset Password
          </h1>
          <p className="text-sm text-slate-500">
            Enter your email to receive a secure 6-digit OTP code
          </p>
        </div>

        <Card className="shadow-lg border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg">Forgot Password</CardTitle>
            <CardDescription>
              We'll send a 6-digit one-time password (valid for 10 minutes) to reset your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-start gap-2.5 p-3.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300 text-xs">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {devOtp && (
                <div className="p-3.5 rounded-lg border border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <Terminal className="h-4 w-4 text-amber-600" />
                    <span>Development Environment Mode</span>
                  </div>
                  <p>
                    Your generated OTP code is: <strong className="font-mono text-sm tracking-widest text-amber-700 dark:text-amber-300">{devOtp}</strong>
                  </p>
                  <p className="text-[11px] text-amber-700/80">
                    Redirecting to verification screen...
                  </p>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email">Registered Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    required
                    placeholder="user@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    autoComplete="email"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || !!devOtp}
                className="w-full mt-2"
              >
                <span>{isSubmitting ? "Sending OTP..." : "Send Verification OTP"}</span>
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-slate-100 dark:border-slate-800 p-4">
            <Link
              to="/login"
              className="text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Sign In</span>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};
