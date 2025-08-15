import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Layout } from './components/Layout';
import { AuthForm } from './components/auth/AuthForm';
import { Marketplace } from './components/marketplace/Marketplace';
import { Wallet } from './components/wallet/Wallet';
import { MyOffers } from './components/offers/MyOffers';
import { Trades } from './components/trades/Trades';
import { Chat } from './components/chat/Chat';
import { Profile } from './components/profile/Profile';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('marketplace');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'marketplace':
        return <Marketplace />;
      case 'wallet':
        return <Wallet />;
      case 'offers':
        return <MyOffers />;
      case 'trades':
        return <Trades />;
      case 'chat':
        return <Chat />;
      case 'profile':
        return <Profile />;
      default:
        return <Marketplace />;
    }
  };

  return (
    <Layout currentPage={currentPage} setCurrentPage={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--toast-bg, #ffffff)',
              color: 'var(--toast-color, #000000)',
              border: '1px solid var(--toast-border, #e5e7eb)',
            },
          }}
        />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;