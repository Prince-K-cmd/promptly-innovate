
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { usePrompts } from '@/hooks/use-prompts';
import { useAuth } from '@/contexts/AuthContext';
import PromptCard from '@/components/PromptCard';
import { BookOpen, PlusCircle, Zap } from 'lucide-react';

const HomePage = () => {
  const { isAuthenticated } = useAuth();
  const { prompts, loading } = usePrompts();
  const [spotlightPrompt, setSpotlightPrompt] = useState<any>(null);
  
  // Select a random spotlight prompt when prompts load
  useEffect(() => {
    if (prompts.length > 0) {
      const publicPrompts = prompts.filter(p => p.is_public);
      if (publicPrompts.length > 0) {
        const randomIndex = Math.floor(Math.random() * publicPrompts.length);
        setSpotlightPrompt(publicPrompts[randomIndex]);
      }
    }
  }, [prompts]);
  
  // Get the recent prompts (max 6)
  const recentPrompts = prompts.slice(0, 6);
  
  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Hero Section */}
      <section className="mb-16 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 animate-slide-up">
            Welcome to <span className="gradient-text">Promptiverse</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
            Your ultimate library for creating, storing, and discovering powerful prompts
          </p>
          <div className="flex flex-wrap justify-center gap-4 animate-slide-up" style={{ animationDelay: '200ms' }}>
            <Button size="lg" asChild>
              <Link to="/create">
                <PlusCircle className="mr-2 h-5 w-5" />
                Create a Prompt
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/library">
                <BookOpen className="mr-2 h-5 w-5" />
                Browse Library
              </Link>
            </Button>
          </div>
        </div>
      </section>
      
      {/* Featured Prompt "Spotlight" */}
      {spotlightPrompt && (
        <section className="mb-16 animate-slide-up" style={{ animationDelay: '300ms' }}>
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center mb-6">
              <Zap className="h-6 w-6 mr-2 text-yellow-500" />
              <h2 className="text-2xl font-bold">Prompt Spotlight</h2>
            </div>
            <div className="bg-gradient-to-r from-promptiverse-purple/10 to-promptiverse-teal/10 p-1 rounded-xl">
              <PromptCard prompt={spotlightPrompt} className="border-0 shadow-md" />
            </div>
          </div>
        </section>
      )}
      
      {/* Recent Prompts Section */}
      <section className="mb-16 animate-slide-up" style={{ animationDelay: '400ms' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Recent Prompts</h2>
          <Button variant="ghost" asChild>
            <Link to="/library">View All</Link>
          </Button>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, index) => (
              <div 
                key={index} 
                className="h-64 rounded-lg bg-muted animate-pulse"
              />
            ))}
          </div>
        ) : recentPrompts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentPrompts.map(prompt => (
              <PromptCard key={prompt.id} prompt={prompt} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-muted/30 rounded-lg">
            <h3 className="text-xl font-semibold mb-2">No prompts found</h3>
            <p className="text-muted-foreground mb-6">
              {isAuthenticated
                ? "Create your first prompt to get started!"
                : "Sign in to create and save your prompts, or create one now for local storage."}
            </p>
            <Button asChild>
              <Link to="/create">
                <PlusCircle className="mr-2 h-5 w-5" />
                Create a Prompt
              </Link>
            </Button>
          </div>
        )}
      </section>
      
      {/* Feature Highlights */}
      <section className="mb-16 animate-slide-up" style={{ animationDelay: '500ms' }}>
        <h2 className="text-2xl font-bold mb-8 text-center">Feature Highlights</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-card p-6 rounded-lg shadow-sm text-center">
            <div className="bg-primary/10 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-bold text-lg mb-2">Prompt Library</h3>
            <p className="text-muted-foreground">
              Create, organize, and discover powerful prompts for any purpose.
            </p>
          </div>
          
          <div className="bg-card p-6 rounded-lg shadow-sm text-center">
            <div className="bg-secondary/10 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-secondary">
                <path d="M20 7h-3a2 2 0 0 1-2-2V2"></path>
                <path d="M16 2H8a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7"></path>
                <path d="M12 18v-6"></path>
                <path d="M9 15l3 3 3-3"></path>
              </svg>
            </div>
            <h3 className="font-bold text-lg mb-2">Sync Anywhere</h3>
            <p className="text-muted-foreground">
              Save prompts locally and sync them to your account when you log in.
            </p>
          </div>
          
          <div className="bg-card p-6 rounded-lg shadow-sm text-center">
            <div className="bg-accent/20 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Zap className="h-8 w-8 text-yellow-500" />
            </div>
            <h3 className="font-bold text-lg mb-2">Prompt Spotlight</h3>
            <p className="text-muted-foreground">
              Get inspired with our daily featured prompt picks to spark creativity.
            </p>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      {!isAuthenticated && (
        <section className="mb-8 animate-slide-up bg-gradient-to-r from-promptiverse-purple/20 to-promptiverse-teal/20 p-8 rounded-xl text-center" style={{ animationDelay: '600ms' }}>
          <h2 className="text-2xl font-bold mb-4">Ready to save your prompts?</h2>
          <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
            Create an account to save your prompts, access them from anywhere, and discover prompts shared by others.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" asChild>
              <Link to="/signup">Create an Account</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
          </div>
        </section>
      )}
    </div>
  );
};

export default HomePage;
