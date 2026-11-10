/**
 * Gnani Timbre v2.5 / v3.0 Text-to-Speech (TTS) Client
 * Converts assistant responses into natural Indian language speech.
 * Officially supports Kannada, Hindi, English, Tamil, Telugu, and Marathi.
 */

const { getGnaniConfig } = require('./gnaniConfig');

// Official supported voices for Timbre v2.5
const SUPPORTED_TIMBRE_VOICES = new Set([
  'Nalini', 'Bhavna', 'Yashvi', 'Urmila', 'Jwala', 'Chitra', 'Ambuja', 'Deepak',
  'Roopesh', 'Vikrant', 'Hemraj', 'Jalaj', 'Omkar', 'Aarohi', 'Bhavini', 'Charvi',
  'Eishani', 'Falguni', 'Gauri', 'Iravati', 'Janaki', 'Kamakshi', 'Madhuri', 'Radhika',
  'Shweta', 'Tanvi', 'Vidya', 'Wamika', 'Yamini', 'Abhimanyu', 'Chirag', 'Deven',
  'Farhan', 'Jatin', 'Kartik', 'Kaveri', 'Trupti', 'Devika', 'Pranav', 'Shlok',
  'Girish', 'Asmita', 'Trisha', 'Brinda', 'Vedika', 'Noopur', 'Oviya', 'Parvati',
  'Suhana', 'Lehara', 'Lavanya', 'Yukti', 'Varuni', 'Saanvi', 'Kavin', 'Hansika',
  'Reshma', 'Riyaan', 'Zahira', 'Ishaan', 'Kirra', 'Dhruva', 'Damini', 'Urvashi',
  'Falak', 'Veera', 'Lalita', 'Nayana', 'Gaurav', 'Harshit', 'Mehuli', 'Zayan', 'Poorvi'
]);

// Map legacy or typo voices to real Timbre supported voices
const VOICE_ALIASES = {
  chaitra: 'Chitra',
  chetan: 'Girish',
  kabir: 'Deepak',
  pooja: 'Tanvi',
  arjun: 'Pranav',
  ananya: 'Oviya',
  surya: 'Kavin',
  sravani: 'Tanvi',
  kalyan: 'Deepak'
};

/**
 * Clean text for natural speech pronunciation by Gnani Timbre TTS
 */
