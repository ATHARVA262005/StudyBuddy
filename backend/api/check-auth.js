export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get hashed API key from cookies
    const cookies = parseCookies(req);
    const hashedApiKey = cookies.studybuddy_api_key || cookies.hashed_api_key;
    const keyConfigured = cookies.api_key_configured;
    
    // Check if API key exists in cookies
    const isAuthenticated = !!hashedApiKey || !!keyConfigured;
    
    return res.status(200).json({ 
      isAuthenticated,
      // Add fallback info in response
      cookieCheck: {
        hasApiKeyCookie: !!hashedApiKey,
        hasConfiguredFlag: !!keyConfigured,
        availableCookies: Object.keys(cookies)
      }
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return res.status(500).json({ error: 'Failed to check authentication status' });
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
