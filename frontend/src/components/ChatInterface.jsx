import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export const ChatInterface = ({ initialContent, topic }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendChatRequest = useCallback(async (promptText) => {
    const response = await fetch('https://studybuddybackendd.vercel.app/api/chat', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: promptText,
        topic
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get response from AI');
    }

    const data = await response.json();
    return data.response;
  }, [topic]);

  const handleInitialExplanation = useCallback(async () => {
    if (!initialContent || !topic || !isAuthenticated) return;

    setIsTyping(true);
    try {
      const response = await sendChatRequest(initialContent);
      setMessages([{ 
        role: 'assistant', 
        content: response 
      }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages([{ 
        role: 'assistant', 
        content: 'Sorry, I encountered an error while analyzing the content. Please try asking a specific question.' 
      }]);
    } finally {
      setIsTyping(false);
    }
  }, [initialContent, topic, sendChatRequest, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      handleInitialExplanation();
    }
  }, [handleInitialExplanation, isAuthenticated, authLoading]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isTyping || !isAuthenticated) return;

    const newMessage = { role: 'user', content: inputMessage };
    setMessages(prev => [...prev, newMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const promptText = `Context: ${initialContent}\nQuestion: ${inputMessage}`;
      const response = await sendChatRequest(promptText);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: response 
      }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Error: ${error.message}. Please try again.` 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatMessage = (content) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold text
      .replace(/\n\n/g, '<br/><br/>') // Double line breaks
      .replace(/\n/g, '<br/>') // Single line breaks
      .replace(/^\s*[-•]\s(.+)$/gm, '<li>$1</li>') // Bullet points
      .replace(/^\s*(\d+)\.\s(.+)$/gm, '<li>$1. $2</li>') // Numbered lists
      .replace(/---/g, '<hr class="my-4 border-gray-200"/>'); // Section breaks
  };

  const renderMessage = (message) => {
    const formattedContent = formatMessage(message.content);
    const isUser = message.role === 'user';
    
    return (
      <div className={`rounded-lg px-4 py-2 max-w-[80%] ${
        isUser ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800'
      }`}>
        <div 
          dangerouslySetInnerHTML={{ __html: formattedContent }}
          className={`
            prose max-w-none
            ${isUser ? 'prose-invert' : ''}
            [&_strong]:font-bold
            [&_li]:ml-4
            [&_ul]:list-disc
            [&_ol]:list-decimal
          `}
        />
      </div>
    );
  };

  if (authLoading) {
    return (
      <div className="bg-gray-800 rounded-lg shadow-xl p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
        <p className="text-gray-300 mt-4">Verifying your API key...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="bg-gray-800 rounded-lg shadow-xl p-8 text-center">
        <p className="text-yellow-400 text-lg mb-4">Authentication Required</p>
        <p className="text-gray-300">Please set up your Gemini API key to use the chat interface.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden flex flex-col h-[600px] border border-gray-700">
      <div className="bg-gray-700 px-4 py-3">
        <h2 className="text-lg font-medium text-white">Chat with AI Tutor</h2>
        <p className="text-sm text-gray-300">
          I've analyzed your document about {topic}. What would you like to know?
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-900 custom-scrollbar">
        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`rounded-lg px-4 py-2 max-w-[80%] ${
              message.role === 'user' 
                ? 'bg-indigo-600 text-gray-100' 
                : 'bg-gray-800 text-gray-100 border border-gray-700'
            }`}>
              <div 
                dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
                className={`
                  prose prose-invert max-w-none
                  prose-headings:text-gray-100
                  prose-p:text-gray-200
                  prose-strong:text-indigo-400
                  prose-li:text-gray-200
                `}
              />
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-700 rounded-lg px-4 py-2">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-700">
        <div className="flex space-x-4">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask a question..."
            className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder-gray-400"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isTyping}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-600"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};
