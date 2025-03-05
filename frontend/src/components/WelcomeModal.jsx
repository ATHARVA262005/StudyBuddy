import React from 'react';

export const WelcomeModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-xl p-8 w-[32rem] max-w-[95vw] border border-indigo-500/20 shadow-xl">
        <div className="flex flex-col items-center text-center space-y-4">
          {/* Profile Image */}
          <div>
            <img 
              src="https://media.licdn.com/dms/image/v2/D4D03AQFlmZfaiMFQpg/profile-displayphoto-shrink_400_400/B4DZVDiOfsHkAg-/0/1740594802550?e=1746662400&v=beta&t=BCer0KDzLj2cI6486M3JpLPn8ZJGvRTFozCLzjnApR0"
              alt="Developer" 
              className="w-24 h-24 rounded-full border-2 border-indigo-500"
            />
          </div>

          {/* Message */}
          <div className="space-y-3">
            <h3 className="text-2xl font-bold text-indigo-400">
              Hi, it's me Atharva! 👋
            </h3>
            
            <p className="text-gray-300">
              Welcome to StudyBuddy! I built this while avoiding my own exams 
              (because who doesn't build a whole app instead of studying? 😅). 
              Now I'm sharing it with everyone because struggling alone is no fun... 
              I mean, because studying together is more fun! 📚
            </p>

            <p className="text-gray-400 text-sm">
              More features coming soon™ <br/>
              (or after exams... if I pass! Wish me luck! 🤞)
            </p>
          </div>

          {/* Action Buttons Row */}
          <div className="flex items-center gap-3 mt-2">
            <a 
              href="https://www.linkedin.com/in/atharvaralegankar/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.04 17.043h-2.962v-4.64c0-1.107-.023-2.531-1.544-2.531-1.544 0-1.78 1.204-1.78 2.449v4.722H7.793V7.5h2.844v1.3h.039c.397-.75 1.364-1.54 2.808-1.54 3.001 0 3.556 1.974 3.556 4.545v5.238zM4.447 6.194c-.954 0-1.72-.771-1.72-1.72s.767-1.72 1.72-1.72 1.72.771 1.72 1.72-.767 1.72-1.72 1.72zm1.484 10.849h-2.97V7.5h2.97v9.543z"/>
              </svg>
              Connect with me!
            </a>

            <button
              onClick={onClose}
              className="px-6 py-2 bg-indigo-600/20 text-indigo-400 rounded-lg hover:bg-indigo-600/30 transition-colors"
            >
              Let's study! 📚
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
