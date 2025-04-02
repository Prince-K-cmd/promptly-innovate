
import React, { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import ScrollToTop from '@/components/ScrollToTop';

const Index: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // If we're at the root path with no route, render the HomePage
    if (location.pathname === '/' && location.key === 'default') {
      navigate('/');
    }
  }, [location, navigate]);

  return (
    <Layout>
      <ScrollToTop />
      <Outlet />
    </Layout>
  );
};

export default Index;
