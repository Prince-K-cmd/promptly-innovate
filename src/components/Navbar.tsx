
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { Home, BookOpen, Search, Settings, User, LogIn, Menu, X, PlusCircle, Building2, Globe } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, signOut } = useAuth();
  const isMobile = useMobile();
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const links = [
    { path: '/', label: 'Home', icon: <Home className="h-5 w-5" /> },
    { path: '/library', label: 'My Library', icon: <BookOpen className="h-5 w-5" /> },
    { path: '/community', label: 'Community', icon: <Globe className="h-5 w-5" /> },
    { path: '/search', label: 'Search', icon: <Search className="h-5 w-5" /> },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    toast({
      title: "Logged out successfully",
    });
  };

  const closeSheet = () => {
    setIsOpen(false);
  };

  // Mobile navigation
  if (isMobile) {
    return (
      <nav className="w-full h-16 border-b px-6 flex items-center justify-between sticky top-0 z-50 bg-background/80 backdrop-blur-md">
        <div className="flex items-center">
          <Link to="/" className="font-bold text-lg">Promptiverse</Link>
        </div>
        
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex flex-col h-full p-0">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between mb-4">
                <span className="font-bold text-lg">Promptiverse</span>
                <Button variant="ghost" size="icon" onClick={closeSheet}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              {user && profile && (
                <div className="flex items-center gap-3 mb-2">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={profile.avatar_url || undefined} alt={profile.username} />
                    <AvatarFallback>{profile.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{profile.username}</div>
                    <div className="text-sm text-muted-foreground">
                      {profile.full_name || ''}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex-1 flex flex-col p-6 space-y-6">
              {links.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={cn(
                    "flex items-center gap-3 text-base",
                    isActive(link.path) 
                      ? "text-primary font-medium" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={closeSheet}
                >
                  {link.icon}
                  {link.label}
                </Link>
              ))}
              
              <Button 
                variant="default" 
                className="w-full justify-start gap-2"
                onClick={() => {
                  closeSheet();
                  navigate('/create');
                }}
              >
                <PlusCircle className="h-5 w-5" />
                Create Prompt
              </Button>
              
              {user ? (
                <>
                  <Link
                    to="/profile"
                    className={cn(
                      "flex items-center gap-3 text-base",
                      isActive('/profile') 
                        ? "text-primary font-medium" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    onClick={closeSheet}
                  >
                    <User className="h-5 w-5" />
                    Profile
                  </Link>
                  <Link
                    to="/settings"
                    className={cn(
                      "flex items-center gap-3 text-base",
                      isActive('/settings') 
                        ? "text-primary font-medium" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    onClick={closeSheet}
                  >
                    <Settings className="h-5 w-5" />
                    Settings
                  </Link>
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => {
                      handleSignOut();
                      closeSheet();
                    }}
                  >
                    Sign Out
                  </Button>
                </>
              ) : (
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2"
                  onClick={() => {
                    closeSheet();
                    navigate('/login');
                  }}
                >
                  <LogIn className="h-5 w-5" />
                  Sign In
                </Button>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    );
  }

  // Desktop navigation
  return (
    <nav className="w-full h-16 border-b px-6 flex items-center justify-between sticky top-0 z-50 bg-background/80 backdrop-blur-md">
      <div className="flex items-center">
        <Link to="/" className="font-bold text-lg mr-6">Promptiverse</Link>
        
        <div className="flex items-center space-x-1">
          {links.map((link) => (
            <Button
              key={link.path}
              variant={isActive(link.path) ? "secondary" : "ghost"}
              asChild
              className={cn(
                "gap-2",
                isActive(link.path) ? "text-secondary-foreground" : "text-muted-foreground"
              )}
            >
              <Link to={link.path}>
                {link.icon}
                {link.label}
              </Link>
            </Button>
          ))}
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button 
          variant="default" 
          size="sm" 
          className="gap-2"
          onClick={() => navigate('/create')}
        >
          <PlusCircle className="h-4 w-4" />
          Create Prompt
        </Button>
        
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.username} />
                  <AvatarFallback>{profile?.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut}>
                <LogIn className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button variant="outline" size="sm" onClick={() => navigate('/login')}>
            Sign In
          </Button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
