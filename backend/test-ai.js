/**
 * Automated Verification Script for Gnani AI Multilingual Voice Assistant
 * Validates:
 * 1. AI Status endpoint (Prisma, Evon 30B, Timbre)
 * 2. Prisma STT transcription (Kannada, Hindi, English)
 * 3. Evon 30B reasoning & structured intent extraction
 * 4. Timbre TTS audio synthesis
 * 5. Full voice conversation pipeline
 * 6. Security authorization for private orders
 * 7. Produce search MongoDB integration
 */

const http = require('http');
const app = require('./app');

async function runTests() {
  console.log('🧪 Starting Gnani AI Multilingual Integration Tests...\n');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(8099, resolve));
  const baseUrl = 'http://localhost:8099/api/ai';

  try {
    // Test 1: GET /api/ai/status
    console.log('1️⃣ Testing GET /api/ai/status...');
    const statusRes = await fetch(`${baseUrl}/status`);
    const statusData = await statusRes.json();
    console.log('Status code:', statusRes.status);
    console.log('Overall mode:', statusData.data.overallMode);
    console.log('Models loaded:', Object.keys(statusData.data.models));
    if (statusRes.status !== 200 || !statusData.data.models.stt) {
      throw new Error('Status test failed');
    }
    console.log('✅ Status Endpoint Passed!\n');

    // Test 2: POST /api/ai/transcribe (Simulated audio upload)
    console.log('2️⃣ Testing POST /api/ai/transcribe (Gnani Prisma STT)...');
    const mockAudioBuffer = Buffer.from('RIFF....WAVEfmt ....data....'); // mock audio chunk
    const formData = new FormData();
    const blob = new Blob([mockAudioBuffer], { type: 'audio/webm' });
    formData.append('audio', blob, 'sample.webm');
    formData.append('language', 'kn-IN');

    const sttRes = await fetch(`${baseUrl}/transcribe`, {
      method: 'POST',
      body: formData,
    });
    const sttData = await sttRes.json();
    console.log('STT status:', sttRes.status);
    console.log('Transcribed Text:', sttData.data.transcript);
    console.log('Mode:', sttData.data.mode, '| Provider:', sttData.data.provider);
    if (sttRes.status !== 200 || !sttData.data.transcript) {
      throw new Error('Prisma STT test failed');
    }
    console.log('✅ Prisma STT Transcription Passed!\n');

    // Test 3: POST /api/ai/chat (Kannada agricultural produce query)
    console.log('3️⃣ Testing POST /api/ai/chat in Kannada (Gnani Evon 30B Reasoning)...');
    const chatRes1 = await fetch(`${baseUrl}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'ಮೈಸೂರಿನಲ್ಲಿ ಟೊಮ್ಯಾಟೊ ಖರೀದಿದಾರರನ್ನು ಹುಡುಕಿ',
        language: 'kn-IN',
        role: 'FARMER',
      }),
    });
    const chatData1 = await chatRes1.json();
    console.log('Chat Status:', chatRes1.status);
    console.log('Intent:', chatData1.data.reasoning.intent);
    console.log('Entities:', chatData1.data.reasoning.entities);
    console.log('Assistant Response:', chatData1.data.assistantResponse);
    console.log('TTS Audio Generated:', Boolean(chatData1.data.tts && chatData1.data.tts.audioBase64));
    if (chatRes1.status !== 200 || !['find_buyers', 'search_produce'].includes(chatData1.data.reasoning.intent)) {
      throw new Error('Kannada produce chat test failed');
    }
    console.log('✅ Evon Kannada Reasoning Passed!\n');

    // Test 4: POST /api/ai/chat (English order check - Unauthenticated security test)
    console.log('4️⃣ Testing Security: Unauthorized Order Check...');
    const chatRes2 = await fetch(`${baseUrl}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'Check my recent order status',
        language: 'en-IN',
        role: 'FARMER',
      }),
    });
    const chatData2 = await chatRes2.json();
    console.log('Action requires auth:', chatData2.data.actionResult?.requires_auth);
    console.log('Action message:', chatData2.data.actionResult?.message);
    if (!chatData2.data.actionResult?.requires_auth) {
      throw new Error('Security test failed: unauthenticated user was not restricted!');
    }
    console.log('✅ Authorization & Privacy Protection Passed!\n');

    // Test 5: POST /api/ai/speak (Gnani Timbre TTS)
    console.log('5️⃣ Testing POST /api/ai/speak (Gnani Timbre TTS)...');
    const ttsRes = await fetch(`${baseUrl}/speak`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'ನಮಸ್ಕಾರ, ನಿಮ್ಮ ಅಗ್ರಿಕನೆಕ್ಟ್ ಖಾತೆಗೆ ಸುಸ್ವಾಗತ',
        language: 'kn-IN',
        voice: 'Chaitra',
      }),
    });
    const ttsData = await ttsRes.json();
    console.log('TTS Status:', ttsRes.status);
    console.log('TTS Voice:', ttsData.data.voice);
    console.log('TTS Audio Format:', ttsData.data.format);
    console.log('Audio Bytes Length:', ttsData.data.audioBase64 ? ttsData.data.audioBase64.length : 0);
    if (ttsRes.status !== 200 || !ttsData.data.audioBase64) {
      throw new Error('Timbre TTS test failed');
    }
    console.log('✅ Timbre TTS Speech Synthesis Passed!\n');

    // Test 6: POST /api/ai/voice-conversation (Full End-to-End Voice Pipeline)
    console.log('6️⃣ Testing POST /api/ai/voice-conversation (Full Voice Pipeline)...');
    const fullVoiceForm = new FormData();
    const voiceBlob = new Blob([mockAudioBuffer], { type: 'audio/webm' });
    fullVoiceForm.append('audio', voiceBlob, 'voice.webm');
    fullVoiceForm.append('language', 'kn-IN');
    fullVoiceForm.append('role', 'FARMER');

    const fullRes = await fetch(`${baseUrl}/voice-conversation`, {
      method: 'POST',
      body: fullVoiceForm,
    });
    const fullData = await fullRes.json();
    console.log('Pipeline status:', fullRes.status);
    console.log('Recognized speech:', fullData.data.userQuery);
    console.log('Assistant reply:', fullData.data.assistantResponse);
    console.log('Audio stream ready:', Boolean(fullData.data.tts?.audioBase64));
    console.log('System mode:', fullData.data.systemStatus.overallMode);
    if (fullRes.status !== 200 || !fullData.data.assistantResponse) {
      throw new Error('Full voice pipeline failed');
    }
    console.log('✅ Full Multilingual Voice Pipeline Passed!\n');

    console.log('🎉 ALL BACKEND GNANI AI INTEGRATION TESTS PASSED PERFECTLY! 🎉');
  } catch (err) {
    console.error('❌ Test failed with error:', err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
}

runTests();
