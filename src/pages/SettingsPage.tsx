
import React from 'react';
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
  email: z
    .string()
    .email({ message: "Please enter a valid email address." }),
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
      email: user?.email || '',
    },
  });

  const displayForm = useForm<DisplayFormValues>({
    resolver: zodResolver(displayFormSchema),
    defaultValues: {
      theme: "system",
      fontSize: "md",
    },
  });

  function onNotificationSubmit(data: NotificationFormValues) {
    toast({
      title: "Notification settings updated",
      description: "Your notification preferences have been saved.",
    });
  }

  function onAccountSubmit(data: AccountFormValues) {
    toast({
      title: "Account settings updated",
      description: "Your account information has been updated.",
    });
  }

  function onDisplaySubmit(data: DisplayFormValues) {
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
    <div className="container py-10">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences.
          </p>
        </div>
        <Separator />
        <Tabs defaultValue="account" className="w-full">
          <TabsList className="grid w-full md:w-auto grid-cols-3">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="display">Display</TabsTrigger>
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
                    <FormField
                      control={accountForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="Your email" {...field} disabled />
                          </FormControl>
                          <FormDescription>
                            This is your email address. Changes to email require verification.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit">Save Changes</Button>
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
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <FormLabel>Theme</FormLabel>
                        <div className="grid grid-cols-3 gap-2">
                          <Button
                            variant={displayForm.watch("theme") === "light" ? "default" : "outline"}
                            onClick={() => displayForm.setValue("theme", "light")}
                            type="button"
                          >
                            Light
                          </Button>
                          <Button
                            variant={displayForm.watch("theme") === "dark" ? "default" : "outline"}
                            onClick={() => displayForm.setValue("theme", "dark")}
                            type="button"
                          >
                            Dark
                          </Button>
                          <Button
                            variant={displayForm.watch("theme") === "system" ? "default" : "outline"}
                            onClick={() => displayForm.setValue("theme", "system")}
                            type="button"
                          >
                            System
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <FormLabel>Font Size</FormLabel>
                        <div className="grid grid-cols-4 gap-2">
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
