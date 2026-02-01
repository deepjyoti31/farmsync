
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Leaf, ArrowLeft, Loader2 } from "lucide-react";
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
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = React.useState(false);

  const loginSchema = z.object({
    email: z.string().email({ message: t('auth.validation.email_invalid') }),
    password: z.string().min(6, { message: t('auth.validation.password_length') }),
    rememberMe: z.boolean().default(false),
  });

  type LoginFormValues = z.infer<typeof loginSchema>;

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setIsLoading(true);
      await signIn(data.email, data.password);
      // Navigation is handled in the auth context
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 md:p-12 lg:p-16">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <Link to="/landing" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('auth.back_to_home')}
            </Link>
          </div>

          <div className="flex items-center mb-8">
            <Leaf className="h-8 w-8 text-primary mr-2" />
            <h1 className="text-2xl font-bold">FarmSync</h1>
          </div>

          <h2 className="text-3xl font-bold mb-2">{t('auth.welcome_back')}</h2>
          <p className="text-muted-foreground mb-8">
            {t('auth.login_subtitle')}
          </p>

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

              <div className="flex items-center justify-between">
                <FormField
                  control={form.control}
                  name="rememberMe"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal cursor-pointer">
                        {t('auth.remember_me')}
                      </FormLabel>
                    </FormItem>
                  )}
                />
                <a href="#" className="text-sm text-primary hover:underline">
                  {t('auth.forgot_password')}
                </a>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
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

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              {t('auth.no_account')}{" "}
              <Link to="/signup" className="text-primary hover:underline">
                {t('auth.signup')}
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Image */}
      <div className="hidden lg:block flex-1 bg-muted relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20">
          <div className="absolute inset-0 flex flex-col justify-center items-center p-12 text-center">
            <h2 className="text-3xl font-bold mb-4 max-w-md">
              {t('auth.empowering_farmers')}
            </h2>
            <p className="text-lg text-muted-foreground max-w-md">
              {t('auth.join_thousands')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
