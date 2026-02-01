
import React from 'react';
import { Link } from 'react-router-dom';
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

const Signup = () => {
  const { t } = useTranslation();
  const { signUp } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);

  const signupSchema = z.object({
    firstName: z.string().min(2, { message: t('auth.validation.first_name_length') }),
    lastName: z.string().min(2, { message: t('auth.validation.last_name_length') }),
    email: z.string().email({ message: t('auth.validation.email_invalid') }),
    password: z.string().min(6, { message: t('auth.validation.password_length') }),
    confirmPassword: z.string(),
    agreeTerms: z.boolean().refine(val => val === true, {
      message: t('auth.validation.terms_required')
    })
  }).refine(data => data.password === data.confirmPassword, {
    message: t('auth.validation.password_mismatch'),
    path: ["confirmPassword"]
  });

  type SignupFormValues = z.infer<typeof signupSchema>;

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      agreeTerms: false,
    },
  });

  const onSubmit = async (data: SignupFormValues) => {
    try {
      setIsLoading(true);
      await signUp(data.email, data.password, {
        first_name: data.firstName,
        last_name: data.lastName
      });
      // Redirect to dashboard is handled in the auth context after signup
    } catch (error) {
      console.error("Signup error:", error);
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

          <h2 className="text-3xl font-bold mb-2">{t('auth.create_account')}</h2>
          <p className="text-muted-foreground mb-8">
            {t('auth.signup_subtitle')}
          </p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('auth.first_name')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('auth.placeholders.first_name')}
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
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('auth.last_name')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('auth.placeholders.last_name')}
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('auth.confirm_password')}</FormLabel>
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

              <FormField
                control={form.control}
                name="agreeTerms"
                render={({ field }) => (
                  <FormItem className="flex items-start space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-normal">
                        {t('auth.agree_terms')}{" "}
                        <a href="#" className="text-primary hover:underline">
                          {t('auth.terms')}
                        </a>{" "}
                        {t('auth.and')}{" "}
                        <a href="#" className="text-primary hover:underline">
                          {t('auth.privacy')}
                        </a>
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('auth.creating_account')}
                  </>
                ) : (
                  t('auth.base_create_account')
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              {t('auth.already_have_account')}{" "}
              <Link to="/login" className="text-primary hover:underline">
                {t('auth.login')}
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
              {t('auth.welcome_farmsync')}
            </h2>
            <p className="text-lg text-muted-foreground max-w-md">
              {t('auth.join_community')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
