const crypto = require('crypto');

// Simple encryption for API key (in production, use a more secure method)
function encryptApiKey(apiKey) {
  // This is a simplified encryption for demonstration
  // In production, use a proper encryption library with secure keys
  const cipher = crypto.createCipher('aes-256-cbc', 'studybuddy-secret-key');
  let encrypted = cipher.update(apiKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { apiKey, consent } = req.body;
    
    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }

    if (consent !== true) {
      return res.status(400).json({ error: 'User consent is required' });
    }
    
    // Hash the API key for verification
    const hashedKey = crypto.createHash('sha256').update(apiKey).digest('hex');
    
    // Encrypt the actual API key for later use
    const encryptedKey = encryptApiKey(apiKey);
    
    // Set cookie options for cross-domain use
    const cookieMaxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
    
    // Format cookies manually to ensure proper formatting
    res.setHeader('Set-Cookie', [
      `studybuddy_api_key=${hashedKey}; Max-Age=${cookieMaxAge}; Path=/; SameSite=None; Secure`,
      `studybuddy_enc_key=${encryptedKey}; Max-Age=${cookieMaxAge}; Path=/; SameSite=None; Secure; HttpOnly`,
      `api_key_configured=true; Max-Age=${cookieMaxAge}; Path=/; SameSite=None; Secure`
    ]);
    
    // Return the hashed key in the response for fallback
    return res.status(200).json({ 
      success: true, 
      hashedApiKey: hashedKey
    });
  } catch (error) {
    console.error('API setup error:', error);
    return res.status(500).json({ error: 'Failed to set up API key' });
  }
}
