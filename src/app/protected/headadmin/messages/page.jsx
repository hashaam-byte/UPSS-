'use client'
import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Send, 
  Plus, 
  Building2, 
  User, 
  MessageSquare, 
  Clock, 
  Paperclip, 
  Smile, 
  MoreVertical,
  Archive,
  Trash2,
  Star,
  AlertCircle,
  CheckCircle,
  Users,
  Megaphone,
  Filter
} from 'lucide-react';

const MessagesPage = () => {
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState({
    subject: '',
    content: '',
    priority: 'normal'
  });
  const [schoolAdmins, setSchoolAdmins] = useState([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchConversations();
    fetchSchoolAdmins();
  }, []);

  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation.id);
      markAsRead(activeConversation.id);
    }
  }, [activeConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/protected/headadmin/messages/conversations');
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      const response = await fetch(`/api/protected/headadmin/messages/conversations/${conversationId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const markAsRead = async (conversationId) => {
    try {
      await fetch(`/api/protected/headadmin/messages/conversations/${conversationId}/read`, {
        method: 'POST'
      });
      // Update conversation list to remove unread indicator
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, unreadCount: 0 }
            : conv
        )
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation) return;

    setSendingMessage(true);
    try {
      const response = await fetch('/api/protected/headadmin/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toUserId: activeConversation.userId,
          schoolId: activeConversation.schoolId,
          content: newMessage,
          messageType: 'direct'
        })
      });

      if (response.ok) {
        setNewMessage('');
        await fetchMessages(activeConversation.id);
        await fetchConversations(); // Update last message in sidebar
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  const sendBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastMessage.subject.trim() || !broadcastMessage.content.trim()) return;

    setSendingMessage(true);
    try {
      const response = await fetch('/api/protected/headadmin/messages/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: broadcastMessage.subject,
          content: broadcastMessage.content,
          priority: broadcastMessage.priority,
          messageType: 'broadcast'
        })
      });

      if (response.ok) {
        setBroadcastMessage({ subject: '', content: '', priority: 'normal' });
        setShowBroadcast(false);
        await fetchConversations();
      }
    } catch (error) {
      console.error('Failed to send broadcast:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  const fetchSchoolAdmins = async () => {
    try {
      setLoadingAdmins(true);
      const response = await fetch('/api/protected/headadmin/messages/school-admins');
      if (response.ok) {
        const data = await response.json();
        setSchoolAdmins(data.admins || []);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch school admins');
      }
    } catch (err) {
      console.error('Error fetching school admins:', err);
      setError('Network error occurred');
    } finally {
      setLoadingAdmins(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else if (diffInHours < 168) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.school?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.user?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.user?.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl animate-pulse"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-2xl animate-ping"></div>
          </div>
          <p className="text-gray-600 mt-4 font-medium">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="h-screen flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-white/70 to-blue-50/70 backdrop-blur-sm shadow-lg border-b border-white/50 p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                Messages & Communications
              </h1>
              <p className="text-gray-600">
                Communicate with school administrators and send announcements
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowBroadcast(true)}
                className="group relative overflow-hidden bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center gap-2"
              >
                <Megaphone className="w-4 h-4" />
                <span>Broadcast</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Conversations Sidebar */}
          <div className="w-80 bg-gradient-to-br from-white/70 to-gray-50/70 backdrop-blur-sm border-r border-gray-200/50 flex flex-col">
            {/* Search */}
            <div className="p-4 border-b border-gray-200/50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm text-sm"
                />
              </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium">No conversations yet</p>
                  <p className="text-gray-400 text-sm mt-1">Start messaging school administrators</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200/50">
                  {filteredConversations.map((conversation) => (
                    <button
                      key={conversation.id}
                      onClick={() => setActiveConversation(conversation)}
                      className={`w-full p-4 text-left hover:bg-blue-50/50 transition-colors duration-200 ${
                        activeConversation?.id === conversation.id 
                          ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-r-4 border-blue-500' 
                          : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                            <Building2 className="w-6 h-6 text-white" />
                          </div>
                          {conversation.unreadCount > 0 && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center">
                              <span className="text-xs font-bold text-white">
                                {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-gray-900 truncate">
                            {conversation.school?.name || 'Unknown School'}
                          </p>
                          <p className="text-sm text-gray-600 truncate">
                            {conversation.user?.firstName} {conversation.user?.lastName}
                          </p>
                          <p className="text-xs text-gray-500 truncate mt-1">
                            {conversation.lastMessage?.content || 'No messages yet'}
                          </p>
                        </div>
                        <div className="text-xs text-gray-400">
                          {conversation.lastMessage && formatDate(conversation.lastMessage.createdAt)}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col bg-gradient-to-br from-white/50 to-blue-50/30">
            {activeConversation ? (
              <>
                {/* Chat Header */}
                <div className="bg-gradient-to-r from-white/80 to-blue-50/80 backdrop-blur-sm p-4 border-b border-gray-200/50 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                        <Building2 className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {activeConversation.school?.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {activeConversation.user?.firstName} {activeConversation.user?.lastName} • Admin
                        </p>
                      </div>
                    </div>
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100/50 rounded-lg transition-colors">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.fromUserId === null ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-lg ${
                          message.fromUserId === null
                            ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                            : 'bg-white border border-gray-200/50'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p
                          className={`text-xs mt-2 ${
                            message.fromUserId === null
                              ? 'text-blue-100'
                              : 'text-gray-500'
                          }`}
                        >
                          {formatDate(message.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="bg-gradient-to-r from-white/80 to-blue-50/80 backdrop-blur-sm p-4 border-t border-gray-200/50">
                  <form onSubmit={sendMessage} className="flex items-center gap-3">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="w-full px-4 py-3 pr-12 border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/70 backdrop-blur-sm"
                        disabled={sendingMessage}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <Paperclip className="w-5 h-5" />
                      </button>
                    </div>
                    <button
                      type="submit"
                      disabled={!newMessage.trim() || sendingMessage}
                      className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-purple-500 hover:to-pink-500 transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-10 h-10 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium text-lg">Select a conversation</p>
                  <p className="text-gray-400 text-sm mt-1">Choose a school to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Broadcast Modal */}
        {showBroadcast && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-white/90 to-orange-50/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/50 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                      <Megaphone className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Broadcast Message</h3>
                  </div>
                  <button
                    onClick={() => setShowBroadcast(false)}
                    className="text-white/80 hover:text-white p-1 rounded transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <form onSubmit={sendBroadcast} className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={broadcastMessage.subject}
                    onChange={(e) => setBroadcastMessage(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white/70 backdrop-blur-sm"
                    placeholder="System maintenance notification..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority Level
                  </label>
                  <select
                    value={broadcastMessage.priority}
                    onChange={(e) => setBroadcastMessage(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white/70 backdrop-blur-sm"
                  >
                    <option value="low">Low Priority</option>
                    <option value="normal">Normal Priority</option>
                    <option value="high">High Priority</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={broadcastMessage.content}
                    onChange={(e) => setBroadcastMessage(prev => ({ ...prev, content: e.target.value }))}
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white/70 backdrop-blur-sm resize-none"
                    placeholder="Dear School Administrators,&#10;&#10;We will be performing system maintenance this weekend..."
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200/50">
                  <button
                    type="button"
                    onClick={() => setShowBroadcast(false)}
                    className="px-6 py-3 border-2 border-gray-300/50 text-gray-700 rounded-xl hover:bg-gray-50/50 hover:border-gray-400/50 transition-all duration-200 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sendingMessage || !broadcastMessage.subject.trim() || !broadcastMessage.content.trim()}
                    className="px-8 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
                  >
                    {sendingMessage ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Broadcast
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* School Admins Section */}
      <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-6 mt-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-emerald-400" />
          School Admins
        </h2>
        {loadingAdmins ? (
          <p className="text-gray-400">Loading school admins...</p>
        ) : error ? (
          <p className="text-red-400">{error}</p>
        ) : schoolAdmins.length === 0 ? (
          <p className="text-gray-400">No school admins found.</p>
        ) : (
          <ul className="space-y-4">
            {schoolAdmins.map((admin) => (
              <li
                key={admin.id}
                className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{admin.firstName} {admin.lastName}</p>
                    <p className="text-gray-400 text-sm">{admin.email}</p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    setActiveConversation({
                      id: `admin-${admin.id}`,   // temporary unique key
                      userId: admin.id,          // required for sendMessage
                      schoolId: admin.schoolId || null, 
                      user: admin,
                      school: admin.school || null,
                      lastMessage: null,
                      unreadCount: 0
                    })
                  }
                  className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg text-sm transition-colors"
                >
                  <MessageSquare className="w-4 h-4 inline-block mr-2" />
                  Message
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;