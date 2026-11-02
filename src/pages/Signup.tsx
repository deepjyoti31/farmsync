
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
    <AuthLayout
      title={t('auth.create_account')}
      subtitle={t('auth.signup_subtitle')}
      footer={<>
        {t('auth.already_have_account')}{" "}
              <Link to="/login" className="font-semibold text-primary hover:underline">
                {t('auth.login')}
              </Link>
      </>}
    >
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

              <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
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
    </AuthLayout>
  );
};

export default Signup;
