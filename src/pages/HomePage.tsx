
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { usePrompts } from '@/hooks/use-prompts';
import { useAuth } from '@/contexts/AuthContext';
import PromptCard from '@/components/PromptCard';
import SpotlightPromptCard from '@/components/SpotlightPromptCard';
import { getSpotlightPrompt } from '@/services/spotlight-prompt';
import { Prompt } from '@/lib/supabase';
import { BookOpen, PlusCircle, Zap, Loader2, Globe, User, Search } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import PromptForm from '@/components/PromptForm';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Static IDs for loading placeholders
const LOADING_PLACEHOLDER_IDS = {
  fallback: ['fallback-1', 'fallback-2', 'fallback-3'],
  yours: ['yours-1', 'yours-2', 'yours-3'],
  community: ['community-1', 'community-2', 'community-3']
};

const HomePage = () => {
  // Helper function to render spotlight prompt
  const renderSpotlightPrompt = () => {
    // Common wrapper div
    const wrapperClass = "spotlight-card-wrapper";

    // Loading state
    if (loadingSpotlight) {
      return (
        <div className={wrapperClass}>
          <div className="h-64 rounded-lg bg-card animate-pulse flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
          </div>
        </div>
      );
    }

    // Prompt loaded successfully
    if (spotlightPrompt) {
      return (
        <div className={wrapperClass}>
          <SpotlightPromptCard prompt={spotlightPrompt} className="border-0 shadow-md" />
        </div>
      );
    }

    // Error state
    return (
      <div className={wrapperClass}>
        <div className="h-64 rounded-lg bg-card flex items-center justify-center">
          <p className="text-muted-foreground">Failed to load spotlight prompt</p>
        </div>
      </div>
    );
  };

  // Helper function to render section title
  const renderSectionTitle = () => {
    if (hasUserPrompts) {
      return <h2 className="text-2xl font-bold">Prompt Library</h2>;
    }
    return <h2 className="text-2xl font-bold">Community Prompts</h2>;
  };

  // Helper function to render prompt tabs or community section
  const renderPromptTabs = () => {
    if (hasUserPrompts) {
      return (
        <Tabs value={activeTab} className="mb-6" onValueChange={(value) => setActiveTab(value as 'yours' | 'community')}>
          <TabsList className="mb-4">
            <TabsTrigger value="yours" className="flex items-center">
              <User className="mr-2 h-4 w-4" />
              Your Prompts
            </TabsTrigger>
            <TabsTrigger value="community" className="flex items-center">
              <Globe className="mr-2 h-4 w-4" />
              Community
            </TabsTrigger>
          </TabsList>

          {/* Your Prompts Tab */}
          <TabsContent value="yours" className="mt-0">
            {renderUserPrompts()}
          </TabsContent>

          {/* Community Prompts Tab */}
          <TabsContent value="community" className="mt-0">
            {renderCommunityPromptsTab()}
          </TabsContent>
        </Tabs>
      );
    }

    // When user has no prompts, just show community prompts
    return (
      <div>
        {renderCommunityPrompts()}
      </div>
    );
  };

  // Helper function to render community prompts tab content
  const renderCommunityPromptsTab = () => {
    // Loading state
    if (communityPromptsLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {LOADING_PLACEHOLDER_IDS.community.map((id) => (
            <div
              key={id}
              className="h-64 rounded-lg bg-muted animate-pulse"
            />
          ))}
        </div>
      );
    }

    // Community prompts available
    if (communityPrompts.length > 0) {
      return (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {communityPrompts.slice(0, 4).map(prompt => (
              <PromptCard
                key={prompt.id}
                prompt={prompt}
                onEdit={handleEditPrompt}
                onDelete={handleDeletePrompt}
              />
            ))}
          </div>
          {communityPrompts.length > 4 && (
            <div className="mt-8 flex justify-center">
              <Button asChild variant="outline">
                <Link to="/community">
                  <Search className="mr-2 h-4 w-4" />
                  View All Community Prompts
                </Link>
              </Button>
            </div>
          )}
        </>
      );
    }

    // No community prompts
    return (
      <div className="text-center py-16 bg-muted/30 rounded-lg">
        <h3 className="text-xl font-semibold mb-2">No community prompts found</h3>
        <p className="text-muted-foreground mb-6">Check back later for community contributions</p>
      </div>
    );
  };

  // Helper function to render user prompts section
  const renderUserPrompts = () => {
    // Loading state
    if (userPromptsLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {LOADING_PLACEHOLDER_IDS.yours.map((id) => (
            <div
              key={id}
              className="h-64 rounded-lg bg-muted animate-pulse"
            />
          ))}
        </div>
      );
    }

    // User has prompts
    if (userPrompts.length > 0) {
      return (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userPrompts.slice(0, 4).map(prompt => (
              <PromptCard
                key={prompt.id}
                prompt={prompt}
                onEdit={handleEditPrompt}
                onDelete={handleDeletePrompt}
              />
            ))}
          </div>
          {userPrompts.length > 4 && (
            <div className="mt-8 flex justify-center">
              <Button asChild variant="outline">
                <Link to="/library">
                  <Search className="mr-2 h-4 w-4" />
                  View All Your Prompts
                </Link>
              </Button>
            </div>
          )}
        </>
      );
    }

    // No prompts yet
    return (
      <div className="text-center py-16 bg-muted/30 rounded-lg">
        <h3 className="text-xl font-semibold mb-2">No personal prompts yet</h3>
        <p className="text-muted-foreground mb-6">Create your first prompt to get started!</p>
        <Button asChild>
          <Link to="/create">
            <PlusCircle className="mr-2 h-5 w-5" />
            Create a Prompt
          </Link>
        </Button>
      </div>
    );
  };

  // Helper function to render community prompts section
  const renderCommunityPrompts = () => {
    // Loading state
    if (communityPromptsLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {LOADING_PLACEHOLDER_IDS.fallback.map((id) => (
            <div
              key={id}
              className="h-64 rounded-lg bg-muted animate-pulse"
            />
          ))}
        </div>
      );
    }

    // Prompts available
    if (communityPrompts.length > 0) {
      return (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {communityPrompts.slice(0, 4).map(prompt => (
              <PromptCard
                key={prompt.id}
                prompt={prompt}
                onEdit={handleEditPrompt}
                onDelete={handleDeletePrompt}
              />
            ))}
          </div>
          {communityPrompts.length > 4 && (
            <div className="mt-8 flex justify-center">
              <Button asChild variant="outline">
                <Link to="/community">
                  <Search className="mr-2 h-4 w-4" />
                  View All Community Prompts
                </Link>
              </Button>
            </div>
          )}
        </>
      );
    }

    // No prompts
    return (
      <div className="text-center py-16 bg-muted/30 rounded-lg">
        <h3 className="text-xl font-semibold mb-2">No community prompts found</h3>
        <p className="text-muted-foreground mb-6">
          {isAuthenticated
            ? "Be the first to create and share a prompt!"
            : "Sign in to create and share prompts with the community."}
        </p>
        <Button asChild>
          <Link to={isAuthenticated ? "/create" : "/login"}>
            {isAuthenticated ? (
              <>
                <PlusCircle className="mr-2 h-5 w-5" />
                Create a Prompt
              </>
            ) : (
              <>Sign In</>
            )}
          </Link>
        </Button>
      </div>
    );
  };

  const { isAuthenticated } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);

  // Get user's own prompts (created by them)
  const { prompts: userPrompts, loading: userPromptsLoading, deletePrompt, updatePrompt } = usePrompts({
    filterType: 'user',
    page: 1,
    pageSize: 4 // Show only 4 most recent prompts
  });

  // Get community prompts (public prompts from other users)
  const { prompts: communityPrompts, loading: communityPromptsLoading } = usePrompts({
    filterType: 'community',
    page: 1,
    pageSize: 4 // Show only 4 most recent community prompts
  });
  const [spotlightPrompt, setSpotlightPrompt] = useState<Prompt | null>(null);
  const [loadingSpotlight, setLoadingSpotlight] = useState(true);
  const [activeTab, setActiveTab] = useState<'yours' | 'community'>('yours');

  // Load the AI-generated spotlight prompt
  useEffect(() => {
    async function loadSpotlightPrompt() {
      setLoadingSpotlight(true);
      try {
        const prompt = await getSpotlightPrompt();
        setSpotlightPrompt(prompt);
      } catch (error) {
        console.error('Error loading spotlight prompt:', error);
      } finally {
        setLoadingSpotlight(false);
      }
    }

    loadSpotlightPrompt();
  }, []);

  // No need to reset page anymore since we're showing fixed number of items

  // Check if user has created any prompts
  const hasUserPrompts = !userPromptsLoading && userPrompts.length > 0;

  // Set default tab based on whether user has prompts
  useEffect(() => {
    // If user has no prompts, default to community tab
    if (!userPromptsLoading && userPrompts.length === 0) {
      setActiveTab('community');
    } else if (!userPromptsLoading && userPrompts.length > 0 && activeTab === 'community') {
      // If user has prompts and the active tab is community, keep it as community
      // This prevents the tab from switching back to 'yours' when prompts are loaded
    } else if (!userPromptsLoading && userPrompts.length > 0 && activeTab !== 'community') {
      // If user has prompts and the active tab is not community, set it to 'yours'
      setActiveTab('yours');
    }
  }, [userPrompts, userPromptsLoading, activeTab]);

  // Handle edit prompt
  const handleEditPrompt = useCallback((prompt: Prompt) => {
    setEditingPrompt(prompt);
    setIsDialogOpen(true);
  }, []);

  // Handle delete prompt
  const handleDeletePrompt = useCallback(async (id: string) => {
    await deletePrompt(id);
  }, [deletePrompt]);

  // Handle update prompt
  const handleUpdatePrompt = useCallback(async (values: Omit<Prompt, 'id' | 'created_at' | 'user_id' | 'updated_at'>) => {
    if (editingPrompt) {
      await updatePrompt(editingPrompt.id, values);
      setIsDialogOpen(false);
      setEditingPrompt(null);
    }
  }, [editingPrompt, updatePrompt]);

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Hero Section */}
      <section className="mb-16 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 animate-slide-up">
            Welcome to <span className="gradient-text">Promptiverse</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 animate-slide-up delay-100">
            Your ultimate library for creating, storing, and discovering powerful prompts
          </p>
          <div className="flex flex-wrap justify-center gap-4 animate-slide-up delay-200">
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
      <section className="mb-16 animate-slide-up delay-300">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-6">
            <Zap className="h-6 w-6 mr-2 text-yellow-500" />
            <h2 className="text-2xl font-bold">Prompt Spotlight</h2>
            <span className="text-xs text-muted-foreground ml-2">(Auto-refreshes every 4 hours)</span>
          </div>

          {renderSpotlightPrompt()}
        </div>
      </section>

      {/* Prompts Section with Tabs */}
      <section className="mb-16 animate-slide-up delay-400">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            {renderSectionTitle()}
            {isAuthenticated && !hasUserPrompts && (
              <span className="ml-3 text-sm text-muted-foreground">
                Create your first prompt to start building your personal library
              </span>
            )}
          </div>
          <Button variant="ghost" asChild>
            <Link to="/library">View All</Link>
          </Button>
        </div>

        {/* Tabs for different prompt views */}
        {renderPromptTabs()}
      </section>

      {/* Feature Highlights */}
      <section className="mb-16 animate-slide-up delay-500">
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
        <section className="mb-8 animate-slide-up delay-600 gradient-bg-medium p-8 rounded-xl text-center">
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
      {/* Edit Prompt Dialog */}
      {editingPrompt && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Edit Prompt</h2>
            <PromptForm
              onSubmit={handleUpdatePrompt}
              initialValues={editingPrompt}
              isEdit
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default HomePage;
