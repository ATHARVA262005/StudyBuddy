export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Clear cookies by setting expiry to the past
    res.setHeader('Set-Cookie', [
      'studybuddy_api_key=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=None; Secure',
      'studybuddy_enc_key=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=None; Secure; HttpOnly',
      'api_key_configured=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=None; Secure',
      'hashed_api_key=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=None; Secure',
    ]);
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Clear auth error:', error);
    return res.status(500).json({ error: 'Failed to clear authentication' });
  }
}
