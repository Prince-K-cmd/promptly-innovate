
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const HomePageSimple = () => {
  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <h1 className="text-4xl font-bold mb-6">Welcome to Promptiverse</h1>
      <p className="text-lg mb-4">Your ultimate library for creating, storing, and discovering powerful prompts.</p>
      
      <Card className="my-8">
        <CardContent className="p-6">
          <h2 className="text-2xl font-semibold mb-4">Getting Started</h2>
          <p className="mb-4">
            Create, manage, and discover prompts for various AI models. 
            Save your favorites and build your personal prompt library.
          </p>
          
          <div className="flex gap-4 mt-4">
            <Button asChild>
              <Link to="/library">Browse Library</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/create">Create Prompt</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold mb-2">Browse Library</h3>
            <p>Access your collection of prompts and organize them by categories.</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold mb-2">Create Prompts</h3>
            <p>Create custom prompts with our interactive builder or from scratch.</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold mb-2">Community Prompts</h3>
            <p>Discover and use prompts shared by the community.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HomePageSimple;
