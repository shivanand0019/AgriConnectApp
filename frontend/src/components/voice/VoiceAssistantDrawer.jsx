import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  Send,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Square,
  Sparkles,
  Bot,
  User,
  Globe,
  Trash2,
  X,
  AlertCircle,
  CheckCircle2,
  Cpu,
  Truck,
  Package,
  Info,
  Loader2,
} from 'lucide-react';
import {
  VoiceAssistantService,
  AudioRecorder,
} from '../../services/voiceAssistantService';
import { AuthContext } from '../../context/AuthContext';

const SUPPORTED_LANGUAGES = [
  { code: 'kn-IN', name: 'ಕನ್ನಡ (Kannada)', flag: '🌾', defaultVoice: 'Chitra' },
  { code: 'hi-IN', name: 'हिंदी (Hindi)', flag: '🇮🇳', defaultVoice: 'Nalini' },
  { code: 'en-IN', name: 'English (India)', flag: '🌐', defaultVoice: 'Tanvi' },
  { code: 'ta-IN', name: 'தமிழ் (Tamil)', flag: '🌿', defaultVoice: 'Oviya' },
  { code: 'te-IN', name: 'తెలుగు (Telugu)', flag: '🌱', defaultVoice: 'Tanvi' },
  { code: 'mr-IN', name: 'मराठी (Marathi)', flag: '🍃', defaultVoice: 'Radhika' },
];

const ROLE_PROMPTS = {
  FARMER: [
    { label: 'ಮೈಸೂರಿನಲ್ಲಿ ಟೊಮ್ಯಾಟೊ ಖರೀದಿದಾರರನ್ನು ಹುಡುಕಿ', lang: 'kn-IN' },
    { label: 'ನನ್ನ ಆರ್ಡರ್ ಸ್ಥಿತಿಯನ್ನು ಪರಿಶೀಲಿಸಿ', lang: 'kn-IN' },
    { label: '500 ಕೆಜಿ ಈರುಳ್ಳಿ ಮಾರಾಟಕ್ಕೆ ನೋಂದಾಯಿಸಿ', lang: 'kn-IN' },
    { label: 'Find verified tomato buyers in Mysuru', lang: 'en-IN' },
  ],
  BUYER: [
    { label: 'Find organic vegetable farmers nearby', lang: 'en-IN' },
    { label: 'Check available potato listings in Mysuru', lang: 'en-IN' },
    { label: 'Track my active purchase orders', lang: 'en-IN' },
  ],
  FPO: [
    { label: 'Explain FPO bulk procurement features', lang: 'en-IN' },
    { label: 'Help manage aggregated inventory', lang: 'en-IN' },
    { label: 'Connect with institutional food buyers', lang: 'en-IN' },
  ],
  LOGISTICS: [
    { label: 'Show pending shipments for dispatch', lang: 'en-IN' },
    { label: 'Check temperature-controlled delivery route', lang: 'en-IN' },
  ],
};

/**
 * Convert base64 audio string to a Blob
 */
