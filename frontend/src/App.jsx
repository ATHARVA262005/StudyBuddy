import React, { useState } from 'react';
import { APIKeySetup } from './components/APIKeySetup';
import { ChatInterface } from './components/ChatInterface';
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';

// Main application content
const AppContent = ({ initialContent, topic }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const [setupComplete, setSetupComplete] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="text-gray-300 mt-6 text-xl">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && !setupComplete) {
    return (
      <div className="min-h-screen bg-gray-900 p-4">
        <APIKeySetup onSetupComplete={() => setSetupComplete(true)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <ChatInterface initialContent={initialContent} topic={topic} />
    </div>
  );
};

// Main App component with AuthProvider wrapper
function App() {
  // Sample content - replace with your actual content loading logic
  const initialContent = "This is sample study material content.";
  const topic = "Computer Science";

  return (
    <AuthProvider>
      <AppContent initialContent={initialContent} topic={topic} />
    </AuthProvider>
  );
}

export default App;