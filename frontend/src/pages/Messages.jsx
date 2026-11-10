import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Loading from '../components/Loading';
import API from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { MessageSquare, Send, User } from 'lucide-react';

const Messages = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('fpo@agriconnect.com');

  const fetchMessages = async () => {
    try {
      const res = await API.get('/messages');
      if (res.data.success) {
        setMessages(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load messages:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      // Find recipient by email or default to first user
      const usersRes = await API.get('/auth/users').catch(() => ({ data: { data: [] } }));
      const targetUser = (usersRes.data.data || []).find((u) => u.email === recipientEmail);

      if (!targetUser) {
        alert('Please enter a valid partner email address');
        return;
      }

      await API.post('/messages', {
        recipientId: targetUser._id,
        content: newMessage,
      });

      setNewMessage('');
      fetchMessages();
    } catch (err) {
      alert(err.message || 'Failed to send message');
    }
  };

  if (loading) return <div className="flex"><Sidebar /><div className="flex-1"><Loading /></div></div>;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-50">
      <Sidebar />
      <main className="flex-1 p-6 space-y-6 max-w-4xl mx-auto overflow-y-auto">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-xl bg-agri-100 text-agri-800 flex items-center justify-center font-bold">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">Partner Communication</h1>
              <p className="text-xs text-slate-500">Negotiate price, quantity, pickup & delivery terms directly</p>
            </div>
          </div>

          {/* New Message Composer */}
          <form className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200" onSubmit={handleSendMessage}>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Partner Email Address</label>
              <input
                type="email"
                required
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="fpo@agriconnect.com"
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-agri-600"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Message Content</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Inquire about crop price, quantity or pickup schedule..."
                  className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-agri-600"
                />
                <button
                  type="submit"
                  className="px-5 py-2 bg-agri-700 hover:bg-agri-800 text-white font-bold text-xs rounded-xl shadow inline-flex items-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" /> Send
                </button>
              </div>
            </div>
          </form>

          {/* Message History Thread */}
          <div className="space-y-3 pt-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Conversation Logs</span>
            {messages.length > 0 ? (
              messages.map((msg) => {
                const isMe = msg.sender?._id === user?._id;
                return (
                  <div
                    key={msg._id}
                    className={`p-4 rounded-2xl border text-xs max-w-lg space-y-1 ${
                      isMe
                        ? 'ml-auto bg-agri-50 border-agri-200 text-slate-900'
                        : 'bg-white border-slate-200 text-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-[11px]">
                      <span>{isMe ? 'You' : msg.sender?.name || 'Partner'} ({msg.sender?.role})</span>
                      <span className="text-slate-400 text-[10px]">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-700 leading-relaxed">{msg.content}</p>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-400 py-8 text-center">No messages yet. Send a message to start negotiating.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Messages;
