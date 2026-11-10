/**
 * Voice Assistant API Routes
 * Mounts endpoints for Gnani Prisma STT, Evon 30B reasoning, and Timbre TTS.
 */

const express = require('express');
const router = express.Router();
const {
  transcribeVoice,
  chatWithAssistant,
  synthesizeVoice,
  voiceConversationTurn,
  getAIStatus,
  clearHistory,
} = require('../controllers/voiceAssistantController');
const {
  uploadAudio,
  aiRateLimiter,
  optionalAuth,
} = require('../middleware/validateVoiceRequest');

// Public status check
router.get('/status', getAIStatus);

// Audio transcription (Gnani Prisma STT)
router.post('/transcribe', aiRateLimiter, optionalAuth, uploadAudio.single('audio'), transcribeVoice);

// Text query + Evon reasoning + MongoDB intent execution + Timbre TTS
router.post('/chat', aiRateLimiter, optionalAuth, chatWithAssistant);

// Text to speech (Gnani Timbre TTS)
router.post('/speak', aiRateLimiter, synthesizeVoice);

// End-to-end voice turn
router.post('/voice-conversation', aiRateLimiter, optionalAuth, uploadAudio.single('audio'), voiceConversationTurn);

// Clear conversation context
router.post('/clear-history', optionalAuth, clearHistory);

module.exports = router;
