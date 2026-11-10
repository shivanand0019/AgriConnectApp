/**
 * In-Memory Conversation Session Service
 * Maintains multi-turn context per session ID or authenticated user ID.
 * Automatically cleans up expired sessions to prevent memory leaks.
 */

class ConversationService {
  constructor() {
    this.sessions = new Map();
    this.SESSION_TIMEOUT_MS = 60 * 60 * 1000; // 1 hour

    // Run sweep every 15 minutes without preventing process exit
    const timer = setInterval(() => this.cleanupExpired(), 15 * 60 * 1000);
    if (timer && timer.unref) {
      timer.unref();
    }
  }

  getSessionKey(sessionId, userId) {
    if (userId) return `user_${userId}`;
    return `session_${sessionId || 'anonymous'}`;
  }

  getHistory(sessionId, userId) {
    const key = this.getSessionKey(sessionId, userId);
    const session = this.sessions.get(key);
    if (!session) return [];
    session.lastActive = Date.now();
    return session.messages;
  }

  appendMessage(sessionId, userId, message) {
    const key = this.getSessionKey(sessionId, userId);
    let session = this.sessions.get(key);
    if (!session) {
      session = {
        messages: [],
        createdAt: Date.now(),
        lastActive: Date.now(),
      };
      this.sessions.set(key, session);
    }

    session.lastActive = Date.now();
    session.messages.push({
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date(),
      ...message,
    });

    // Keep last 15 messages for token efficiency
    if (session.messages.length > 15) {
      session.messages = session.messages.slice(-15);
    }

    return session.messages;
  }

  clearSession(sessionId, userId) {
    const key = this.getSessionKey(sessionId, userId);
    this.sessions.delete(key);
    return true;
  }

  cleanupExpired() {
    const now = Date.now();
    for (const [key, session] of this.sessions.entries()) {
      if (now - session.lastActive > this.SESSION_TIMEOUT_MS) {
        this.sessions.delete(key);
      }
    }
  }
}

module.exports = new ConversationService();