function cleanTextForSpeech(text, language = 'kn-IN') {
  if (!text) return '';

  let cleaned = String(text);

  // Replace currency symbol ₹ with natural spoken words
  if (language.startsWith('kn')) {
    cleaned = cleaned.replace(/₹\s*([0-9]+)/g, '$1 ರೂಪಾಯಿ');
  } else if (language.startsWith('hi')) {
    cleaned = cleaned.replace(/₹\s*([0-9]+)/g, '$1 रुपये');
  } else {
    cleaned = cleaned.replace(/₹\s*([0-9]+)/g, '$1 rupees');
  }

  // Remove URLs
  cleaned = cleaned.replace(/https?:\/\/\S+/gi, '');

  // Remove Markdown formatting: bold, italic, headers, backticks, code blocks
  cleaned = cleaned.replace(/```[\s\S]*?```/g, ' ');
  cleaned = cleaned.replace(/`([^`]+)`/g, '$1');
  cleaned = cleaned.replace(/[*_~#]/g, ' ');
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // markdown links

  // Remove bullets and excessive punctuation
  cleaned = cleaned.replace(/^[\s*•\-–—]+/gm, '');

  // Strip emojis (keep Indian script and standard punctuation)
  cleaned = cleaned.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '');

  // Collapse multiple spaces into single space
  cleaned = cleaned.replace(/[ \t]+/g, ' ').trim();

  // Enforce Timbre character limit (~950 chars safe boundary)
  if (cleaned.length > 950) {
    const truncated = cleaned.substring(0, 950);
    // Break at last sentence boundary (. ! ? । \n)
    const lastPunct = Math.max(
      truncated.lastIndexOf('. '),
      truncated.lastIndexOf('! '),
      truncated.lastIndexOf('? '),
      truncated.lastIndexOf('। '),
      truncated.lastIndexOf('\n')
    );
    if (lastPunct > 500) {
      cleaned = truncated.substring(0, lastPunct + 1);
    } else {
      cleaned = truncated;
    }
  }

  return cleaned;
}

/**
 * Resolve the optimal valid voice for the given language and requested voice
 */
function resolveVoice(requestedVoice, language = 'kn-IN', config) {
  const selectedLang = language || 'kn-IN';

  // Check alias first
  if (requestedVoice && VOICE_ALIASES[requestedVoice.toLowerCase()]) {
    return VOICE_ALIASES[requestedVoice.toLowerCase()];
  }

  // Check if requested voice is directly in supported set
  if (requestedVoice && SUPPORTED_TIMBRE_VOICES.has(requestedVoice)) {
    return requestedVoice;
  }

  // Check default voices mapped in config
  if (config.timbre.defaultVoices && config.timbre.defaultVoices[selectedLang]) {
    return config.timbre.defaultVoices[selectedLang];
  }

  // Check language voices array
  const availableVoices = (config.timbre.voices && config.timbre.voices[selectedLang]) || [];
  if (availableVoices.length > 0 && availableVoices[0].id) {
    return availableVoices[0].id;
  }

  // Safe global fallback
  return config.timbre.defaultVoice || 'Chitra';
}

/**
 * Synthesize speech from text using Gnani Timbre TTS API
 * @param {string} text - Text to synthesize
 * @param {string} language - Language code ('kn-IN', 'hi-IN', 'en-IN', 'ta-IN', 'te-IN')
 * @param {string} voice - Voice persona ID (e.g., 'Chitra', 'Nalini', 'Tanvi')
 * @param {object} options - Audio options (speed, container, sampleRate)
 * @returns {Promise<object>} - { audioBase64, mimeType, format, voice, language, mode, provider }
 */
const synthesizeSpeech = async (text, language = 'kn-IN', voice = null, options = {}) => {
  const config = getGnaniConfig();
  const selectedLang = language || 'kn-IN';
  const resolvedVoice = resolveVoice(voice, selectedLang, config);

  // If live mode is not configured, run in clearly identified DEMO mode
  if (config.modes.timbre === 'DEMO') {
    return generateDemoTimbreAudio(text, selectedLang, resolvedVoice, options);
  }

  // LIVE MODE: Call official Gnani Timbre API on Vachana platform
  try {
    const url = `${config.timbre.baseUrl}${config.timbre.endpoint}`;
    const cleanText = cleanTextForSpeech(text, selectedLang);

    if (!cleanText || cleanText.trim() === '') {
      throw new Error('Text to synthesize is empty after formatting.');
    }

    const payload = {
      text: cleanText,
      voice: resolvedVoice,
      model: config.timbre.model || 'timbre-v2.5',
      language: selectedLang,
      speed: Number(options.speed) || 1.0,
      audio_config: {
        encoding: 'linear_pcm',
        container: options.container || 'wav',
        num_channels: 1,
        sample_rate: options.sampleRate || 24000,
        sample_width: 2,
      },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key-ID': config.timbre.apiKey,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(25000), // 25s timeout
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn(`[Gnani Timbre TTS Warning]: ${response.status} - ${errText}`);
      throw new Error(`Gnani Timbre API failed (${response.status}): ${errText}`);
    }

    const contentType = response.headers.get('content-type') || '';
    let audioBase64 = '';
    let mimeType = 'audio/wav';

    if (contentType.includes('application/json')) {
      const json = await response.json();
      audioBase64 = json.audio_content || json.audio || json.data || '';
      if (!audioBase64 && json.success === false) {
        throw new Error(`Gnani Timbre API returned error: ${json.message || 'Unknown error'}`);
      }
    } else {
      // Binary audio stream (audio/wav)
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      audioBase64 = buffer.toString('base64');
      if (contentType.includes('audio')) {
        mimeType = contentType.split(';')[0].trim();
      }
    }

    if (!audioBase64 || audioBase64.length < 50) {
      throw new Error('Gnani Timbre API returned an empty audio stream.');
    }

    return {
      audioBase64,
      mimeType: mimeType || 'audio/wav',
      format: 'wav',
      language: selectedLang,
      voice: resolvedVoice,
      mode: 'LIVE',
      model: config.timbre.model || 'timbre-v2.5',
      provider: 'Gnani Timbre v2.5 (Live Vachana API)',
      textLength: cleanText.length,
      byteSize: Buffer.from(audioBase64, 'base64').length,
    };
  } catch (error) {
    console.warn('[Gnani Timbre TTS Warning]: Remote API failed, using synthetic audio fallback:', error.message);
    const fallback = generateDemoTimbreAudio(text, selectedLang, resolvedVoice, options);
    fallback.warning = `Live Timbre API failed (${error.message}). Demo audio fallback engaged.`;
    return fallback;
  }
};

/**
 * Generate synthetic audio chime wav for Demo Mode
 * Builds a valid PCM WAV buffer so browser audio players do not error out when credentials are absent.
 */
function generateDemoTimbreAudio(text, language, voice, options) {
  const sampleRate = 16000;
  const durationSec = 1.0;
  const numSamples = Math.floor(sampleRate * durationSec);
  const dataByteLength = numSamples * 2; // 16-bit mono

  const buffer = Buffer.alloc(44 + dataByteLength);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataByteLength, 4);
  buffer.write('WAVE', 8);

  // Sub-chunk 1 (fmt )
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // subchunk 1 size
  buffer.writeUInt16LE(1, 20);  // PCM format
  buffer.writeUInt16LE(1, 22);  // 1 channel (mono)
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28); // byte rate
  buffer.writeUInt16LE(2, 32);  // block align
  buffer.writeUInt16LE(16, 34); // bits per sample

  // Sub-chunk 2 (data)
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataByteLength, 40);

  // Soft chime tone (sine wave 523Hz + 659Hz with exponential decay)
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const decay = Math.exp(-3 * t);
    const sample = Math.sin(2 * Math.PI * 523.25 * t) * 0.4 + Math.sin(2 * Math.PI * 659.25 * t) * 0.3;
    const intSample = Math.max(-32768, Math.min(32767, Math.floor(sample * decay * 32767)));
    buffer.writeInt16LE(intSample, 44 + i * 2);
  }

  return {
    audioBase64: buffer.toString('base64'),
    mimeType: 'audio/wav',
    format: 'wav',
    language,
    voice,
    mode: 'DEMO',
    model: 'timbre-v2.5',
    provider: 'Gnani Timbre v2.5 (Mock Demo Mode)',
    isMock: true,
    byteSize: buffer.length,
    notice: 'DEMO MODE: Simulated audio. Live credentials required for genuine speech synthesis.'
  };
}

module.exports = { synthesizeSpeech };
