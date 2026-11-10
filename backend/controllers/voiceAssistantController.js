/**
 * Voice Assistant Controller
 * Provides endpoints for Prisma STT, Evon 30B reasoning, and Timbre TTS.
 */

const { transcribeAudio } = require('../ai/gnani/prisma');
const { synthesizeSpeech } = require('../ai/gnani/timbre');
const {
  processVoiceConversation,
  processTextConversation,
} = require('../ai/services/voiceAssistantService');
const conversationService = require('../ai/services/conversationService');
const { getGnaniConfig } = require('../ai/gnani/gnaniConfig');

// @desc    Transcribe uploaded voice recording (Gnani Prisma STT)
// @route   POST /api/ai/transcribe
// @access  Public / Optional Auth
const transcribeVoice = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        message: 'No audio file provided. Please record audio from your microphone.',
      });
    }

    const language = req.body.language || 'indic-auto';
    const result = await transcribeAudio(req.file.buffer, req.file.mimetype, language);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Transcription controller error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Speech transcription failed',
    });
  }
};

// @desc    Process text chat with AI assistant (Gnani Evon Reasoning + Action + Timbre TTS)
// @route   POST /api/ai/chat
// @access  Public / Optional Auth
const chatWithAssistant = async (req, res) => {
  try {
    const { query, language = 'kn-IN', voice, sessionId, skipTTS = false } = req.body;

    if (!query || query.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Please provide a non-empty text message.',
      });
    }

    const result = await processTextConversation({
      queryText: query.trim(),
      language,
      voice,
      sessionId,
      user: req.user || null,
      role: req.user ? req.user.role : req.body.role || 'FARMER',
      skipTTS,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Chat controller error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'AI reasoning failed',
    });
  }
};

// @desc    Synthesize speech audio from text (Gnani Timbre TTS)
// @route   POST /api/ai/speak
// @access  Public
const synthesizeVoice = async (req, res) => {
  try {
    const { text, language = 'kn-IN', voice } = req.body;

    if (!text || text.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Text is required for speech synthesis.',
      });
    }

    const result = await synthesizeSpeech(text, language, voice, { speed: req.body.speed });

    if (req.query.stream === 'true' || req.headers.accept?.includes('audio/')) {
      const audioBuffer = Buffer.from(result.audioBase64, 'base64');
      res.setHeader('Content-Type', result.mimeType || 'audio/wav');
      res.setHeader('Content-Length', audioBuffer.length);
      res.setHeader('Cache-Control', 'no-cache');
      return res.send(audioBuffer);
    }

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Speech synthesis controller error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Speech synthesis failed',
    });
  }
};

// @desc    Complete voice turn: Audio In -> STT -> Evon -> Action -> TTS -> Audio & Text Out
// @route   POST /api/ai/voice-conversation
// @access  Public / Optional Auth
const voiceConversationTurn = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        message: 'Audio recording is required for voice conversation turn.',
      });
    }

    const { language = 'kn-IN', voice, sessionId } = req.body;

    const result = await processVoiceConversation({
      audioBuffer: req.file.buffer,
      mimeType: req.file.mimetype,
      language,
      voice,
      sessionId,
      user: req.user || null,
      role: req.user ? req.user.role : req.body.role || 'FARMER',
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Voice conversation turn controller error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Voice pipeline execution failed',
    });
  }
};

// @desc    Get AI integration status and available Indian language models
// @route   GET /api/ai/status
// @access  Public
const getAIStatus = (req, res) => {
  const config = getGnaniConfig();

  res.status(200).json({
    success: true,
    data: {
      overallMode: config.gemini?.isConfigured ? 'LIVE (Gemini)' : (config.isDemoMode ? 'DEMO' : 'LIVE'),
      models: {
        gemini: {
          name: 'Google Gemini AI',
          modelId: config.gemini?.model || 'gemini-2.5-flash',
          mode: config.modes?.gemini || 'DISABLED',
        },
        stt: {
          name: 'Gnani Prisma v2.5',
          mode: config.modes.prisma,
          languages: config.prisma.supportedLanguages,
        },
        llm: {
          name: config.gemini?.isConfigured ? 'Google Gemini 2.5 Flash' : 'Gnani Evon v3.3 (30B A3B)',
          modelId: config.gemini?.isConfigured ? config.gemini.model : config.evon.model,
          mode: config.modes.evon,
          architecture: config.gemini?.isConfigured ? 'Gemini 2.5 Multimodal Reasoning Engine' : 'Hybrid Mamba-MoE (30B total, 3.5B active)',
        },
        tts: {
          name: 'Gnani Timbre v2.5',
          mode: config.modes.timbre,
          voices: config.timbre.voices,
        },
      },
      notice: config.gemini?.isConfigured
        ? 'AgriConnect AI Agent is operating in LIVE MODE powered by Google Gemini.'
        : (config.isDemoMode
          ? 'AgriConnect is operating in DEMO MODE with simulated AI adapters.'
          : 'AgriConnect is operating in LIVE MODE connected directly to AI models.'),
    },
  });
};

// @desc    Clear conversation history
// @route   POST /api/ai/clear-history
// @access  Public / Optional Auth
const clearHistory = (req, res) => {
  const { sessionId } = req.body;
  const userId = req.user ? req.user._id.toString() : null;
  conversationService.clearSession(sessionId, userId);

  res.status(200).json({
    success: true,
    message: 'Conversation session cleared successfully.',
  });
};

module.exports = {
  transcribeVoice,
  chatWithAssistant,
  synthesizeVoice,
  voiceConversationTurn,
  getAIStatus,
  clearHistory,
};
