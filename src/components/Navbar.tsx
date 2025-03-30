
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from "@/contexts/ThemeContext"
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Sun,
  Moon,
  Home,
  Library,
  PenLine,
  User,
  Settings,
  LogOut,
  LogIn,
  BookmarkCheck,
  Search
} from "lucide-react";

const Navbar: React.FC = () => {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
    }
  };

  return (
    <nav className="bg-background border-b sticky top-0 z-50">
      <div className="container flex items-center justify-between py-4">
        <Link to="/" className="font-bold text-2xl">
          Promptiverse
        </Link>

        <div className="hidden md:flex items-center space-x-8">
          <form onSubmit={handleSearch} className="relative w-64">
            <Input
              type="search"
              placeholder="Search prompts..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          </form>
          
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-1 text-foreground hover:text-primary transition-colors">
              <Home className="h-5 w-5" />
              <span>Home</span>
            </Link>
            
            <Link to="/library" className="flex items-center space-x-1 text-foreground hover:text-primary transition-colors">
              <Library className="h-5 w-5" />
              <span>Library</span>
            </Link>
            
            <Link to="/favorites" className="flex items-center space-x-1 text-foreground hover:text-primary transition-colors">
              <BookmarkCheck className="h-5 w-5" />
              <span>Favorites</span>
            </Link>
            
            <Link to="/builder" className="flex items-center space-x-1 text-foreground hover:text-primary transition-colors">
              <PenLine className="h-5 w-5" />
              <span>Builder</span>
            </Link>
          </div>

          <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
            {theme === "dark" ? <Sun className="h-[1.2rem] w-[1.2rem]" /> : <Moon className="h-[1.2rem] w-[1.2rem]" />}
            <span className="sr-only">Toggle theme</span>
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <User className="h-4 w-4" />
                  <span className="sr-only">Open user menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" forceMount>
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/login">
              <Button>
                <LogIn className="mr-2 h-4 w-4" />
                Login
              </Button>
            </Link>
          )}
        </div>

        <Sheet>
          <SheetTrigger className="md:hidden">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
            >
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="18" x2="20" y2="18" />
            </svg>
          </SheetTrigger>
          <SheetContent side="left" className="sm:w-64">
            <SheetHeader className="text-left">
              <SheetTitle>Menu</SheetTitle>
              <SheetDescription>
                Navigate through the app.
              </SheetDescription>
            </SheetHeader>
            
            <form onSubmit={handleSearch} className="relative mt-4 mb-6">
              <Input
                type="search"
                placeholder="Search prompts..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Button type="submit" className="sr-only">Search</Button>
            </form>
            
            <div className="grid gap-4 py-4">
              <Link
                to="/"
                className="flex items-center space-x-2 text-foreground hover:text-primary transition-colors"
              >
                <Home className="h-5 w-5" />
                <span>Home</span>
              </Link>
              
              <Link
                to="/library"
                className="flex items-center space-x-2 text-foreground hover:text-primary transition-colors"
              >
                <Library className="h-5 w-5" />
                <span>Library</span>
              </Link>
              
              <Link
                to="/favorites"
                className="flex items-center space-x-2 text-foreground hover:text-primary transition-colors"
              >
                <BookmarkCheck className="h-5 w-5" />
                <span>Favorites</span>
              </Link>
              
              <Link
                to="/builder"
                className="flex items-center space-x-2 text-foreground hover:text-primary transition-colors"
              >
                <PenLine className="h-5 w-5" />
                <span>Builder</span>
              </Link>

              <Button 
                variant="ghost" 
                size="sm"
                onClick={toggleTheme} 
                className="flex items-center justify-start px-2"
              >
                {theme === "dark" ? (
                  <>
                    <Sun className="h-5 w-5 mr-2" />
                    <span>Light mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="h-5 w-5 mr-2" />
                    <span>Dark mode</span>
                  </>
                )}
              </Button>

              {user ? (
                <>
                  <Button variant="ghost" className="justify-start" onClick={() => navigate('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Button>
                  <Button variant="ghost" className="justify-start" onClick={() => navigate('/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Button>
                  <Button variant="ghost" className="justify-start" onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </Button>
                </>
              ) : (
                <Link to="/login">
                  <Button className="w-full">
                    <LogIn className="mr-2 h-4 w-4" />
                    Login
                  </Button>
                </Link>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
};

export default Navbar;
