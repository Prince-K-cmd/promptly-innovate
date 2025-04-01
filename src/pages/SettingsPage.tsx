
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import APIKeysManager from '@/components/APIKeysManager';
import PasswordUpdateForm from '@/components/PasswordUpdateForm';
import EmailUpdateForm from '@/components/EmailUpdateForm';
import { BellRing, Key, Palette, Sun, Moon, Monitor, UserIcon, Lock, Mail } from 'lucide-react';
import { useProfile } from '@/hooks/use-profile';

const notificationFormSchema = z.object({
  emailNotifications: z.boolean().default(true),
  promosAndOffers: z.boolean().default(false),
  activitySummary: z.boolean().default(true),
});

const accountFormSchema = z.object({
  username: z
    .string()
    .min(2, {
      message: "Username must be at least 2 characters.",
    })
    .max(30, {
      message: "Username must not be longer than 30 characters.",
    }),
});

const displayFormSchema = z.object({
  theme: z.enum(["light", "dark", "system"]).default("system"),
  fontSize: z.enum(["sm", "md", "lg", "xl"]).default("md"),
});

type NotificationFormValues = z.infer<typeof notificationFormSchema>;
type AccountFormValues = z.infer<typeof accountFormSchema>;
type DisplayFormValues = z.infer<typeof displayFormSchema>;

