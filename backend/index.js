import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import cookieParser from 'cookie-parser';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

const app = express();

app.use(cors({
  origin: 'https://studybuddy.atharvaralegankar.tech',
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// Store hashed keys in memory (in production, use a proper database)
const apiKeys = new Map();

app.post('/api/setup', async (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey) {
    return res.status(400).json({ error: 'API key is required' });
  }

  try {
    // Check if user already has a key
    const existingKeyId = req.cookies.apiKeyId;
    if (existingKeyId) {
      // Update existing key
      const salt = await bcrypt.genSalt(10);
      const hashedKey = await bcrypt.hash(apiKey, salt);
      
      apiKeys.set(existingKeyId, {
        hashedKey,
        genAI: new GoogleGenerativeAI(apiKey)
      });

      return res.json({ success: true, message: 'API key updated successfully' });
    }

    // If no existing key, create new one
    // Generate a unique identifier for this API key
    const keyId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    
    // Hash the API key
    const salt = await bcrypt.genSalt(10);
    const hashedKey = await bcrypt.hash(apiKey, salt);
    
    // Store the hashed key and Gemini instance
    apiKeys.set(keyId, {
      hashedKey,
      genAI: new GoogleGenerativeAI(apiKey)
    });

    // Set cookie with the keyId
    res.cookie('apiKeyId', keyId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Setup error:', error);
    res.status(500).json({ error: 'Failed to setup API key' });
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const { text, topic } = req.body;
    const keyId = req.cookies.apiKeyId;

    if (!keyId || !apiKeys.has(keyId)) {
      return res.status(401).json({ error: 'Please set up your API key first' });
    }

    const { genAI } = apiKeys.get(keyId);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const isQuestion = text.includes('Question:');
    
    const prompt = isQuestion ? `
      You are a helpful AI tutor. Answer the following question about ${topic}.
      Use the following content as context for your answer. Your answer must be based on this content:

      CONTEXT:
      ${text}

      FORMAT YOUR RESPONSE:
      - Use **bold** for key terms and concepts
      - Use proper line breaks for readability
      - Use bullet points where appropriate
      - Use numbered lists for steps
      - Cite specific parts from the context
    ` : `
      You are a helpful AI tutor. Explain the topic "${topic}" based on the following content.
      Your explanation must be based on this content:

      CONTEXT:
      ${text}

      FORMAT YOUR RESPONSE:
      - Use **bold** for key terms and concepts
      - Use proper line breaks for readability
      - Use bullet points for key points
      - Use numbered lists for sequences
      - Use --- for section breaks

      INCLUDE:
      1. A clear introduction to ${topic}
      2. Main concepts and their explanations (cite from context)
      3. Key points to remember
      4. Examples from the context
      5. Important notes and connections
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    res.json({ response: response.text() });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add endpoint to check if API key is set
app.get('/api/check-auth', async (req, res) => {
  const keyId = req.cookies.apiKeyId;
  
  if (!keyId || !apiKeys.has(keyId)) {
    // Clear any invalid cookies
    res.clearCookie('apiKeyId');
    return res.json({ isAuthenticated: false });
  }

  // Verify the API key is still valid
  try {
    const keyData = apiKeys.get(keyId);
    const model = keyData.genAI.getGenerativeModel({ model: 'gemini-1.5-pro' }); // Updated model name
    await model.generateContent('test connection'); // Quick validation
    return res.json({ isAuthenticated: true });
  } catch (error) {
    console.error('API key validation failed:', error);
    // Clear invalid key and cookie
    apiKeys.delete(keyId);
    res.clearCookie('apiKeyId');
    return res.json({ 
      isAuthenticated: false,
      error: 'API key validation failed'
    });
  }
});

// Add new endpoint to clear authentication
app.post('/api/clear-auth', (req, res) => {
  const keyId = req.cookies.apiKeyId;
  
  if (keyId) {
    apiKeys.delete(keyId);
  }
  
  res.clearCookie('apiKeyId');
  res.json({ success: true });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

app.get('/', (req, res) => {
  res.send('Hello from the backend');
});

app.use((req, res) => {
  res.status(404).send('Not Found');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
