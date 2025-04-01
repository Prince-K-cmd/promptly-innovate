import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import ScrollToTop from '@/components/ScrollToTop';

const AuthLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-background to-muted/50">
      <ScrollToTop />
      {/* Left side - Logo and branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-promptiverse-purple/90 to-promptiverse-teal/90 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10"></div>
        <div className="relative z-10 text-center p-8 max-w-md">
          <Link to="/" className="inline-block mb-8">
            <BookOpen className="h-16 w-16 text-white mx-auto" />
          </Link>
          <h1 className="text-4xl font-bold text-white mb-6">Promptiverse</h1>
          <p className="text-white/80 text-lg">
            Create, manage, and share powerful AI prompts to enhance your productivity and creativity.
          </p>
        </div>
      </div>

      {/* Right side - Auth forms */}
      <div className="w-full lg:w-1/2 flex items-center justify-center py-8 px-0">
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;
