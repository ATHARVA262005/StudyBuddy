import React from 'react';

export const Header = () => {
  return (
    <header className="bg-gray-900 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg 
              className="h-8 w-8 text-indigo-500" 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <div>
              <h1 className="text-2xl font-semibold text-white">StudyBuddy</h1>
              <p className="text-sm text-gray-400">AI-powered study assistant</p>
            </div>
          </div>
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full blur opacity-75 group-hover:opacity-100 animate-pulse"></div>
            <div className="relative bg-gray-800/80 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm text-indigo-300 border border-indigo-500/50">
              PDF Study Guide Generator
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
