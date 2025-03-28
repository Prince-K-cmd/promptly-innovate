
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BookOpen, Home } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="container max-w-md mx-auto px-4 py-16 text-center">
      <div className="mb-8">
        <div className="inline-block bg-gradient-to-r from-promptiverse-purple to-promptiverse-teal rounded-xl p-4 mb-6">
          <BookOpen className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-6">Page Not Found</h2>
        <p className="text-muted-foreground mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Button asChild>
          <Link to="/">
            <Home className="mr-2 h-4 w-4" />
            Return Home
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFoundPage;
