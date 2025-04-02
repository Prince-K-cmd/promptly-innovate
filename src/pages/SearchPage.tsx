
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import PromptCard from '@/components/PromptCard';
import { usePrompts } from '@/hooks/use-prompts';
import { Search as SearchIcon, Loader2, X } from 'lucide-react';

const SearchPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  const { prompts, loading } = usePrompts({
    searchTerm: debouncedSearchTerm  // Updated to use searchTerm instead of search
  });
  
  // Debounce search term to avoid too many requests
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setIsSearching(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsSearching(true);
    setSearchTerm(e.target.value);
  };
  
  const clearSearch = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
  };
  
  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <h1 className="text-3xl font-bold mb-8 animate-slide-down">Search Prompts</h1>
      
      <div className="max-w-3xl mx-auto mb-12 animate-slide-down" style={{ animationDelay: '100ms' }}>
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search for prompts by title, text, or description..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="pl-12 py-6 text-lg"
          />
          {searchTerm && (
            <button
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={clearSearch}
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Clear search</span>
            </button>
          )}
        </div>
      </div>
      
      {/* Search Results */}
      <div className="animate-slide-up" style={{ animationDelay: '200ms' }}>
        {(loading || isSearching) ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground">Searching prompts...</p>
          </div>
        ) : debouncedSearchTerm ? (
          <>
            <h2 className="text-xl font-semibold mb-6">
              {prompts.length === 0 
                ? 'No results found' 
                : `Found ${prompts.length} result${prompts.length === 1 ? '' : 's'}`}
            </h2>
            {prompts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {prompts.map(prompt => (
                  <PromptCard key={prompt.id} prompt={prompt} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-muted/30 rounded-lg">
                <p className="text-lg mb-4">No prompts found matching "{debouncedSearchTerm}"</p>
                <p className="text-muted-foreground mb-6">
                  Try using different keywords or check your spelling
                </p>
                <Button onClick={clearSearch}>Clear Search</Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <h2 className="text-xl font-semibold mb-2">Start Searching</h2>
            <p className="text-muted-foreground">
              Enter keywords above to find prompts
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
