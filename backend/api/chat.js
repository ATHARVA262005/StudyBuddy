import { GoogleGenerativeAI } from '@google/generative-ai';
const crypto = require('crypto');

// Simple decryption for API key (in production, use a more secure method)
function decryptApiKey(encryptedKey) {
  // This is a simplified decryption for demonstration
  // In production, use a proper encryption library with secure keys
  try {
    const decipher = crypto.createDecipher('aes-256-cbc', 'studybuddy-secret-key');
    let decrypted = decipher.update(encryptedKey, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get encrypted API key from cookies
    const cookies = parseCookies(req);
    const encryptedApiKey = cookies.studybuddy_enc_key;
    const hashedApiKey = cookies.studybuddy_api_key;
    const headerApiKeyHash = req.headers['x-api-key-hash'];
    
    // Check if user is authenticated
    if (!encryptedApiKey && !hashedApiKey && !headerApiKeyHash) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    let userApiKey;
    
    // Try to get the decrypted API key from the encrypted cookie
    if (encryptedApiKey) {
      userApiKey = decryptApiKey(encryptedApiKey);
      if (!userApiKey) {
        return res.status(401).json({ error: 'Invalid API key' });
      }
    } else {
      // If we don't have the encrypted key, we can't proceed
      return res.status(401).json({ error: 'API key not available' });
    }

    const { text, topic } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Initialize the Google Generative AI with the user's API key
    const genAI = new GoogleGenerativeAI(userApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Create a prompt that instructs the AI to act as a tutor
    const prompt = `
      You are an experienced tutor helping a student understand material from their course.
      The student has provided the following text from their study materials: 
      
      "${text.substring(0, 5000)}" 
      
      ${topic ? `The topic is: ${topic}`: 'Topic_name'}
      
      Please provide a helpful, educational response that clarifies the key concepts. 
      Format your response with appropriate headings, bullet points, and emphasis where needed.
    `;

    // Generate content
    try {
      const result = await model.generateContent(prompt);
      const response = result.response.text();
      return res.status(200).json({ response });
    } catch (apiError) {
      console.error('Gemini API error:', apiError);
      return res.status(400).json({ error: 'Error with Gemini API: ' + apiError.message });
    }
  } catch (error) {
    console.error('Chat API error:', error);
    return res.status(500).json({ error: 'Failed to generate response' });
  }
}

// Helper function to parse cookies
function parseCookies(req) {
  const cookies = {};
  const cookieHeader = req.headers.cookie;
  
  if (cookieHeader) {
    cookieHeader.split(';').forEach(cookie => {
      const [name, value] = cookie.trim().split('=');
      cookies[name] = value;
    });
  }
  
  return cookies;
}
