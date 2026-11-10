/**
 * Frontend Voice Assistant Service Client
 * Handles audio recording with MediaRecorder, Web Speech fallback, and API calls to:
 * - Gnani Prisma v2.5 STT
 * - Gnani Evon v3.3 30B Reasoning LLM
 * - Gnani Timbre v2.5 TTS
 */

import API from './api';

export const VoiceAssistantService = {
  // Get AI status and loaded models
  async getStatus() {
    const res = await API.get('/ai/status');
    return res.data;
  },

  // Transcribe audio blob via Gnani Prisma STT
  async transcribeAudio(audioBlob, language = 'indic-auto') {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'microphone_recording.webm');
    formData.append('language', language);

    const res = await API.post('/ai/transcribe', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  // Send text query for Evon 30B reasoning & action execution
  async sendChat({ query, language = 'kn-IN', voice, sessionId, role, skipTTS = false }) {
    const res = await API.post('/ai/chat', {
      query,
      language,
      voice,
      sessionId,
      role,
      skipTTS,
    });
    return res.data;
  },

  // Synthesize speech via Gnani Timbre TTS
  async synthesizeSpeech({ text, language = 'kn-IN', voice }) {
    const res = await API.post('/ai/speak', {
      text,
      language,
      voice,
    });
    return res.data;
  },

  // End-to-end voice conversation turn
  async sendVoiceTurn({ audioBlob, language = 'kn-IN', voice, sessionId, role }) {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'microphone_recording.webm');
    formData.append('language', language);
    if (voice) formData.append('voice', voice);
    if (sessionId) formData.append('sessionId', sessionId);
    if (role) formData.append('role', role);

    const res = await API.post('/ai/voice-conversation', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  // Clear conversation session
  async clearHistory(sessionId) {
    const res = await API.post('/ai/clear-history', { sessionId });
    return res.data;
  },
};

/**
 * Audio Recorder Helper using Web MediaRecorder API
 */
export class AudioRecorder {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.stream = null;
    this.audioContext = null;
    this.analyser = null;
    this.dataArray = null;
    this.source = null;
  }

  // Check if browser supports audio recording
  static isSupported() {
    return Boolean(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
  }

  // Request microphone permission and prepare stream
  async startRecording(onVolumeLevel = null) {
    if (!AudioRecorder.isSupported()) {
      throw new Error('Your browser does not support microphone audio recording.');
    }

    this.audioChunks = [];
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        sampleRate: 16000,
        echoCancellation: true,
        noiseSuppression: true,
      },
    });

    // Determine optimal mime type supported by browser
    let mimeType = 'audio/webm;codecs=opus';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      if (MediaRecorder.isTypeSupported('audio/webm')) {
        mimeType = 'audio/webm';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
        mimeType = 'audio/ogg';
      } else {
        mimeType = '';
      }
    }

    const options = mimeType ? { mimeType } : undefined;
    this.mediaRecorder = new MediaRecorder(this.stream, options);

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };

    // Setup AudioContext for real-time waveform volume visualization
    if (onVolumeLevel && window.AudioContext) {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.audioContext = new AudioCtx();
        this.source = this.audioContext.createMediaStreamSource(this.stream);
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 64;
        this.source.connect(this.analyser);
        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

        const checkVolume = () => {
          if (!this.mediaRecorder || this.mediaRecorder.state !== 'recording') return;
          this.analyser.getByteFrequencyData(this.dataArray);
          let sum = 0;
          for (let i = 0; i < this.dataArray.length; i++) {
            sum += this.dataArray[i];
          }
          const avg = sum / this.dataArray.length;
          onVolumeLevel(Math.min(100, Math.round((avg / 128) * 100)));
          requestAnimationFrame(checkVolume);
        };
        requestAnimationFrame(checkVolume);
      } catch (e) {
        console.warn('AudioContext volume meter skipped:', e);
      }
    }

    this.mediaRecorder.start(250); // collect data every 250ms
  }

  // Stop recording and return audio blob
  stopRecording() {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        return reject(new Error('Recorder is not initialized.'));
      }

      this.mediaRecorder.onstop = () => {
        const mimeType = this.mediaRecorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(this.audioChunks, { type: mimeType });

        // Clean up tracks
        if (this.stream) {
          this.stream.getTracks().forEach((track) => track.stop());
        }
        if (this.audioContext && this.audioContext.state !== 'closed') {
          this.audioContext.close().catch(() => {});
        }

        resolve({ audioBlob, mimeType });
      };

      if (this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      }
    });
  }

  cancelRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
    }
    this.audioChunks = [];
  }
}

/**
 * Web Speech API synthesis fallback for demo mode or offline environments
 */
export const playBrowserSpeech = (text, language = 'kn-IN') => {
  if (!('speechSynthesis' in window)) return false;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
    return true;
  } catch (e) {
    console.warn('Web Speech API failed:', e);
    return false;
  }
};