const SettingsPage = () => {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const { theme, setTheme } = useTheme();
  const { updateProfile, loading: profileLoading } = useProfile();

  // Font size state from localStorage
  const storedFontSize = localStorage.getItem('promptiverse-font-size') || 'md';

  const notificationForm = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationFormSchema),
    defaultValues: {
      emailNotifications: true,
      promosAndOffers: false,
      activitySummary: true,
    },
  });

  const accountForm = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      username: profile?.username || '',
    },
  });

  const displayForm = useForm<DisplayFormValues>({
    resolver: zodResolver(displayFormSchema),
    defaultValues: {
      theme: theme as "light" | "dark" | "system",
      fontSize: storedFontSize as "sm" | "md" | "lg" | "xl",
    },
  });

  // Extract the font size value for dependency tracking
  const currentFontSize = displayForm.watch("fontSize");

  // Apply the font size class to the html element
  useEffect(() => {
    const htmlElement = document.documentElement;

    // Remove existing font size classes
    htmlElement.classList.remove('text-sm', 'text-base', 'text-lg', 'text-xl');

    // Add the selected font size class
    switch (currentFontSize) {
      case "sm":
        htmlElement.classList.add('text-sm');
        break;
      case "md":
        htmlElement.classList.add('text-base');
        break;
      case "lg":
        htmlElement.classList.add('text-lg');
        break;
      case "xl":
        htmlElement.classList.add('text-xl');
        break;
    }
  }, [currentFontSize]);

  function onNotificationSubmit(data: NotificationFormValues) {
    toast({
      title: "Notification settings updated",
      description: "Your notification preferences have been saved.",
    });
  }

  async function onAccountSubmit(data: AccountFormValues) {
    try {
      await updateProfile({ username: data.username });
      toast({
        title: "Account settings updated",
        description: "Your account information has been updated.",
      });
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Failed to update account",
        description: error instanceof Error ? error.message : "An error occurred",
      });
    }
  }

  function onDisplaySubmit(data: DisplayFormValues) {
    const { theme, fontSize } = data;
    setTheme(theme);

    // Save font size to localStorage
    localStorage.setItem('promptiverse-font-size', fontSize);

    toast({
      title: "Display settings updated",
      description: "Your display preferences have been saved.",
    });
  }

  if (!user) {
    return (
      <div className="container py-10">
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
            <CardDescription>You need to be logged in to access settings.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild>
              <a href="/login">Log in</a>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-6 md:py-10 px-4 md:px-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences.
          </p>
        </div>
        <Separator />
        <Tabs defaultValue="account" className="w-full">
          <TabsList className="grid w-full md:grid-cols-6 grid-cols-3 gap-2">
            <TabsTrigger value="account" className="flex items-center gap-2">
              <UserIcon className="h-4 w-4" />
              <span className="hidden md:inline">Account</span>
            </TabsTrigger>
            <TabsTrigger value="password" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              <span className="hidden md:inline">Password</span>
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span className="hidden md:inline">Email</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <BellRing className="h-4 w-4" />
              <span className="hidden md:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="api-keys" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              <span className="hidden md:inline">API Keys</span>
            </TabsTrigger>
            <TabsTrigger value="display" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              <span className="hidden md:inline">Display</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="account" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>
                  Update your account information.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...accountForm}>
                  <form onSubmit={accountForm.handleSubmit(onAccountSubmit)} className="space-y-4">
                    <FormField
                      control={accountForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Your username" {...field} />
                          </FormControl>
                          <FormDescription>
                            This is your public display name.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button type="submit" disabled={profileLoading}>
                        {profileLoading ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Delete Account</CardTitle>
                <CardDescription>
                  Permanently delete your account and all your data.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Once your account is deleted, all of your data will be permanently removed and cannot be recovered.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="destructive">Delete Account</Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="password" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Update Password</CardTitle>
                <CardDescription>
                  Change your password to keep your account secure.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PasswordUpdateForm />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Update Email Address</CardTitle>
                <CardDescription>
                  Change the email address associated with your account.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EmailUpdateForm />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>
                  Configure how and when you receive notifications.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...notificationForm}>
                  <form onSubmit={notificationForm.handleSubmit(onNotificationSubmit)} className="space-y-4">
                    <FormField
                      control={notificationForm.control}
                      name="emailNotifications"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Email Notifications</FormLabel>
                            <FormDescription>
                              Receive notifications via email.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={notificationForm.control}
                      name="promosAndOffers"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Promotions & Offers</FormLabel>
                            <FormDescription>
                              Receive updates about new features and special offers.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={notificationForm.control}
                      name="activitySummary"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Activity Summary</FormLabel>
                            <FormDescription>
                              Receive weekly summary of your activity.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <Button type="submit">Save Preferences</Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api-keys" className="space-y-6">
            <APIKeysManager />
          </TabsContent>

          <TabsContent value="display" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Display Settings</CardTitle>
                <CardDescription>
                  Customize how Promptiverse looks and feels.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...displayForm}>
                  <form onSubmit={displayForm.handleSubmit(onDisplaySubmit)} className="space-y-4">
                    <div className="grid gap-6">
                      <div className="space-y-2">
                        <FormLabel>Theme</FormLabel>
                        <div className="grid grid-cols-3 gap-3">
                          <Button
                            variant={theme === "light" ? "default" : "outline"}
                            onClick={() => {
                              displayForm.setValue("theme", "light");
                              setTheme("light");
                            }}
                            type="button"
                            className="flex flex-col items-center justify-center gap-2 p-4 h-auto"
                          >
                            <Sun className="h-5 w-5" />
                            <span>Light</span>
                          </Button>
                          <Button
                            variant={theme === "dark" ? "default" : "outline"}
                            onClick={() => {
                              displayForm.setValue("theme", "dark");
                              setTheme("dark");
                            }}
                            type="button"
                            className="flex flex-col items-center justify-center gap-2 p-4 h-auto"
                          >
                            <Moon className="h-5 w-5" />
                            <span>Dark</span>
                          </Button>
                          <Button
                            variant={theme === "system" ? "default" : "outline"}
                            onClick={() => {
                              displayForm.setValue("theme", "system");
                              setTheme("system");
                            }}
                            type="button"
                            className="flex flex-col items-center justify-center gap-2 p-4 h-auto"
                          >
                            <Monitor className="h-5 w-5" />
                            <span>System</span>
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <FormLabel>Font Size</FormLabel>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          <Button
                            variant={displayForm.watch("fontSize") === "sm" ? "default" : "outline"}
                            onClick={() => displayForm.setValue("fontSize", "sm")}
                            type="button"
                          >
                            Small
                          </Button>
                          <Button
                            variant={displayForm.watch("fontSize") === "md" ? "default" : "outline"}
                            onClick={() => displayForm.setValue("fontSize", "md")}
                            type="button"
                          >
                            Medium
                          </Button>
                          <Button
                            variant={displayForm.watch("fontSize") === "lg" ? "default" : "outline"}
                            onClick={() => displayForm.setValue("fontSize", "lg")}
                            type="button"
                          >
                            Large
                          </Button>
                          <Button
                            variant={displayForm.watch("fontSize") === "xl" ? "default" : "outline"}
                            onClick={() => displayForm.setValue("fontSize", "xl")}
                            type="button"
                          >
                            Extra Large
                          </Button>
                        </div>
                      </div>
                    </div>
                    <Button type="submit" className="mt-4">Save Settings</Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SettingsPage;
