
import React from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import AuthLayout from "@/components/auth/AuthLayout";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from 'react-i18next';

const Login = () => {
  const { t } = useTranslation();
  const { signIn, user, loading } = useAuth();
  const location = useLocation();
  // ProtectedRoute sends people here with the page they were trying to open.
  const from = (location.state as { from?: { pathname?: string; search?: string } } | null)?.from;
  const redirectTo = from?.pathname?.startsWith('/dashboard') ? `${from.pathname}${from.search ?? ''}` : '/dashboard';
  const [isLoading, setIsLoading] = React.useState(false);

  const loginSchema = z.object({
    email: z.string().email({ message: t('auth.validation.email_invalid') }),
    password: z.string().min(6, { message: t('auth.validation.password_length') }),
  });

  type LoginFormValues = z.infer<typeof loginSchema>;

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setIsLoading(true);
      await signIn(data.email, data.password, redirectTo);
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!loading && user) return <Navigate to={redirectTo} replace />;

  return (
    <AuthLayout
      title={t('auth.welcome_back')}
      subtitle={t('auth.login_subtitle')}
      footer={<>
        {t('auth.no_account')}{" "}
              <Link to="/signup" className="font-semibold text-primary hover:underline">
                {t('auth.signup')}
              </Link>
      </>}
    >
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('auth.email')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('auth.placeholders.email')}
                        type="email"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('auth.password')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('auth.placeholders.password')}
                        type="password"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('auth.logging_in')}
                  </>
                ) : (
                  t('auth.login_button')
                )}
              </Button>
            </form>
          </Form>
    </AuthLayout>
  );
};

export default Login;
