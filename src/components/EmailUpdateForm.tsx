
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { LockIcon, MailIcon, EyeIcon, EyeOffIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const emailUpdateSchema = z.object({
  newEmail: z.string().email("Please enter a valid email address"),
  currentPassword: z.string().min(6, "Current password is required"),
});

type EmailUpdateFormValues = z.infer<typeof emailUpdateSchema>;

const EmailUpdateForm = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<EmailUpdateFormValues>({
    resolver: zodResolver(emailUpdateSchema),
    defaultValues: {
      newEmail: user?.email || '',
      currentPassword: '',
    },
  });

  const onSubmit = async (data: EmailUpdateFormValues) => {
    setIsLoading(true);
    try {
      // First, verify the current password by trying to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: data.currentPassword,
      });

      if (signInError) {
        toast({
          title: "Current password is incorrect",
          description: "Please enter your current password correctly",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // If current password is correct, update the email
      const { error: updateError } = await supabase.auth.updateUser({
        email: data.newEmail,
      });

      if (updateError) {
        toast({
          title: "Update failed",
          description: updateError.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Email update initiated",
          description: "A confirmation email has been sent to your new email address. Please check your inbox.",
        });
        form.reset({
          newEmail: data.newEmail,
          currentPassword: '',
        });
      }
    } catch (error: any) {
      toast({
        title: "An error occurred",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="newEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  <MailIcon className="h-4 w-4" />
                </div>
                <FormControl>
                  <Input className="pl-10" placeholder="Enter your new email" {...field} />
                </FormControl>
                <FormDescription>
                  A confirmation email will be sent to verify this address.
                </FormDescription>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="currentPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current Password</FormLabel>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  <LockIcon className="h-4 w-4" />
                </div>
                <FormControl>
                  <div className="relative">
                    <Input 
                      type={showPassword ? "text" : "password"} 
                      className="pl-10" 
                      placeholder="Enter your current password" 
                      {...field} 
                    />
                    <button 
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOffIcon className="h-4 w-4" />
                      ) : (
                        <EyeIcon className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
          {isLoading ? "Updating..." : "Update Email"}
        </Button>
      </form>
    </Form>
  );
};

export default EmailUpdateForm;
