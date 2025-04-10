
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Leaf, ArrowLeft, Check } from "lucide-react";
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
import { toast } from "@/hooks/use-toast";

const signupSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupFormValues = z.infer<typeof signupSchema>;

const Signup = () => {
  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (data: SignupFormValues) => {
    console.log("Signup data:", data);
    // In a real application, you would call your registration API here
    toast({
      title: "Account created!",
      description: "You've successfully signed up for KisanSathi.",
    });
    // Example redirection - in real application, add proper authentication flow
    setTimeout(() => {
      window.location.href = "/";
    }, 1500);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 md:p-12 lg:p-16">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <Link to="/landing" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to home
            </Link>
          </div>

          <div className="flex items-center mb-8">
            <Leaf className="h-8 w-8 text-primary mr-2" />
            <h1 className="text-2xl font-bold">KisanSathi</h1>
          </div>

          <h2 className="text-3xl font-bold mb-2">Create an account</h2>
          <p className="text-muted-foreground mb-8">
            Start your journey to smarter farming
          </p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="John Doe" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="your@email.com" 
                        type="email" 
                        {...field} 
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
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="••••••••" 
                        type="password" 
                        {...field} 
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
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="••••••••" 
                        type="password" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full">
                Create Account
              </Button>
            </form>
          </Form>

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Benefits */}
      <div className="hidden lg:block flex-1 bg-muted">
        <div className="h-full flex flex-col justify-center p-12">
          <div className="max-w-md mx-auto">
            <h2 className="text-2xl font-bold mb-6">Why join KisanSathi?</h2>
            
            <ul className="space-y-4">
              <li className="flex items-start">
                <div className="mt-1 mr-3 flex-shrink-0 h-5 w-5 bg-primary rounded-full flex items-center justify-center">
                  <Check className="h-3 w-3 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-medium">Complete Farm Management</h3>
                  <p className="text-muted-foreground">Manage all aspects of your farm in one platform - from fields to finances.</p>
                </div>
              </li>
              
              <li className="flex items-start">
                <div className="mt-1 mr-3 flex-shrink-0 h-5 w-5 bg-primary rounded-full flex items-center justify-center">
                  <Check className="h-3 w-3 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-medium">Data-Driven Insights</h3>
                  <p className="text-muted-foreground">Make better decisions with AI-powered analytics and recommendations.</p>
                </div>
              </li>
              
              <li className="flex items-start">
                <div className="mt-1 mr-3 flex-shrink-0 h-5 w-5 bg-primary rounded-full flex items-center justify-center">
                  <Check className="h-3 w-3 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-medium">Weather Integration</h3>
                  <p className="text-muted-foreground">Get real-time weather updates and forecasts specific to your farm location.</p>
                </div>
              </li>
              
              <li className="flex items-start">
                <div className="mt-1 mr-3 flex-shrink-0 h-5 w-5 bg-primary rounded-full flex items-center justify-center">
                  <Check className="h-3 w-3 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-medium">Mobile Access</h3>
                  <p className="text-muted-foreground">Access your farm data from anywhere, on any device.</p>
                </div>
              </li>
              
              <li className="flex items-start">
                <div className="mt-1 mr-3 flex-shrink-0 h-5 w-5 bg-primary rounded-full flex items-center justify-center">
                  <Check className="h-3 w-3 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-medium">Free Starter Plan</h3>
                  <p className="text-muted-foreground">Get started for free and upgrade as your farm's needs grow.</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
