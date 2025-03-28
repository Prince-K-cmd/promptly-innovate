
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

interface LoginPromptProps {
  message?: string;
  onClose?: () => void;
}

const LoginPrompt: React.FC<LoginPromptProps> = ({ 
  message = "You need to be logged in to access this feature",
  onClose
}) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const handleLogin = () => {
    navigate('/login');
  };
  
  const handleSignup = () => {
    navigate('/signup');
  };
  
  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      navigate('/');
    }
  };
  
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="flex justify-center items-center min-h-[50vh] px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="gradient-text">Login Required</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            When you log in, you'll be able to:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>Create and save custom prompts</li>
            <li>Get personalized AI suggestions</li>
            <li>Build a library of your favorite prompts</li>
            <li>Access advanced features like the Prompt Builder</li>
          </ul>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-2">
          <Button onClick={handleLogin} className="w-full sm:w-auto">
            Log In
          </Button>
          <Button onClick={handleSignup} variant="outline" className="w-full sm:w-auto">
            Sign Up
          </Button>
          <Button onClick={handleClose} variant="ghost" className="w-full sm:w-auto">
            Back to Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default LoginPrompt;
