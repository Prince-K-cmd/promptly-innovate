import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
import { PasswordInput } from '@/components/PasswordInput';
import { Input } from '@/components/ui/input';
import { BookOpen, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Form schema with password validation and confirmation
const formSchema = z.object({
  password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
  confirmPassword: z.string().min(8, { message: 'Password must be at least 8 characters' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  // Extract token from URL or query parameters
  useEffect(() => {
    // First try to get token from hash fragment (Supabase default)
    const hashParams = new URLSearchParams(location.hash.substring(1));
    let accessToken = hashParams.get('access_token');

    // If not found in hash, try query parameters
    if (!accessToken) {
      const queryParams = new URLSearchParams(location.search);
      accessToken = queryParams.get('token');
    }

    if (accessToken) {
      setToken(accessToken);
      // Set the session with the token
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: '',
      });
    }
    // Don't set error here - we'll allow manual token entry
  }, [location]);

  // Form schema for manual token entry
  const tokenFormSchema = z.object({
    token: z.string().min(6, { message: 'Please enter a valid token' }),
  });

  // Initialize token form
  const tokenForm = useForm<z.infer<typeof tokenFormSchema>>({
    resolver: zodResolver(tokenFormSchema),
    defaultValues: {
      token: '',
    },
  });

  // Handle manual token submission
  const onTokenSubmit = async (values: z.infer<typeof tokenFormSchema>) => {
    setIsLoading(true);
    try {
      // Set the token
      setToken(values.token);
      // Set the session with the token
      await supabase.auth.setSession({
        access_token: values.token,
        refresh_token: '',
      });
      // Clear any token errors
      setTokenError(null);
    } catch (error) {
      setTokenError('Invalid token. Please try again or request a new password reset link.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle password form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!token) {
      setTokenError('Please enter the reset token sent to your email.');
      return;
    }

    setIsLoading(true);

    try {
      // Update the user's password using the token
      const { error } = await supabase.auth.updateUser({
        password: values.password,
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Failed to reset password",
          description: error.message,
        });
      } else {
        // Password reset successful
        setIsSuccess(true);

        // Send confirmation email
        try {
          // This is a custom function call to your backend or Supabase Edge Function
          // that would send a confirmation email
          await fetch('/api/send-password-changed-notification', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              // You can get the user's email from the session if needed
              // This is just a placeholder
            }),
          });
        } catch (emailError) {
          console.error('Failed to send confirmation email:', emailError);
          // Don't show error to user as the password reset was successful
        }

        // Sign out the user to ensure they're not automatically logged in
        await supabase.auth.signOut();

        // Redirect to login page after 3 seconds
        setTimeout(() => {
          navigate('/login', {
            state: {
              message: 'Your password has been reset successfully. You can now log in with your new password.'
            }
          });
        }, 3000);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "An error occurred",
        description: "Please try again later or request a new password reset link.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md px-4 sm:px-8 py-8 sm:py-12">
      {/* Logo and title */}
      <div className="text-center mb-8">
        <div className="inline-block bg-gradient-to-r from-promptiverse-purple to-promptiverse-teal rounded-xl p-3 mb-6">
          <BookOpen className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Reset Your Password</h1>
        <p className="text-muted-foreground mt-3">
          Create a new password for your Promptiverse account
        </p>
      </div>

      <div className="bg-card p-8 rounded-xl shadow-lg border border-border/40">
        {isSuccess ? (
          // Success message
          <div className="text-center py-6">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Password Reset Successful</h2>
            <p className="text-muted-foreground mb-6">
              Your password has been reset successfully. You will be redirected to the login page shortly.
            </p>
            <Button
              onClick={async () => {
                // Sign out the user before redirecting
                await supabase.auth.signOut();
                navigate('/login');
              }}
              className="w-full"
            >
              Go to Login
            </Button>
          </div>
        ) : !token ? (
          // Manual token entry form
          <div className="py-6">
            <h2 className="text-xl font-semibold mb-4 text-center">Enter Reset Token</h2>
            <p className="text-muted-foreground mb-6 text-center">
              Please enter the reset token that was sent to your email.
            </p>

            <Form {...tokenForm}>
              <form onSubmit={tokenForm.handleSubmit(onTokenSubmit)} className="space-y-6">
                <FormField
                  control={tokenForm.control}
                  name="token"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Reset Token</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter the token from your email"
                          className="h-11 font-mono tracking-wider"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                      {tokenError && (
                        <p className="text-sm text-destructive mt-2">{tokenError}</p>
                      )}
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full h-11"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Continue'
                  )}
                </Button>

                <div className="text-center">
                  <Button
                    variant="link"
                    type="button"
                    onClick={async () => {
                      // Sign out the user before redirecting
                      await supabase.auth.signOut();
                      navigate('/login');
                    }}
                    className="text-sm"
                  >
                    Back to Login
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        ) : (
          // Password reset form
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">New Password</FormLabel>
                    <FormControl>
                      <PasswordInput
                        placeholder="Enter your new password"
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
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Confirm Password</FormLabel>
                    <FormControl>
                      <PasswordInput
                        placeholder="Confirm your new password"
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
                className="w-full h-11"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetting Password...
                  </>
                ) : (
                  'Reset Password'
                )}
              </Button>
            </form>
          </Form>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;
