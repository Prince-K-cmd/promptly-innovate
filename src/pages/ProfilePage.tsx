
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/use-profile';
import { Camera, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const profileSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(50),
  full_name: z.string().optional(),
  bio: z.string().max(300, 'Bio must be less than 300 characters').optional(),
  website: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { updateProfile, uploadAvatar, loading } = useProfile();
  const { toast } = useToast();
  const [isAvatarLoading, setIsAvatarLoading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  
  // Initialize form with user's current profile data
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: profile?.username || '',
      full_name: profile?.full_name || '',
      bio: profile?.bio || '',
      website: profile?.website || '',
    },
  });
  
  // Redirect if not logged in
  React.useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
    }
  }, [user, navigate]);
  
  // Handle profile form submission
  const onSubmit = async (values: ProfileFormValues) => {
    await updateProfile(values);
  };
  
  // Handle avatar upload
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // File size check (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Please select an image under 5MB",
      });
      return;
    }
    
    // File type check
    if (!file.type.startsWith('image/')) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please select an image file",
      });
      return;
    }
    
    setIsAvatarLoading(true);
    try {
      await uploadAvatar(file);
    } catch (error) {
      console.error('Avatar upload failed:', error);
    } finally {
      setIsAvatarLoading(false);
    }
  };
  
  // Get initials for avatar fallback
  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase();
    }
    if (profile?.username) {
      return profile.username.substring(0, 2).toUpperCase();
    }
    return 'PV';
  };
  
  if (!user || !profile) return null;
  
  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <h1 className="text-3xl font-bold mb-8">Your Profile</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        {/* Avatar Card */}
        <Card className="md:col-span-1 flex flex-col items-center justify-start py-8">
          <div className="relative">
            <Avatar className="h-32 w-32 mb-4">
              <AvatarImage src={profile.avatar_url} alt={profile.username} />
              <AvatarFallback className="text-2xl">{getInitials()}</AvatarFallback>
            </Avatar>
            <Button 
              variant="outline" 
              size="icon" 
              className="absolute bottom-0 right-0 rounded-full h-8 w-8 bg-background"
              onClick={() => avatarInputRef.current?.click()}
              disabled={isAvatarLoading}
            >
              {isAvatarLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </Button>
            <input 
              type="file" 
              ref={avatarInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleAvatarUpload}
            />
          </div>
          
          <div className="text-center mt-4">
            <h3 className="font-semibold text-lg">{profile.full_name || profile.username}</h3>
            {profile.username && <p className="text-muted-foreground">@{profile.username}</p>}
          </div>
        </Card>
        
        {/* Profile Form Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormDescription>
                        This is your public display name
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Tell others a bit about yourself"
                          className="resize-none"
                          rows={4}
                        />
                      </FormControl>
                      <FormDescription>
                        Brief description for your profile
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://yourwebsite.com" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end">
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;
