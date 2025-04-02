import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createBrowserRouter, ScrollRestoration } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { HelmetProvider } from 'react-helmet-async';

// Layouts
import Index from '@/pages/Index';
import AuthLayout from '@/components/AuthLayout';

// Pages
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import ProfilePage from '@/pages/ProfilePage';
import SettingsPage from '@/pages/SettingsPage';
import SearchPage from '@/pages/SearchPage';
import LibraryPage from '@/pages/LibraryPage';
import CreatePromptPage from '@/pages/CreatePromptPage';
import PromptBuilderPage from '@/pages/PromptBuilderPage';
import CategoryManagementPage from '@/pages/CategoryManagementPage';
import NotFoundPage from '@/pages/NotFoundPage';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (updated from cacheTime)
      retry: 1,
    },
  },
});

// Define routes
const router = createBrowserRouter([
  // Auth routes (no header/footer)
  {
    element: <AuthLayout />,
    children: [
      { path: "login", element: <LoginPage /> },
      { path: "signup", element: <SignupPage /> },
      { path: "reset-password", element: <ResetPasswordPage /> },
    ],
  },
  // Main app routes (with header/footer)
  {
    path: "/",
    element: <Index />,
    children: [
      { path: "", element: <HomePage /> },
      { path: "profile", element: <ProfilePage /> },
      { path: "settings", element: <SettingsPage /> },
      { path: "search", element: <SearchPage /> },
      { path: "library", element: <LibraryPage /> },
      { path: "create", element: <CreatePromptPage /> },
      { path: "builder", element: <PromptBuilderPage /> },
      { path: "categories", element: <CategoryManagementPage /> },
      { path: "not-found", element: <NotFoundPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <AuthProvider>
          <HelmetProvider>
            <RouterProvider router={router} />
            <Toaster />
          </HelmetProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
