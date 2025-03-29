
import React, { ErrorInfo } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { useAuth } from '@/contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error in component:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
          <p className="mb-4">Please try refreshing the page</p>
        </div>
      );
    }

    return this.props.children;
  }
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  try {
    // This will check if the AuthProvider is available
    const auth = useAuth();
    
    return (
      <div className="flex flex-col min-h-screen">
        <ErrorBoundary>
          <Navbar />
        </ErrorBoundary>
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </div>
    );
  } catch (error) {
    console.error("Error in Layout component:", error);
    return (
      <div className="flex flex-col min-h-screen">
        <main className="flex-1">
          {children}
        </main>
      </div>
    );
  }
};

export default Layout;
