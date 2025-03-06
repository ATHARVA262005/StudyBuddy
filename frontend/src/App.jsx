import React, { useState, useEffect } from 'react';
import { PDFReader } from './components/PDFReader';
import { TextExtractor } from './components/TextExtractor';
import { StudyGuide } from './components/StudyGuide';
import { Header } from './components/Header';
import { BrowserNotice } from './components/BrowserNotice';
import { ClearDataButton } from './components/ClearDataButton';
import { ChatInterface } from './components/ChatInterface';
import { APIKeySetup } from './components/APIKeySetup';
import { APIKeyManager } from './components/APIKeyManager';
import { WelcomeModal } from './components/WelcomeModal';

const App = () => {
  const [extractedText, setExtractedText] = useState('');
  const [studyGuide, setStudyGuide] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTopic, setCurrentTopic] = useState('');
  const [isApiKeySet, setIsApiKeySet] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    const checkApiKeyStatus = async () => {
      setIsChecking(true);
      
      // First check local storage as a fallback
      const localAuthStatus = localStorage.getItem('apiKeyConfigured');
      if (localAuthStatus === 'true') {
        setIsApiKeySet(true);
        setIsChecking(false);
        return;
      }
      
      try {
        const response = await fetch('https://studybuddybackendd.vercel.app/api/check-auth', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error('Auth check failed');
        }
        
        const data = await response.json();
        setIsApiKeySet(data.isAuthenticated);
        
        // If authenticated, set local storage indicator
        if (data.isAuthenticated) {
          localStorage.setItem('apiKeyConfigured', 'true');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsApiKeySet(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkApiKeyStatus();
  }, []);

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    setShowWelcome(!hasSeenWelcome);
  }, []);

  const handleTextExtracted = async (text, topic) => {
    setExtractedText(text);
    setCurrentTopic(topic);
  };

  const handleClearData = async () => {
    // Clear all state
    setExtractedText('');
    setStudyGuide(null);
    setIsLoading(false);
    setCurrentTopic('');
    setIsApiKeySet(false);
    
    try {
      // Clear API key from server
      await fetch('https://studybuddybackendd.vercel.app/api/clear-auth', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Error clearing auth:', error);
    }
    
    // Clear any cached files
    if ('caches' in window) {
      const names = await caches.keys();
      await Promise.all(names.map(name => caches.delete(name)));
    }
    
    // Clear cookies
    document.cookie.split(";").forEach(c => {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    
    // Clear localStorage
    localStorage.clear();
    
    // Force page reload
    window.location.reload();
  };

  const handleApiSetupComplete = () => {
    setIsApiKeySet(true);
  };

  const handleCloseWelcome = () => {
    setShowWelcome(false);
    localStorage.setItem('hasSeenWelcome', 'true');
  };

  // Show loading spinner while checking
  if (isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Only show API setup if no valid cookie exists
  if (!isApiKeySet) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
        <Header />
        <APIKeySetup onSetupComplete={handleApiSetupComplete} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      <WelcomeModal isOpen={showWelcome} onClose={handleCloseWelcome} />
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <BrowserNotice />
        
        <div className="flex justify-end mb-4 items-center space-x-4">
          <APIKeyManager />
          <ClearDataButton onClearData={handleClearData} />
        </div>
        
        {/* First Row - PDF Upload */}
        <div className="mb-8">
          <PDFReader onTextExtracted={handleTextExtracted} />
        </div>

        {/* Second Row - Two Equal Height Columns */}
        {extractedText && (
          <div className="grid md:grid-cols-2 gap-6 h-[600px]">
            <TextExtractor text={extractedText} />
            {currentTopic && (
              <ChatInterface 
                initialContent={extractedText}
                topic={currentTopic}
              />
            )}
          </div>
        )}
      </main>
      
      <footer className="bg-gray-800 mt-12 py-6 border-t border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-400">
            StudyBuddy processes all data locally in your browser. No PDFs or extracted text are sent to our servers unless you explicitly submit them.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;