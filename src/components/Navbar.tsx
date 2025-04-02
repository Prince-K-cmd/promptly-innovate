
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { Search, Menu, LogIn, User, BookOpen, LogOut, Settings, Wand2 } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

const Navbar = () => {
  const location = useLocation();
  const auth = useAuth(); // Hook called unconditionally at the top

  // Explicitly define variables with defaults if auth context is not available
  const isAuthenticated = auth?.isAuthenticated ?? false;
  const profile = auth?.profile ?? null;
  const signOut = auth?.signOut ?? (() => { console.error("SignOut function not available"); return Promise.resolve(); });

  // Refresh profile data only once when the component mounts
  React.useEffect(() => {
    if (isAuthenticated && auth.refreshProfile) {
      // Pass false to avoid forcing a refresh if it was recently refreshed
      auth.refreshProfile(false);
    }
  }, [isAuthenticated]); // Only depend on isAuthenticated, not auth

  // Get user initials for avatar fallback
  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase();
    }
    if (profile?.username) {
      return profile.username.substring(0, 2).toUpperCase();
    }
    return 'PV';
  };

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Library', href: '/library' },
    { name: 'Create', href: '/create' },
    {
      name: "Prompt Builder",
      href: "/builder",
      icon: <Wand2 className="h-4 w-4" />,
      requiresAuth: true,
    },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <div className="bg-gradient-to-r from-promptiverse-purple to-promptiverse-teal rounded-xl p-1.5">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-xl">Promptiverse</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                location.pathname === link.href
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Right Side - Auth & Profile */}
        <div className="flex items-center space-x-4">
          <Link to="/search" className="hidden md:flex text-muted-foreground hover:text-foreground transition-colors">
            <Search className="h-5 w-5" />
          </Link>

          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="h-8 w-8 cursor-pointer button-hover">
                  <AvatarImage src={profile?.avatar_url} alt={profile?.username || "User"} />
                  <AvatarFallback>{getInitials()}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    {profile?.full_name && <p className="font-medium">{profile.full_name}</p>}
                    {profile?.username && <p className="text-sm text-muted-foreground">{profile.username}</p>}
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="cursor-pointer flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="cursor-pointer flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer text-red-600 focus:text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="default" size="sm" asChild>
              <Link to="/login" className="flex items-center">
                <LogIn className="mr-2 h-4 w-4" />
                Sign In
              </Link>
            </Button>
          )}

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <nav className="flex flex-col gap-4 mt-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.href}
                    className={cn(
                      "text-base font-medium transition-colors hover:text-primary p-2 rounded-md",
                      location.pathname === link.href
                        ? "bg-secondary text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    {link.name}
                  </Link>
                ))}
                <Link
                  to="/search"
                  className="text-base font-medium transition-colors hover:text-primary p-2 rounded-md text-muted-foreground flex items-center"
                >
                  <Search className="h-5 w-5 mr-2" />
                  Search
                </Link>
                {!isAuthenticated && (
                  <Link
                    to="/login"
                    className="text-base font-medium transition-colors hover:text-primary p-2 rounded-md text-muted-foreground flex items-center"
                  >
                    <LogIn className="h-5 w-5 mr-2" />
                    Sign In
                  </Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
