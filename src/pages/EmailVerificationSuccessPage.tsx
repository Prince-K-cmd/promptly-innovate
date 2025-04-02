import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BookOpen, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const EmailVerificationSuccessPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const processVerification = async () => {
      try {
        setIsLoading(true);
        
        // Extract token from URL
        const hashParams = new URLSearchParams(location.hash.substring(1));
        const queryParams = new URLSearchParams(location.search);
        
        // Check for token in different possible locations
        const token = 
          hashParams.get('access_token') || 
          queryParams.get('token') || 
          queryParams.get('confirmation_token');
        
        if (!token) {
          setError('No verification token found. The link may be invalid or expired.');
          setIsLoading(false);
          return;
        }
        
        // Get user email from the token if possible
        try {
          const { data } = await supabase.auth.getUser(token);
          if (data?.user?.email) {
            setEmail(data.user.email);
          }
        } catch (e) {
          console.error('Error getting user from token:', e);
          // Continue even if we can't get the email
        }
        
        // Sign out to ensure the user isn't automatically logged in
        await supabase.auth.signOut();
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error processing verification:', err);
        setError('An error occurred while verifying your email. Please try again.');
        setIsLoading(false);
      }
    };
    
    processVerification();
  }, [location]);

  return (
    <div className="w-full max-w-md px-4 sm:px-8 py-8 sm:py-12">
      {/* Logo and title */}
      <div className="text-center mb-8">
        <div className="inline-block bg-gradient-to-r from-promptiverse-purple to-promptiverse-teal rounded-xl p-3 mb-6">
          <BookOpen className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Email Verification</h1>
      </div>

      <div className="bg-card p-8 rounded-xl shadow-lg border border-border/40">
        {isLoading ? (
          <div className="text-center py-6">
            <Loader2 className="h-16 w-16 text-primary mx-auto mb-4 animate-spin" />
            <h2 className="text-2xl font-semibold mb-2">Verifying Your Email</h2>
            <p className="text-muted-foreground mb-6">
              Please wait while we verify your email address...
            </p>
          </div>
        ) : error ? (
          <div className="text-center py-6">
            <div className="text-destructive mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">Verification Failed</h2>
            <p className="text-muted-foreground mb-6">
              {error}
            </p>
            <Button 
              onClick={() => navigate('/login')} 
              className="w-full"
            >
              Back to Login
            </Button>
          </div>
        ) : (
          <div className="text-center py-6">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Email Verified Successfully</h2>
            <p className="text-muted-foreground mb-6">
              {email ? (
                <>Your email address <span className="font-medium">{email}</span> has been verified successfully.</>
              ) : (
                <>Your email address has been verified successfully.</>
              )}
              <br /><br />
              You can now sign in to your account.
            </p>
            <Button 
              onClick={() => navigate('/login')} 
              className="w-full"
            >
              Sign In
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailVerificationSuccessPage;
