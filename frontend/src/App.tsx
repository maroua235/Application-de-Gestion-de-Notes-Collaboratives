import React from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import Login from './Login';
import Notes from './Notes';

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="container">
        <div className="card">
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return <Notes />;
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;