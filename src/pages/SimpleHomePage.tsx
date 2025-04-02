import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const SimpleHomePage = () => {
  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <h1 className="text-4xl font-bold mb-6">Home Page</h1>
      <p className="text-lg mb-4">This is a test to see if content renders correctly.</p>
      
      <div className="flex gap-4 mt-8">
        <Button asChild>
          <Link to="/library">Go to Library</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/create">Create Prompt</Link>
        </Button>
      </div>
    </div>
  );
};

export default SimpleHomePage;
