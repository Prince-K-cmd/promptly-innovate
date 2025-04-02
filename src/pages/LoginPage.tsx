
import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/PasswordInput';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, LogIn, Loader2, CheckCircle } from 'lucide-react';
import ForgotPasswordDialog from '@/components/ForgotPasswordDialog';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

const LoginPage = () => {
  const { signIn, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Redirect if already logged in and check for success message
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }

    // Check for success message in location state
    if (location.state && location.state.message) {
      setSuccessMessage(location.state.message);
      // Clear the location state to prevent showing the message again on refresh
      window.history.replaceState({}, document.title);
    }
  }, [isAuthenticated, navigate, location.state]);

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);

    try {
      const { error } = await signIn(values.email, values.password);

      if (!error) {
        navigate('/');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md px-4 sm:px-8 py-8 sm:py-12">
      {/* Show logo only on mobile where the left panel is hidden */}
      <div className="text-center mb-8 lg:hidden">
        <div className="inline-block bg-gradient-to-r from-promptiverse-purple to-promptiverse-teal rounded-xl p-3 mb-6">
          <BookOpen className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Sign In to Promptiverse</h1>
        <p className="text-muted-foreground mt-3">
          Enter your details to access your account
        </p>
      </div>

      {/* Only show the title on desktop, not the logo */}
      <div className="hidden lg:block text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Sign In to Promptiverse</h1>
        <p className="text-muted-foreground mt-3">
          Enter your details to access your account
        </p>
      </div>

      <div className="bg-card p-8 rounded-xl shadow-lg border border-border/40">
        {/* Success message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your email"
                      type="email"
                      className="h-11"
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
                  <div className="flex justify-between items-center">
                    <FormLabel className="text-sm font-medium">Password</FormLabel>
                    <Button
                      variant="link"
                      className="p-0 h-auto text-xs font-normal"
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                    >
                      Forgot password?
                    </Button>
                  </div>
                  <FormControl>
                    <PasswordInput
                      placeholder="Enter your password"
                      className="h-11"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full h-11 text-base font-medium"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-5 w-5" />
                  Sign In
                </>
              )}
            </Button>
          </form>
        </Form>
      </div>

      <div className="text-center mt-8">
        <p className="text-muted-foreground">
          Don't have an account?{' '}
          <Link to="/signup" className="text-primary font-medium hover:underline">
            Create one now
          </Link>
        </p>
      </div>

      {/* Forgot Password Dialog */}
      <ForgotPasswordDialog
        open={showForgotPassword}
        onOpenChange={setShowForgotPassword}
      />
    </div>
  );
};

export default LoginPage;
