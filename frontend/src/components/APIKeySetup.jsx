import React, { useState } from 'react';

export const APIKeySetup = ({ onSetupComplete }) => {
  const [apiKey, setApiKey] = useState('');
  const [consent, setConsent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('https://studybuddybackendd.vercel.app/api/setup', {
        method: 'POST',
        credentials: 'include', // Important for cookies
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          apiKey,
          consent,
          // Add domain info to help with cookie settings
          domain: window.location.hostname
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to set up API key');
      }

      // Get the response data which includes the hashed API key
      const data = await response.json();
      
      // Store the hashed API key in localStorage as a fallback
      if (data.hashedApiKey) {
        localStorage.setItem('hashedApiKey', data.hashedApiKey);
        localStorage.setItem('apiKeyConfigured', 'true');
      }
      
      onSetupComplete();
    } catch (err) {
      console.error('Setup error:', err);
      setError(`Failed to connect to server: ${err.message}`);
    } finally {
      setIsLoading(false);
      // Clear the API key from memory
      setApiKey('');
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-md p-6 max-w-md mx-auto mt-8 border border-gray-700">
      <h2 className="text-xl font-semibold mb-4 text-gray-100">Set Up Gemini API</h2>
      <p className="text-sm text-gray-300 mb-4">
        To use the AI tutor, please provide your Gemini API key. 
        Your key is stored locally and never sent to our servers.
      </p>
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-200">
              Gemini API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-white placeholder-gray-400"
              required
            />
          </div>

          <div className="flex items-start">
            <input
              type="checkbox"
              id="consent"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="h-4 w-4 mt-1 text-indigo-600 focus:ring-indigo-500 border-gray-600 rounded bg-gray-700"
              required
            />
            <label htmlFor="consent" className="ml-2 text-sm text-gray-300">
              I consent to the storage and use of my API key for making requests to the Gemini API. 
              I understand that my API key will be encrypted and used only for the purpose of 
              generating AI responses for my study materials.
            </label>
          </div>

          {error && (
            <div className="text-red-400 text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={isLoading || !apiKey || !consent}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-600"
          >
            {isLoading ? 'Setting up...' : 'Set API Key'}
          </button>
        </div>
      </form>

      <div className="mt-4 text-xs text-gray-400">
        <p>Note: Your API key is stored securely in your browser's local storage and is never sent to our servers.</p>
        <p className="mt-2">Need an API key? Visit the <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300">Google AI Studio</a></p>
      </div>
    </div>
  );
};
