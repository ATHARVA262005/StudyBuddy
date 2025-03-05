import React from 'react';

export const TextExtractor = ({ text }) => {
  return (
    <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden flex flex-col h-[600px] border border-gray-700">
      <div className="bg-gray-700 px-4 py-3">
        <h2 className="text-lg font-medium text-white">Extracted Text</h2>
        <p className="text-sm text-gray-300">Text content from your PDF</p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 bg-gray-800 custom-scrollbar">
        <pre className="whitespace-pre-wrap break-words text-sm text-gray-300 font-sans w-full">{text}</pre>
      </div>
    </div>
  );
};
