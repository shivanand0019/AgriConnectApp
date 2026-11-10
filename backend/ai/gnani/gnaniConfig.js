/**
 * Gnani AI Configuration Module
 * Manages configuration, endpoints, models and demo/live flags for:
 * 1. Gnani Prisma v2.5 / v3.0 (Speech-to-Text)
 * 2. Gnani Evon v3.3 (30B Reasoning LLM)
 * 3. Gnani Timbre v2.5 / v3.0 (Text-to-Speech)
 */

const getGnaniConfig = () => {
  const isDemoExplicit = process.env.AI_DEMO_MODE === 'true';
  const geminiApiKey = process.env.GEMINI_API_KEY || '';
  const gnaniApiKey = process.env.GNANI_API_KEY || '';
  const evonApiKey = process.env.EVON_API_KEY || '';
  const evonBaseUrl = process.env.EVON_API_BASE_URL || 'https://api-inference.huggingface.co/models/gnani/gnani-evon-v3.3-30B-A3B';

  // Check if each service has credentials
  const isGeminiConfigured = Boolean(geminiApiKey && geminiApiKey.trim() !== '');
  const isPrismaConfigured = Boolean(gnaniApiKey && gnaniApiKey.trim() !== '');
  const isEvonConfigured = Boolean(isGeminiConfigured || (evonApiKey && evonApiKey.trim() !== '') || (process.env.EVON_API_BASE_URL && !process.env.EVON_API_BASE_URL.includes('huggingface.co')));
  const isTimbreConfigured = Boolean(gnaniApiKey && gnaniApiKey.trim() !== '');

  const effectiveDemoMode = isDemoExplicit || (!isGeminiConfigured && (!isPrismaConfigured || !isEvonConfigured || !isTimbreConfigured));

  return {
    isDemoMode: effectiveDemoMode,
    modes: {
      gemini: isGeminiConfigured ? 'LIVE' : 'DISABLED',
      prisma: isPrismaConfigured && !isDemoExplicit ? 'LIVE' : 'DEMO',
      evon: isGeminiConfigured ? 'LIVE (Gemini)' : (isEvonConfigured && !isDemoExplicit ? 'LIVE' : 'DEMO'),
      timbre: isTimbreConfigured && !isDemoExplicit ? 'LIVE' : 'DEMO',
    },
    gemini: {
      apiKey: geminiApiKey,
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      isConfigured: isGeminiConfigured,
    },
    prisma: {
      baseUrl: process.env.GNANI_API_BASE_URL || 'https://api.vachana.ai',
      endpoint: '/stt/v3',
      apiKey: gnaniApiKey,
      model: process.env.GNANI_STT_MODEL || 'prisma-v2.5',
      defaultLanguage: 'indic-auto',
      supportedLanguages: [
        { code: 'kn-IN', name: 'Kannada (ಕನ್ನಡ)', native: 'ಕನ್ನಡ' },
        { code: 'hi-IN', name: 'Hindi (हिंदी)', native: 'हिंदी' },
        { code: 'en-IN', name: 'English (India)', native: 'English' },
        { code: 'ta-IN', name: 'Tamil (தமிழ்)', native: 'தமிழ்' },
        { code: 'te-IN', name: 'Telugu (తెలుగు)', native: 'తెలుగు' },
        { code: 'mr-IN', name: 'Marathi (मराठी)', native: 'मराठी' },
        { code: 'indic-auto', name: 'Auto Detect (ಸ್ವಯಂ / स्वतः)', native: 'Auto' }
      ]
    },
    evon: {
      model: process.env.EVON_MODEL || process.env.GNANI_EVEN_MODEL || 'gnani/gnani-evon-v3.3-30B-A3B',
      baseUrl: evonBaseUrl,
      apiKey: evonApiKey,
      timeoutMs: 35000,
      temperature: 0.2,
      maxTokens: 1024
    },
    timbre: {
      baseUrl: process.env.GNANI_API_BASE_URL || 'https://api.vachana.ai',
      endpoint: '/api/v1/tts/inference',
      apiKey: gnaniApiKey,
      model: process.env.GNANI_TTS_MODEL || 'timbre-v2.5',
      defaultVoice: 'Chitra',
      defaultVoices: {
        'kn-IN': 'Chitra',
        'hi-IN': 'Nalini',
        'en-IN': 'Tanvi',
        'ta-IN': 'Oviya',
        'te-IN': 'Tanvi',
        'mr-IN': 'Radhika',
      },
      voices: {
        'kn-IN': [
          { id: 'Chitra', gender: 'Female', name: 'Chitra (Kannada)' },
          { id: 'Kaveri', gender: 'Female', name: 'Kaveri (Kannada)' },
          { id: 'Girish', gender: 'Male', name: 'Girish (Kannada)' }
        ],
        'hi-IN': [
          { id: 'Nalini', gender: 'Female', name: 'Nalini (Hindi)' },
          { id: 'Deepak', gender: 'Male', name: 'Deepak (Hindi)' },
          { id: 'Tanvi', gender: 'Female', name: 'Tanvi (Hindi)' }
        ],
        'en-IN': [
          { id: 'Tanvi', gender: 'Female', name: 'Tanvi (Indian English)' },
          { id: 'Pranav', gender: 'Male', name: 'Pranav (Indian English)' },
          { id: 'Nalini', gender: 'Female', name: 'Nalini (Indian English)' },
          { id: 'Deepak', gender: 'Male', name: 'Deepak (Indian English)' }
        ],
        'ta-IN': [
          { id: 'Oviya', gender: 'Female', name: 'Oviya (Tamil)' },
          { id: 'Kavin', gender: 'Male', name: 'Kavin (Tamil)' }
        ],
        'te-IN': [
          { id: 'Tanvi', gender: 'Female', name: 'Tanvi (Telugu)' },
          { id: 'Deepak', gender: 'Male', name: 'Deepak (Telugu)' }
        ],
        'mr-IN': [
          { id: 'Radhika', gender: 'Female', name: 'Radhika (Marathi)' },
          { id: 'Omkar', gender: 'Male', name: 'Omkar (Marathi)' }
        ]
      }
    }
  };
};

module.exports = { getGnaniConfig };