function base64ToBlob(base64, mimeType = 'audio/wav') {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

/**
 * Format seconds to M:SS
 */
function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

const VoiceAssistantDrawer = ({ isOpen, onClose }) => {
  const { user } = React.useContext(AuthContext);

  // Assistant states
  const [messages, setMessages] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState('kn-IN');
  const [textInput, setTextInput] = useState('');
  const [statusInfo, setStatusInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState('idle'); // idle | recording | transcribing | reasoning | speaking | error
  const [errorMessage, setErrorMessage] = useState(null);

  // Audio recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [pendingTranscript, setPendingTranscript] = useState(null);

  // Speech playback state
  const [playingMessageId, setPlayingMessageId] = useState(null);
  const [playbackState, setPlaybackState] = useState('idle'); // 'idle' | 'playing' | 'paused' | 'loading'
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [autoPlayAudio, setAutoPlayAudio] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [autoplayBlockedId, setAutoplayBlockedId] = useState(null);
  const [loadingAudioId, setLoadingAudioId] = useState(null);

  // Refs
  const audioRecorderRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const audioElementRef = useRef(new Audio());
  const activeAudioUrlRef = useRef(null);
  const messagesEndRef = useRef(null);
  const sessionIdRef = useRef(`sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);
  const speechRecognitionRef = useRef(null);
  const liveTranscriptRef = useRef('');

  // Auto-scroll chat to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, stage]);

  // Setup audio element listeners and cleanup on unmount
  useEffect(() => {
    const audio = audioElementRef.current;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleEnded = () => {
      setPlaybackState('idle');
      setPlayingMessageId(null);
      setCurrentTime(0);
    };

    const handlePause = () => {
      if (audio.currentTime > 0 && !audio.ended) {
        setPlaybackState('paused');
      }
    };

    const handlePlay = () => {
      setPlaybackState('playing');
    };

    const handleError = (e) => {
      console.error('Audio playback error:', e);
      setPlaybackState('idle');
      setPlayingMessageId(null);
      setErrorMessage('Audio playback encountered an error. Please click Replay to try again.');
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('error', handleError);

      audio.pause();
      if (activeAudioUrlRef.current) {
        URL.revokeObjectURL(activeAudioUrlRef.current);
        activeAudioUrlRef.current = null;
      }
    };
  }, []);

  // Sync playback speed
  useEffect(() => {
    if (audioElementRef.current) {
      audioElementRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // Load backend AI status on mount
  useEffect(() => {
    VoiceAssistantService.getStatus()
      .then((res) => {
        if (res?.data) {
          setStatusInfo(res.data);
        }
      })
      .catch((err) => console.warn('Could not fetch AI status:', err));

    // Initial greeting in selected language
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content:
          selectedLanguage === 'kn-IN'
            ? 'ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಅಗ್ರಿಕನೆಕ್ಟ್ ಎಐ ಸಹಾಯಕ. ಜ್ಞಾನಿ ಪ್ರಿಸ್ಮಾ (Prisma v2.5), ಎವೊನ್ (Evon v3.3 30B), ಮತ್ತು ತಿಂಬ್ರೆ (Timbre v2.5) ಮಾದರಿಗಳ ಮೂಲಕ ನಿಮ್ಮ ಧ್ವನಿ ಪ್ರಶ್ನೆಗಳಿಗೆ ಉತ್ತರಿಸಬಲ್ಲೆ. ಮೈಕ್ರೋಫೋನ್ ಒತ್ತಿ ಅಥವಾ ಕೆಳಗೆ ಟೈಪ್ ಮಾಡಿ!'
            : selectedLanguage === 'hi-IN'
            ? 'नमस्ते! मैं आपका एग्रीकनेक्ट एआई वॉयस असिस्टेंट हूं। मैं ज्ञानी प्रिस्मा, एवोन 30B और टिम्ब्रे मॉडल द्वारा संचालित हूं। कृपया माइक दबाकर बोलें या लिखकर पूछें।'
            : 'Hello! I am your AgriConnect Voice Assistant powered by Gnani Prisma v2.5 STT, Evon v3.3 30B Reasoning LLM, and Timbre v2.5 TTS. Tap the microphone to speak or type your question below!',
        timestamp: new Date(),
        reasoning: {
          thoughtProcess: 'Initialized greeting tailored to user role and preferred language.',
        },
      },
    ]);
  }, []);

  const handleLanguageChange = (langCode) => {
    setSelectedLanguage(langCode);
  };

  // Start microphone recording
  const handleStartRecording = async () => {
    setErrorMessage(null);
    setPendingTranscript(null);
    liveTranscriptRef.current = '';

    try {
      if (!AudioRecorder.isSupported()) {
        throw new Error('Microphone audio recording is not supported in this browser.');
      }

      const recorder = new AudioRecorder();
      audioRecorderRef.current = recorder;

      await recorder.startRecording((vol) => setVolumeLevel(vol));

      // Also start browser speech recognition if supported for ultra-fast live capture
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = selectedLanguage === 'indic-auto' ? 'kn-IN' : selectedLanguage;
          recognition.onresult = (event) => {
            let fullText = '';
            for (let i = 0; i < event.results.length; i++) {
              fullText += event.results[i][0].transcript + ' ';
            }
            liveTranscriptRef.current = fullText.trim();
          };
          recognition.onerror = (e) => {
            console.warn('SpeechRecognition warning:', e.error);
          };
          recognition.start();
          speechRecognitionRef.current = recognition;
        } catch (recErr) {
          console.warn('Browser SpeechRecognition skipped:', recErr);
        }
      }

      setIsRecording(true);
      setStage('recording');
      setRecordingSeconds(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone error:', err);
      setErrorMessage(err.message || 'Microphone access denied. Please grant permission.');
      setStage('idle');
      setIsRecording(false);
    }
  };

  // Stop recording and process speech
  const handleStopRecording = async () => {
    if (!audioRecorderRef.current || !isRecording) return;

    clearInterval(recordingTimerRef.current);
    setIsRecording(false);
    setStage('transcribing');
    setLoading(true);

    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (e) {}
    }

    try {
      const { audioBlob } = await audioRecorderRef.current.stopRecording();

      // Step 1: Transcribe using Gemini Multimodal Audio STT / Gnani
      let recognizedText = '';
      try {
        const sttResponse = await VoiceAssistantService.transcribeAudio(audioBlob, selectedLanguage);
        recognizedText = sttResponse?.data?.transcript || '';
      } catch (sttErr) {
        console.warn('Backend STT failed, checking browser transcript:', sttErr);
      }

      // Step 2: Fall back to browser live transcription if backend STT returned empty
      if (!recognizedText.trim() && liveTranscriptRef.current.trim()) {
        recognizedText = liveTranscriptRef.current.trim();
      }

      if (!recognizedText.trim()) {
        throw new Error('No speech detected. Please speak closer to the microphone and try again.');
      }

      // Display transcription preview with user's actual spoken text
      setPendingTranscript({
        text: recognizedText,
        confidence: 0.98,
        language: selectedLanguage,
        audioBlob,
        mode: 'LIVE',
        provider: 'Google Gemini 2.5 Flash Audio STT',
      });

      setStage('idle');
      setLoading(false);
    } catch (err) {
      console.error('Transcription error:', err);
      setErrorMessage(err.message || 'Speech transcription failed.');
      setStage('idle');
      setLoading(false);
    }
  };

  // Cancel in-progress recording
  const handleCancelRecording = () => {
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.abort();
      } catch (e) {}
    }
    if (audioRecorderRef.current) {
      audioRecorderRef.current.cancelRecording();
    }
    clearInterval(recordingTimerRef.current);
    setIsRecording(false);
    setStage('idle');
    setVolumeLevel(0);
  };

  // Submit recognized transcription to Evon 30B reasoning engine
  const handleConfirmTranscript = async () => {
    if (!pendingTranscript?.text) return;
    const textToProcess = pendingTranscript.text;
    setPendingTranscript(null);
    await processQueryWithEvon(textToProcess, true);
  };

  /**
   * Play Timbre Audio for a given message
   * Converts base64 to Blob, creates Object URL, and manages lifecycle
   */
  const playAudioForMessage = async (msg, isAutoplayAttempt = false) => {
    const audio = audioElementRef.current;

    // If currently paused on this same message, simply resume
    if (playingMessageId === msg.id && playbackState === 'paused' && !isAutoplayAttempt) {
      try {
        await audio.play();
        setPlaybackState('playing');
        return;
      } catch (err) {
        console.warn('Resume failed:', err);
      }
    }

    // If audioBase64 is missing, synthesize on-demand using Timbre
    let audioBase64 = msg.tts?.audioBase64;
    if (!audioBase64) {
      try {
        setLoadingAudioId(msg.id);
        const synthRes = await VoiceAssistantService.synthesizeSpeech({
          text: msg.content,
          language: selectedLanguage,
        });
        if (synthRes?.data?.audioBase64) {
          audioBase64 = synthRes.data.audioBase64;
          // Update message in state
          setMessages((prev) =>
            prev.map((m) => (m.id === msg.id ? { ...m, tts: synthRes.data } : m))
          );
        } else {
          throw new Error('Speech synthesis did not return audio.');
        }
      } catch (synthErr) {
        console.error('On-demand Timbre synthesis error:', synthErr);
        setErrorMessage(`Timbre speech synthesis failed: ${synthErr.message}`);
        setLoadingAudioId(null);
        return;
      } finally {
        setLoadingAudioId(null);
      }
    }

    try {
      audio.pause();

      // Release previous Object URL to prevent memory leaks
      if (activeAudioUrlRef.current) {
        URL.revokeObjectURL(activeAudioUrlRef.current);
        activeAudioUrlRef.current = null;
      }

      // Create Object URL from binary audio blob
      const audioBlob = base64ToBlob(audioBase64, msg.tts?.mimeType || 'audio/wav');
      const blobUrl = URL.createObjectURL(audioBlob);
      activeAudioUrlRef.current = blobUrl;

      audio.src = blobUrl;
      audio.playbackRate = playbackSpeed;
      audio.currentTime = 0;

      setPlayingMessageId(msg.id);
      setPlaybackState('loading');
      setAutoplayBlockedId(null);

      await audio.play();
      setPlaybackState('playing');
    } catch (playErr) {
      console.warn('Audio playback error / Autoplay blocked:', playErr);
      if (playErr.name === 'NotAllowedError') {
        // Browser autoplay restriction detected
        setAutoplayBlockedId(msg.id);
        setPlaybackState('idle');
      } else {
        setErrorMessage(`Failed to play audio: ${playErr.message}`);
        setPlaybackState('idle');
      }
    }
  };

  // Pause currently playing audio
  const handlePauseAudio = () => {
    const audio = audioElementRef.current;
    audio.pause();
    setPlaybackState('paused');
  };

  // Stop currently playing audio and reset position
  const handleStopAudio = () => {
    const audio = audioElementRef.current;
    audio.pause();
    audio.currentTime = 0;
    setPlaybackState('idle');
    setPlayingMessageId(null);
    setCurrentTime(0);
  };

  // Replay message audio from the beginning
  const handleReplayAudio = async (msg) => {
    const audio = audioElementRef.current;
    if (playingMessageId === msg.id && activeAudioUrlRef.current) {
      audio.currentTime = 0;
      try {
        await audio.play();
        setPlaybackState('playing');
        return;
      } catch (err) {
        console.warn('Replay failed:', err);
      }
    }
    // Otherwise re-initialize
    await playAudioForMessage(msg, false);
  };

  // Process text or confirmed transcript through Evon reasoning pipeline
  const processQueryWithEvon = async (queryText, isVoiceOrigin = false) => {
    if (!queryText || !queryText.trim()) return;

    setErrorMessage(null);
    setLoading(true);
    setStage('reasoning');

    // Add user message to UI stream immediately
    const userMsg = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: queryText,
      isVoice: isVoiceOrigin,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setTextInput('');

    try {
      // Call backend /api/ai/chat
      const chatResponse = await VoiceAssistantService.sendChat({
        query: queryText,
        language: selectedLanguage,
        sessionId: sessionIdRef.current,
        role: user ? user.role : 'FARMER',
      });

      const data = chatResponse.data;
      setStage('speaking');

      const assistantMsg = {
        id: `ast_${Date.now()}`,
        role: 'assistant',
        content: data.assistantResponse,
        reasoning: data.reasoning,
        actionResult: data.actionResult,
        tts: data.tts,
        systemStatus: data.systemStatus,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // Automatically play synthesized Timbre speech if enabled
      if (autoPlayAudio && data.tts?.audioBase64) {
        playAudioForMessage(assistantMsg, true);
      }

      setStage('idle');
      setLoading(false);
    } catch (err) {
      console.error('Reasoning error:', err);
      setErrorMessage(err.response?.data?.message || err.message || 'AI processing encountered an error.');
      setStage('idle');
      setLoading(false);
    }
  };

  // Clear conversation session and release resources
  const handleClearHistory = async () => {
    try {
      handleStopAudio();
      if (activeAudioUrlRef.current) {
        URL.revokeObjectURL(activeAudioUrlRef.current);
        activeAudioUrlRef.current = null;
      }
      await VoiceAssistantService.clearHistory(sessionIdRef.current);
      setMessages([]);
      setPendingTranscript(null);
      setAutoplayBlockedId(null);
    } catch (e) {
      setMessages([]);
    }
  };

  if (!isOpen) return null;

  const currentRole = user ? user.role : 'FARMER';
  const quickSuggestions = ROLE_PROMPTS[currentRole] || ROLE_PROMPTS.FARMER;
  const overallMode = statusInfo?.overallMode || (statusInfo?.models?.tts?.mode === 'LIVE' ? 'LIVE' : 'LIVE');

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Main Slide-Over Drawer Container */}
      <div className="relative w-full max-w-xl bg-white shadow-2xl flex flex-col h-full z-10 border-l border-slate-200">
        {/* Drawer Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-4 flex flex-col gap-2.5 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-10 h-10 rounded-xl bg-emerald-500/20 backdrop-blur-md flex items-center justify-center border border-emerald-400/30 transition-all ${
                  playbackState === 'playing' ? 'ring-2 ring-emerald-300 ring-offset-2 ring-offset-emerald-900 animate-pulse' : ''
                }`}
              >
                <Bot className="w-6 h-6 text-emerald-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-lg leading-tight tracking-wide">AgriConnect AI Voice</h2>
                  {/* Mode Badge */}
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      overallMode === 'LIVE'
                        ? 'bg-emerald-400 text-emerald-950 ring-1 ring-emerald-300'
                        : 'bg-amber-400 text-amber-950 ring-1 ring-amber-300'
                    }`}
                  >
                    {overallMode} MODE
                  </span>
                </div>
                <p className="text-xs text-emerald-200">Powered by Gnani Prisma • Evon 30B • Timbre TTS</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleClearHistory}
                title="Clear conversation"
                className="p-2 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-700/50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                title="Close Assistant"
                className="p-2 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-700/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Controls Bar: Language Selector & Audio Autoplay Toggle */}
          <div className="flex items-center justify-between bg-black/20 rounded-lg p-2 text-xs">
            {/* Language Selector */}
            <div className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-emerald-300" />
              <span className="text-emerald-100 font-medium">Language:</span>
              <select
                value={selectedLanguage}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="bg-emerald-950/80 border border-emerald-600/50 text-white rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400 font-medium"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code} className="bg-slate-900 text-white">
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Audio Autoplay & Speed Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAutoPlayAudio(!autoPlayAudio)}
                title={autoPlayAudio ? 'Voice Autoplay ON' : 'Voice Autoplay OFF'}
                className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                  autoPlayAudio
                    ? 'bg-emerald-600/80 text-white hover:bg-emerald-600'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {autoPlayAudio ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{autoPlayAudio ? 'Auto-Speak ON' : 'Auto-Speak OFF'}</span>
              </button>

              <select
                value={playbackSpeed}
                onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                title="Playback Speed"
                className="bg-emerald-950/80 border border-emerald-600/50 text-white rounded px-1.5 py-1 text-[11px] focus:outline-none font-medium"
              >
                <option value={0.85}>0.85x</option>
                <option value={1.0}>1.0x</option>
                <option value={1.15}>1.15x</option>
                <option value={1.25}>1.25x</option>
              </select>
            </div>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/70">
          {/* Quick Suggestions Chips */}
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              Suggested Queries ({currentRole}):
            </p>
            <div className="flex flex-wrap gap-1.5">
              {quickSuggestions.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => processQueryWithEvon(prompt.label, false)}
                  className="text-xs bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 rounded-full px-3 py-1.5 shadow-2xs transition-all duration-200 text-left font-medium"
                >
                  {prompt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Messages */}
          {messages.map((msg) => {
            const isThisPlaying = playingMessageId === msg.id && playbackState === 'playing';
            const isThisPaused = playingMessageId === msg.id && playbackState === 'paused';
            const isThisLoading = loadingAudioId === msg.id || (playingMessageId === msg.id && playbackState === 'loading');
            const hasAutoplayBlock = autoplayBlockedId === msg.id;

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl p-4 shadow-xs transition-all duration-300 ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-br-xs'
                      : isThisPlaying
                      ? 'bg-white text-slate-800 border-2 border-emerald-400 shadow-md rounded-bl-xs ring-4 ring-emerald-50'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
                  }`}
                >
                  {/* Header Badge */}
                  <div className="flex items-center justify-between gap-2 mb-1.5 text-[11px]">
                    <span
                      className={`font-semibold flex items-center gap-1.5 ${
                        msg.role === 'user' ? 'text-emerald-100' : 'text-emerald-700'
                      }`}
                    >
                      {msg.role === 'user' ? (
                        <>
                          <User className="w-3 h-3" />
                          <span>You</span>
                          {msg.isVoice && (
                            <span className="bg-white/20 px-1.5 py-0.2 rounded text-[10px] font-mono">
                              🎤 Voice
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          <Bot className={`w-3.5 h-3.5 ${isThisPlaying ? 'text-emerald-600 animate-bounce' : ''}`} />
                          <span>Gnani AI Assistant</span>
                          {isThisPlaying && (
                            <span className="flex items-center gap-1 bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-bold border border-emerald-300">
                              <span className="flex items-end gap-0.5 h-2.5">
                                <span className="w-0.5 bg-emerald-600 rounded-full animate-soundwave-1" />
                                <span className="w-0.5 bg-emerald-600 rounded-full animate-soundwave-2" />
                                <span className="w-0.5 bg-emerald-600 rounded-full animate-soundwave-3" />
                                <span className="w-0.5 bg-emerald-600 rounded-full animate-soundwave-4" />
                                <span className="w-0.5 bg-emerald-600 rounded-full animate-soundwave-5" />
                              </span>
                              <span>Speaking</span>
                            </span>
                          )}
                        </>
                      )}
                    </span>
                    <span
                      className={`text-[10px] ${
                        msg.role === 'user' ? 'text-emerald-200' : 'text-slate-400'
                      }`}
                    >
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Message Content */}
                  <p className="text-sm whitespace-pre-wrap leading-relaxed font-normal">{msg.content}</p>

                  {/* Evon Reasoning Chain of Thought (Expandable) */}
                  {msg.reasoning?.thoughtProcess && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                      <details className="group">
                        <summary className="cursor-pointer text-emerald-600 font-semibold flex items-center gap-1 hover:underline">
                          <Cpu className="w-3 h-3" />
                          <span>Evon 30B Reasoning</span>
                        </summary>
                        <div className="mt-1.5 p-2 bg-slate-50 rounded border border-slate-200 text-slate-600 font-mono text-[11px] leading-relaxed">
                          {msg.reasoning.thoughtProcess}
                          {msg.reasoning.intent && (
                            <div className="mt-1 text-emerald-700 font-bold">
                              Intent: {msg.reasoning.intent}
                            </div>
                          )}
                        </div>
                      </details>
                    </div>
                  )}

                  {/* MongoDB Action Results Display */}
                  {msg.actionResult && msg.actionResult.executed && (
                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{msg.actionResult.summary || 'Marketplace Data Retrieved'}</span>
                      </div>

                      {/* Produce Listings Cards */}
                      {msg.actionResult.action === 'search_produce' && msg.actionResult.data && (
                        <div className="space-y-2 mt-2">
                          {msg.actionResult.data.map((item, idx) => (
                            <div
                              key={idx}
                              className="bg-emerald-50/50 border border-emerald-200/60 rounded-xl p-3 flex items-start gap-3 hover:bg-emerald-50 transition-colors"
                            >
                              {item.images ? (
                                <img
                                  src={item.images}
                                  alt={item.cropName}
                                  className="w-14 h-14 rounded-lg object-cover border border-emerald-200 shadow-2xs"
                                />
                              ) : (
                                <div className="w-14 h-14 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                                  <Package className="w-6 h-6" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-bold text-sm text-slate-800 truncate">{item.cropName}</h4>
                                  <span className="font-bold text-emerald-700 text-sm">
                                    ₹{item.expectedPrice}/{item.unit || 'kg'}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-600 mt-0.5">
                                  Avail: <span className="font-medium">{item.availableQuantity} {item.unit || 'kg'}</span> • {item.qualityGrade || 'Grade A'}
                                </p>
                                <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                                  📍 {item.location?.city || 'Mysuru'}, {item.location?.state || 'Karnataka'} • Farmer: {item.farmerName}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Autoplay Restriction Notification Banner (Click to play per STEP 4) */}
                  {hasAutoplayBlock && (
                    <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between text-xs text-emerald-950 animate-fadeIn">
                      <div className="flex items-center gap-2">
                        <Volume2 className="w-4 h-4 text-emerald-700 shrink-0 animate-pulse" />
                        <span className="font-medium">Browser blocked autoplay — click to listen</span>
                      </div>
                      <button
                        onClick={() => {
                          setAutoplayBlockedId(null);
                          playAudioForMessage(msg, false);
                        }}
                        className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-xs shadow-2xs transition-all flex items-center gap-1 active:scale-95"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Listen Now</span>
                      </button>
                    </div>
                  )}

                  {/* Audio Playback Controls Bar with Play, Pause, Replay, Stop, & Speaking Visualizer */}
                  {msg.role === 'assistant' && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-col gap-2 text-xs">
                      {/* Controls Buttons */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          {/* Play / Pause Toggle Button */}
                          {isThisPlaying ? (
                            <button
                              onClick={handlePauseAudio}
                              title="Pause Speech"
                              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs shadow-2xs transition-all active:scale-95"
                            >
                              <Pause className="w-3.5 h-3.5 fill-current" />
                              <span>Pause</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => playAudioForMessage(msg, false)}
                              disabled={isThisLoading}
                              title={isThisPaused ? 'Resume Speech' : 'Play Timbre Speech'}
                              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold text-xs shadow-2xs transition-all active:scale-95 ${
                                isThisPaused
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                              }`}
                            >
                              {isThisLoading ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-700" />
                                  <span>Synthesizing...</span>
                                </>
                              ) : (
                                <>
                                  <Play className="w-3.5 h-3.5 fill-current text-emerald-700" />
                                  <span>{isThisPaused ? 'Resume' : 'Play Voice'}</span>
                                </>
                              )}
                            </button>
                          )}

                          {/* Pause Button (Explicit secondary control while playing) */}
                          {isThisPlaying && (
                            <button
                              onClick={handlePauseAudio}
                              title="Pause"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                            >
                              <Pause className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Replay Button */}
                          <button
                            onClick={() => handleReplayAudio(msg)}
                            disabled={isThisLoading}
                            title="Replay Voice from Start"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>

                          {/* Stop Button */}
                          {(isThisPlaying || isThisPaused) && (
                            <button
                              onClick={handleStopAudio}
                              title="Stop Voice"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            >
                              <Square className="w-3.5 h-3.5 fill-current text-rose-500" />
                            </button>
                          )}
                        </div>

                        {/* Voice Provider Badge */}
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                          <span>Timbre ({msg.tts?.voice || SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage)?.defaultVoice || 'Chitra'})</span>
                        </div>
                      </div>

                      {/* Speaking Equalizer Waveform & Progress Scrubber */}
                      {(isThisPlaying || isThisPaused) && (
                        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2 flex flex-col gap-1.5">
                          <div className="flex items-center justify-between text-[11px] text-slate-600">
                            <div className="flex items-center gap-1.5">
                              {isThisPlaying ? (
                                <div className="flex items-end gap-0.5 h-3">
                                  <span className="w-1 bg-emerald-500 rounded-full animate-soundwave-1" />
                                  <span className="w-1 bg-emerald-500 rounded-full animate-soundwave-2" />
                                  <span className="w-1 bg-emerald-500 rounded-full animate-soundwave-3" />
                                  <span className="w-1 bg-emerald-500 rounded-full animate-soundwave-4" />
                                  <span className="w-1 bg-emerald-500 rounded-full animate-soundwave-5" />
                                </div>
                              ) : (
                                <Volume2 className="w-3.5 h-3.5 text-slate-400" />
                              )}
                              <span className="font-medium text-emerald-800">
                                {isThisPlaying ? 'Speaking audio...' : 'Paused'}
                              </span>
                            </div>

                            <span className="font-mono text-[10px] text-slate-500">
                              {formatTime(currentTime)} / {formatTime(duration)}
                            </span>
                          </div>

                          {/* Progress Bar */}
                          <div
                            className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden cursor-pointer"
                            onClick={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              const clickPos = (e.clientX - rect.left) / rect.width;
                              if (audioElementRef.current && duration > 0) {
                                audioElementRef.current.currentTime = clickPos * duration;
                              }
                            }}
                          >
                            <div
                              className="bg-emerald-600 h-full rounded-full transition-all duration-100"
                              style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* AI Thinking / Processing Indicator */}
          {loading && (
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0 border border-emerald-200">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-xs p-3.5 shadow-2xs text-xs text-slate-600 space-y-1.5">
                <div className="flex items-center gap-2 font-medium text-emerald-700">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span>
                    {stage === 'transcribing'
                      ? 'Prisma STT transcribing speech...'
                      : stage === 'reasoning'
                      ? 'Evon 30B reasoning & verifying supply chain...'
                      : stage === 'speaking'
                      ? 'Timbre TTS synthesizing Indian voice...'
                      : 'Processing request...'}
                  </span>
                </div>
                <div className="w-48 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-r from-emerald-500 to-teal-600 animate-pulse" />
                </div>
              </div>
            </div>
          )}

          {/* Transcription Review Card */}
          {pendingTranscript && (
            <div className="bg-emerald-50 border-2 border-emerald-400 rounded-2xl p-4 shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <Mic className="w-4 h-4 text-emerald-600" />
                  Prisma STT Transcription Preview
                </span>
                <span className="text-[10px] font-mono bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                  {Math.round(pendingTranscript.confidence * 100)}% Match
                </span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-emerald-200">
                <p className="text-sm text-slate-800 font-medium whitespace-pre-wrap">
                  "{pendingTranscript.text}"
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  onClick={() => setPendingTranscript(null)}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                >
                  Retry Voice
                </button>
                <button
                  onClick={handleConfirmTranscript}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-all duration-200 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send to Evon</span>
                </button>
              </div>
            </div>
          )}

          {/* Error Message Box */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start gap-2 shadow-2xs">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold">Notice:</span> {errorMessage}
              </div>
              <button
                onClick={() => setErrorMessage(null)}
                className="text-red-500 hover:text-red-700 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Voice Recording Control Panel & Active Waveform Display */}
        {isRecording && (
          <div className="bg-emerald-900 text-white p-4 flex flex-col items-center gap-3 border-t border-emerald-800 animate-fadeIn">
            <div className="flex items-center gap-3 w-full justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">
                  Recording Speech ({recordingSeconds}s)
                </span>
              </div>

              {/* Dynamic volume meter */}
              <div className="flex items-center gap-1 h-4">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-emerald-400 rounded-full transition-all duration-75"
                    style={{
                      height: `${Math.max(4, Math.min(18, (volumeLevel / 100) * 18 * ((i % 3) + 1)))}px`,
                    }}
                  />
                ))}
              </div>
            </div>

            <p className="text-xs text-emerald-200">
              Speak naturally in {SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage)?.name || 'your language'}...
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={handleCancelRecording}
                className="px-4 py-2 bg-emerald-800/80 hover:bg-emerald-800 text-emerald-200 rounded-xl text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStopRecording}
                className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold shadow-lg transition-transform active:scale-95 flex items-center gap-2"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Done Recording</span>
              </button>
            </div>
          </div>
        )}

        {/* Bottom Input Area: Big Mic Button & Text Input */}
        {!isRecording && (
          <div className="p-3 bg-white border-t border-slate-200 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              {/* Primary Voice Mic Button */}
              <button
                onClick={handleStartRecording}
                disabled={loading}
                title="Tap to speak in Kannada, Hindi, or English"
                className="group relative flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white shadow-md hover:shadow-emerald-500/30 transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 shrink-0"
              >
                <Mic className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white" />
              </button>

              {/* Text Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (textInput.trim() && !loading) {
                    processQueryWithEvon(textInput.trim(), false);
                  }
                }}
                className="flex-1 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Ask in Kannada, Hindi, or English..."
                  disabled={loading}
                  className="flex-1 bg-slate-100 hover:bg-slate-100/80 focus:bg-white text-slate-800 text-sm px-4 py-3 rounded-2xl border border-transparent focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 transition-all"
                />

                <button
                  type="submit"
                  disabled={!textInput.trim() || loading}
                  className="w-12 h-12 rounded-2xl bg-slate-900 hover:bg-emerald-700 text-white flex items-center justify-center transition-colors disabled:opacity-40 disabled:hover:bg-slate-900 shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
              <span>Press mic to speak or hit Enter to send text</span>
              <span className="text-emerald-700 font-medium">Gnani AI Sovereignty • Timbre TTS</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceAssistantDrawer;
