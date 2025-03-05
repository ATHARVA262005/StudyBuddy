import React, { useState } from 'react';

export const APIKeyManager = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleUpdateKey = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('https://studybuddybackendd.vercel.app/api/setup', {
        method: 'POST',
        credentials: 'include',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ apiKey })
      });

      if (!response.ok) {
        throw new Error('Failed to update API key');
      }

      setIsModalOpen(false);
      setApiKey('');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="ml-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Update API Key
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full border border-gray-700">
            <h3 className="text-lg font-medium mb-4 text-gray-100">Update Gemini API Key</h3>
            <form onSubmit={handleUpdateKey}>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter new API key"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md mb-4 text-white placeholder-gray-400"
                required
              />
              {error && (
                <p className="text-red-400 text-sm mb-4">{error}</p>
              )}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-gray-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !apiKey}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-600"
                >
                  {isLoading ? 'Updating...' : 'Update Key'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
