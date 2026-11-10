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
  AlertCircle,
  CheckCircle2,
  Cpu,
  Package,
  Info,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import {
  VoiceAssistantService,
  AudioRecorder,
} from '../../services/voiceAssistantService';
import { useAuth } from '../../hooks/useAuth';

const SUPPORTED_LANGUAGES = [
  { code: 'kn-IN', name: 'ಕನ್ನಡ (Kannada)', flag: '🌾', defaultVoice: 'Chitra' },
  { code: 'hi-IN', name: 'हिंदी (Hindi)', flag: '🇮🇳', defaultVoice: 'Nalini' },
  { code: 'en-IN', name: 'English (India)', flag: '🌐', defaultVoice: 'Tanvi' },
  { code: 'ta-IN', name: 'தமிழ் (Tamil)', flag: '🌿', defaultVoice: 'Oviya' },
  { code: 'te-IN', name: 'తెలుగు (Telugu)', flag: '🌱', defaultVoice: 'Tanvi' },
  { code: 'mr-IN', name: 'मराठी (Marathi)', flag: '🍃', defaultVoice: 'Radhika' },
];

function base64ToBlob(base64, mimeType = 'audio/wav') {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

const AssistantPage = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState('kn-IN');
  const [textInput, setTextInput] = useState('');
  const [statusInfo, setStatusInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState('idle');
  const [errorMessage, setErrorMessage] = useState(null);

  // Audio recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [pendingTranscript, setPendingTranscript] = useState(null);

  // Audio playback
  const [playingMessageId, setPlayingMessageId] = useState(null);
  const [playbackState, setPlaybackState] = useState('idle'); // 'idle' | 'playing' | 'paused' | 'loading'
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

    const handleError = () => {
      setPlaybackState('idle');
      setPlayingMessageId(null);
      setErrorMessage('Audio playback failed. Please click Replay to try again.');
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

  useEffect(() => {
    VoiceAssistantService.getStatus()
      .then((res) => {
        if (res?.data) {
          setStatusInfo(res.data);
        }
      })
      .catch((e) => console.warn(e));

    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content:
          selectedLanguage === 'kn-IN'
            ? 'ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಅಗ್ರಿಕನೆಕ್ಟ್ ಎಐ ಧ್ವನಿ ಸಹಾಯಕ. ಜ್ಞಾನಿ ಪ್ರಿಸ್ಮಾ (STT), ಎವೊನ್ 30B (LLM), ಮತ್ತು ತಿಂಬ್ರೆ (TTS) ತಂತ್ರಜ್ಞಾನಗಳ ಮೂಲಕ ನೀವು ಮೈಕ್ರೋಫೋನ್ ಬಳಸಿ ಮಾತನಾಡಬಹುದು ಅಥವಾ ಟೈಪ್ ಮಾಡಬಹುದು.'
            : 'Welcome to the AgriConnect Multilingual Voice Assistant. Speak naturally in Kannada, Hindi, or English or type your question below!',
        timestamp: new Date(),
        reasoning: {
          thoughtProcess: 'Initialized dedicated full-screen assistant interface.',
        },
      },
    ]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, stage]);

  const handleStartRecording = async () => {
    setErrorMessage(null);
    setPendingTranscript(null);
    try {
      const recorder = new AudioRecorder();
      audioRecorderRef.current = recorder;
      await recorder.startRecording((vol) => setVolumeLevel(vol));
      setIsRecording(true);
      setStage('recording');
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      setErrorMessage(err.message || 'Microphone access denied');
      setIsRecording(false);
      setStage('idle');
    }
  };

  const handleStopRecording = async () => {
    if (!audioRecorderRef.current || !isRecording) return;
    clearInterval(recordingTimerRef.current);
    setIsRecording(false);
    setStage('transcribing');
    setLoading(true);

    try {
      const { audioBlob } = await audioRecorderRef.current.stopRecording();
      const sttRes = await VoiceAssistantService.transcribeAudio(audioBlob, selectedLanguage);
      const text = sttRes?.data?.transcript || '';

      if (!text.trim()) {
        throw new Error('No speech detected. Please speak clearly into the microphone.');
      }

      setPendingTranscript({
        text,
        confidence: sttRes?.data?.confidence || 0.95,
        language: sttRes?.data?.language || selectedLanguage,
        audioBlob,
      });

      setStage('idle');
      setLoading(false);
    } catch (err) {
      setErrorMessage(err.message || 'Speech recognition failed.');
      setStage('idle');
      setLoading(false);
    }
  };

  const handleCancelRecording = () => {
    if (audioRecorderRef.current) {
      audioRecorderRef.current.cancelRecording();
    }
    clearInterval(recordingTimerRef.current);
    setIsRecording(false);
    setStage('idle');
  };

  const playAudioForMessage = async (msg) => {
    const audio = audioElementRef.current;

    if (playingMessageId === msg.id && playbackState === 'paused') {
      try {
        await audio.play();
        setPlaybackState('playing');
        return;
      } catch (e) {
        console.warn('Resume failed:', e);
      }
    }

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
          setMessages((prev) =>
            prev.map((m) => (m.id === msg.id ? { ...m, tts: synthRes.data } : m))
          );
        } else {
          throw new Error('Speech synthesis did not return audio.');
        }
      } catch (err) {
        setErrorMessage(`Timbre synthesis failed: ${err.message}`);
        setLoadingAudioId(null);
        return;
      } finally {
        setLoadingAudioId(null);
      }
    }

    try {
      audio.pause();
      if (activeAudioUrlRef.current) {
        URL.revokeObjectURL(activeAudioUrlRef.current);
        activeAudioUrlRef.current = null;
      }

      const blob = base64ToBlob(audioBase64, msg.tts?.mimeType || 'audio/wav');
      const blobUrl = URL.createObjectURL(blob);
      activeAudioUrlRef.current = blobUrl;

      audio.src = blobUrl;
      audio.currentTime = 0;

      setPlayingMessageId(msg.id);
      setPlaybackState('loading');
      setAutoplayBlockedId(null);

      await audio.play();
      setPlaybackState('playing');
    } catch (err) {
      console.warn('Playback error / Autoplay blocked:', err);
      if (err.name === 'NotAllowedError') {
        setAutoplayBlockedId(msg.id);
        setPlaybackState('idle');
      } else {
        setErrorMessage(`Audio play failed: ${err.message}`);
        setPlaybackState('idle');
      }
    }
  };

  const pauseAudio = () => {
    audioElementRef.current.pause();
    setPlaybackState('paused');
  };

  const stopAudio = () => {
    audioElementRef.current.pause();
    audioElementRef.current.currentTime = 0;
    setPlaybackState('idle');
    setPlayingMessageId(null);
    setCurrentTime(0);
  };

  const replayAudio = async (msg) => {
    const audio = audioElementRef.current;
    if (playingMessageId === msg.id && activeAudioUrlRef.current) {
      audio.currentTime = 0;
      try {
        await audio.play();
        setPlaybackState('playing');
        return;
      } catch (e) {
        console.warn('Replay failed:', e);
      }
    }
    await playAudioForMessage(msg);
  };

  const processQuery = async (queryText, isVoice = false) => {
    if (!queryText || !queryText.trim()) return;
    setErrorMessage(null);
    setLoading(true);
    setStage('reasoning');

    const userMsg = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: queryText,
      isVoice,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setTextInput('');

    try {
      const res = await VoiceAssistantService.sendChat({
        query: queryText,
        language: selectedLanguage,
        sessionId: sessionIdRef.current,
        role: user ? user.role : 'FARMER',
      });

      const data = res.data;
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

      if (data.tts?.audioBase64) {
        playAudioForMessage(assistantMsg);
      }

      setStage('idle');
      setLoading(false);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message || 'AI processing error.');
      setStage('idle');
      setLoading(false);
    }
  };

  const overallMode = statusInfo?.overallMode || 'LIVE';

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200 flex flex-col h-[85vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-6 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 ${
                playbackState === 'playing' ? 'ring-2 ring-emerald-300 animate-pulse' : ''
              }`}
            >
              <Bot className="w-7 h-7 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">AgriConnect Voice Intelligence</h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-400 text-emerald-950 uppercase tracking-wider">
                  {overallMode} MODE
                </span>
              </div>
              <p className="text-xs text-emerald-200 mt-0.5">
                Powered by Gnani Prisma (STT) • Evon 30B (LLM) • Timbre (TTS)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-black/20 rounded-xl px-3 py-1.5 text-xs">
              <Globe className="w-3.5 h-3.5 text-emerald-300" />
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code} className="bg-slate-900 text-white">
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                stopAudio();
                if (activeAudioUrlRef.current) {
                  URL.revokeObjectURL(activeAudioUrlRef.current);
                  activeAudioUrlRef.current = null;
                }
                setMessages([]);
                setPendingTranscript(null);
              }}
              title="Clear Chat"
              className="p-2 rounded-xl text-emerald-200 hover:text-white hover:bg-emerald-700/50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Chat Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/60">
          {messages.map((m) => {
            const isThisPlaying = playingMessageId === m.id && playbackState === 'playing';
            const isThisPaused = playingMessageId === m.id && playbackState === 'paused';
            const isThisLoading = loadingAudioId === m.id || (playingMessageId === m.id && playbackState === 'loading');
            const hasAutoplayBlock = autoplayBlockedId === m.id;

            return (
              <div
                key={m.id}
                className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-4 shadow-xs transition-all duration-300 ${
                    m.role === 'user'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-br-xs'
                      : isThisPlaying
                      ? 'bg-white text-slate-800 border-2 border-emerald-400 shadow-md ring-4 ring-emerald-50 rounded-bl-xs'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5 text-xs">
                    <span
                      className={`font-semibold flex items-center gap-1.5 ${
                        m.role === 'user' ? 'text-emerald-100' : 'text-emerald-700'
                      }`}
                    >
                      {m.role === 'user' ? (
                        <>
                          <User className="w-3.5 h-3.5" />
                          <span>You</span>
                          {m.isVoice && (
                            <span className="bg-white/20 px-1.5 py-0.2 rounded text-[10px] font-mono">
                              🎤 Voice
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          <Bot className="w-3.5 h-3.5" />
                          <span>AgriConnect Assistant</span>
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
                    <span className={`text-[10px] ${m.role === 'user' ? 'text-emerald-200' : 'text-slate-400'}`}>
                      {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{m.content}</p>

                  {/* Autoplay Restriction Notification Banner */}
                  {hasAutoplayBlock && (
                    <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between text-xs text-emerald-950 animate-fadeIn">
                      <div className="flex items-center gap-2">
                        <Volume2 className="w-4 h-4 text-emerald-700 shrink-0 animate-pulse" />
                        <span className="font-medium">Autoplay blocked — click to listen</span>
                      </div>
                      <button
                        onClick={() => {
                          setAutoplayBlockedId(null);
                          playAudioForMessage(m);
                        }}
                        className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-xs shadow-2xs transition-all flex items-center gap-1"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Listen</span>
                      </button>
                    </div>
                  )}

                  {/* Audio Playback Controls */}
                  {m.role === 'assistant' && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-col gap-2 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          {/* Play / Pause */}
                          {isThisPlaying ? (
                            <button
                              onClick={pauseAudio}
                              title="Pause"
                              className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs flex items-center gap-1.5 shadow-2xs"
                            >
                              <Pause className="w-3.5 h-3.5 fill-current" />
                              <span>Pause</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => playAudioForMessage(m)}
                              disabled={isThisLoading}
                              title={isThisPaused ? 'Resume' : 'Play Voice'}
                              className={`px-3 py-1 rounded-lg font-semibold text-xs flex items-center gap-1.5 shadow-2xs transition-all ${
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
                                  <span>{isThisPaused ? 'Resume' : 'Listen (Timbre)'}</span>
                                </>
                              )}
                            </button>
                          )}

                          {/* Replay */}
                          <button
                            onClick={() => replayAudio(m)}
                            disabled={isThisLoading}
                            title="Replay Voice"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>

                          {/* Stop */}
                          {(isThisPlaying || isThisPaused) && (
                            <button
                              onClick={stopAudio}
                              title="Stop"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            >
                              <Square className="w-3.5 h-3.5 fill-current text-rose-500" />
                            </button>
                          )}
                        </div>

                        <span className="text-[10px] text-slate-400 font-mono">
                          Timbre ({m.tts?.voice || SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage)?.defaultVoice || 'Chitra'})
                        </span>
                      </div>

                      {/* Equalizer Waveform & Progress */}
                      {(isThisPlaying || isThisPaused) && (
                        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2 flex flex-col gap-1.5">
                          <div className="flex items-center justify-between text-[11px] text-slate-600">
                            <div className="flex items-center gap-1.5">
                              {isThisPlaying && (
                                <div className="flex items-end gap-0.5 h-3">
                                  <span className="w-1 bg-emerald-500 rounded-full animate-soundwave-1" />
                                  <span className="w-1 bg-emerald-500 rounded-full animate-soundwave-2" />
                                  <span className="w-1 bg-emerald-500 rounded-full animate-soundwave-3" />
                                  <span className="w-1 bg-emerald-500 rounded-full animate-soundwave-4" />
                                  <span className="w-1 bg-emerald-500 rounded-full animate-soundwave-5" />
                                </div>
                              )}
                              <span className="font-medium text-emerald-800">
                                {isThisPlaying ? 'Playing Timbre audio' : 'Paused'}
                              </span>
                            </div>
                            <span className="font-mono text-[10px] text-slate-500">
                              {formatTime(currentTime)} / {formatTime(duration)}
                            </span>
                          </div>

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

          {/* Pending Transcript Preview */}
          {pendingTranscript && (
            <div className="bg-emerald-50 border-2 border-emerald-400 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                  Prisma Transcription ({Math.round(pendingTranscript.confidence * 100)}% Confidence)
                </span>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">"{pendingTranscript.text}"</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setPendingTranscript(null)}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  Retry
                </button>
                <button
                  onClick={() => {
                    const text = pendingTranscript.text;
                    setPendingTranscript(null);
                    processQuery(text, true);
                  }}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                >
                  Send Query
                </button>
              </div>
            </div>
          )}

          {loading && (
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
              <Bot className="w-4 h-4 animate-spin" />
              <span>Thinking with Gnani Evon 30B...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Recording Visualizer Bar */}
        {isRecording && (
          <div className="bg-emerald-950 text-white px-6 py-4 flex items-center justify-between border-t border-emerald-800">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <span className="font-bold text-xs uppercase tracking-wide">
                Listening ({recordingSeconds}s)... Speak now in {selectedLanguage}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCancelRecording}
                className="px-3 py-1 bg-emerald-900 text-emerald-300 hover:bg-emerald-800 rounded-lg text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleStopRecording}
                className="px-4 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-bold shadow-md"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* Input Bar */}
        {!isRecording && (
          <div className="p-4 bg-white border-t border-slate-200 flex items-center gap-3">
            <button
              onClick={handleStartRecording}
              disabled={loading}
              className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all shrink-0"
              title="Click to speak"
            >
              <Mic className="w-5 h-5" />
            </button>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                processQuery(textInput, false);
              }}
              className="flex-1 flex items-center gap-2"
            >
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Ask in Kannada, Hindi, or English (e.g. 'ಟೊಮ್ಯಾಟೊ ಖರೀದಿದಾರರನ್ನು ಹುಡುಕಿ')..."
                className="flex-1 bg-slate-100 text-slate-800 text-sm px-4 py-3 rounded-2xl border border-transparent focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200 transition-all"
              />
              <button
                type="submit"
                disabled={!textInput.trim() || loading}
                className="w-12 h-12 rounded-2xl bg-slate-900 hover:bg-emerald-700 text-white flex items-center justify-center transition-colors disabled:opacity-40 shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssistantPage;
