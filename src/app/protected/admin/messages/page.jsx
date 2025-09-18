'use client'
import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Send, 
  Search,
  Crown,
  Users,
  Plus,
  Paperclip,
  Smile,
  MoreVertical,
  Archive,
  Star,
  Trash2,
  Reply,
  Forward,
  Clock,
  CheckCheck,
  AlertTriangle,
  X,
  Activity,
  Zap,
  Sparkles
} from 'lucide-react';

const AdminMessagesPage = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  const fetchConversations = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/protected/admin/messages/conversations');
      const data = await response.json();

      if (response.ok) {
        setConversations(data.conversations || []);
        if (data.conversations && data.conversations.length > 0) {
          setSelectedConversation(data.conversations[0]);
        }
      } else {
        setError(data.error || 'Failed to fetch conversations');
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setError('Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      const response = await fetch(`/api/protected/admin/messages/${conversationId}`);
      const data = await response.json();

      if (response.ok) {
        setMessages(data.messages || []);
      } else {
        setError(data.error || 'Failed to fetch messages');
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Network error occurred');
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const response = await fetch('/api/protected/admin/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          conversationId: selectedConversation.id,
          content: newMessage.trim()
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessages(prev => [...prev, data.message]);
        setNewMessage('');
        fetchConversations();
      } else {
        setError(data.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Network error occurred');
    }
  };

  const formatMessageTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) {
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.participant?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.participant?.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lastMessage?.content?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl animate-pulse shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-3xl animate-ping opacity-75"></div>
            </div>
          </div>
          <p className="text-gray-700 mt-6 font-bold text-lg">Loading Communication Hub...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="space-y-8">
        {/* Futuristic Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-white/80 to-purple-50/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 via-pink-600/5 to-blue-600/5"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-purple-400/20 to-transparent rounded-full blur-3xl"></div>
          
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Activity className="w-6 h-6 text-purple-500 animate-pulse" />
                <span className="text-purple-600 font-bold text-sm uppercase tracking-wider">Communication Hub</span>
              </div>
              <h1 className="text-5xl font-black bg-gradient-to-r from-gray-800 via-purple-800 to-pink-800 bg-clip-text text-transparent">
                Message Center
              </h1>
              <p className="text-gray-600 text-xl font-medium">
                Real-time communication and collaboration platform
              </p>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="relative overflow-hidden bg-gradient-to-r from-red-50/90 to-pink-50/90 backdrop-blur-sm border border-red-300 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-red-700 font-bold text-lg">{error}</p>
              </div>
              <button onClick={() => setError('')} className="p-2 text-red-600 hover:bg-red-100 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Main Chat Interface */}
        <div className="relative overflow-hidden bg-gradient-to-br from-white/80 to-purple-50/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 h-[calc(100vh-300px)] flex">
          
          {/* Left Sidebar - Conversations List */}
          <div className="w-96 flex-shrink-0 border-r border-gray-200/50 flex flex-col">
            {/* Sidebar Header */}
            <div className="p-6 border-b border-gray-200/50 bg-gradient-to-r from-purple-600 to-pink-600">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-black text-white">Messages</h2>
                </div>
                <button className="p-3 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-colors backdrop-blur-sm shadow-lg">
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/70 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/70 focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all font-medium"
                />
              </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-bold">No conversations found</p>
                  <p className="text-gray-400 text-sm mt-1">Start a new conversation to begin messaging</p>
                </div>
              ) : (
                filteredConversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation)}
                    className={`w-full flex items-center gap-4 p-6 hover:bg-white/50 transition-all duration-300 border-l-4 group ${
                      selectedConversation?.id === conversation.id
                        ? 'bg-white/60 border-l-purple-500 shadow-lg'
                        : 'border-l-transparent hover:border-l-purple-300'
                    }`}
                  >
                    <div className="relative">
                      <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
                        {conversation.participant?.role === 'headadmin' ? (
                          <Crown className="w-7 h-7" />
                        ) : (
                          `${conversation.participant?.firstName?.[0] || '?'}${conversation.participant?.lastName?.[0] || ''}`
                        )}
                      </div>
                      {conversation.unreadCount > 0 && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full flex items-center justify-center font-black shadow-lg animate-pulse">
                          {conversation.unreadCount}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 text-left overflow-hidden">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-black text-gray-900 truncate text-lg">
                          {conversation.participant?.role === 'headadmin' ? 'Head Administrator' : 
                           `${conversation.participant?.firstName || 'Unknown'} ${conversation.participant?.lastName || ''}`}
                        </p>
                        <span className="text-xs text-gray-500 font-medium">
                          {conversation.lastMessage ? formatMessageTime(conversation.lastMessage.createdAt) : ''}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 truncate font-medium">
                        {conversation.lastMessage?.content || 'No messages yet'}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right Side - Chat Area */}
          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-6 border-b border-gray-200/50 bg-gradient-to-r from-purple-600 to-pink-600">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white shadow-lg">
                        {selectedConversation.participant?.role === 'headadmin' ? (
                          <Crown className="w-6 h-6" />
                        ) : (
                          `${selectedConversation.participant?.firstName?.[0] || '?'}${selectedConversation.participant?.lastName?.[0] || ''}`
                        )}
                      </div>
                      <div>
                        <h3 className="font-black text-white text-xl">
                          {selectedConversation.participant?.role === 'headadmin' ? 'Head Administrator' : 
                           `${selectedConversation.participant?.firstName || 'Unknown'} ${selectedConversation.participant?.lastName || ''}`}
                        </h3>
                        <p className="text-sm text-white/80 font-medium">
                          {selectedConversation.participant?.role === 'headadmin' ? 'System Administrator' : 
                           selectedConversation.participant?.email || 'No email'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button className="p-3 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-colors backdrop-blur-sm">
                        <Star className="w-5 h-5" />
                      </button>
                      <button className="p-3 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-colors backdrop-blur-sm">
                        <Archive className="w-5 h-5" />
                      </button>
                      <button className="p-3 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-colors backdrop-blur-sm">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-white/50 to-purple-50/30">
                  {messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                          <MessageSquare className="w-10 h-10 text-purple-500" />
                        </div>
                        <h3 className="text-2xl font-black text-gray-800 mb-2">Start the conversation</h3>
                        <p className="text-gray-600 font-medium">Send your first message to begin chatting</p>
                      </div>
                    </div>
                  ) : (
                    messages.map((message) => {
                      const isFromCurrentUser = message.fromCurrentUser;
                      
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isFromCurrentUser ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-md ${isFromCurrentUser ? 'order-1' : 'order-2'} group`}>
                            <div
                              className={`px-6 py-4 rounded-2xl shadow-lg backdrop-blur-sm transition-all duration-300 group-hover:shadow-xl ${
                                isFromCurrentUser
                                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                                  : 'bg-white/80 text-gray-800 border border-gray-200/50'
                              }`}
                            >
                              <p className="font-medium">{message.content}</p>
                            </div>
                            <div className={`mt-2 flex items-center gap-2 text-xs text-gray-500 ${
                              isFromCurrentUser ? 'justify-end' : 'justify-start'
                            }`}>
                              <span className="font-medium">{formatMessageTime(message.createdAt)}</span>
                              {isFromCurrentUser && (
                                <div className="flex items-center">
                                  <CheckCheck className={`w-4 h-4 ${message.isRead ? 'text-purple-500' : 'text-gray-400'}`} />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Message Input */}
                <div className="p-6 border-t border-gray-200/50 bg-white/50 backdrop-blur-sm">
                  <div className="flex items-end gap-4">
                    <div className="flex-1 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg focus-within:border-purple-500/50 focus-within:shadow-xl transition-all">
                      <div className="flex items-center px-6 py-4">
                        <button
                          type="button"
                          className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-colors mr-2"
                        >
                          <Paperclip className="w-5 h-5" />
                        </button>
                        <textarea
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type your message..."
                          className="flex-1 bg-transparent text-gray-800 placeholder-gray-500 resize-none max-h-32 py-2 px-3 focus:outline-none font-medium"
                          rows={1}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              sendMessage(e);
                            }
                          }}
                        />
                        <button
                          type="button"
                          className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-colors ml-2"
                        >
                          <Smile className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                      className="p-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl transition-all shadow-xl hover:shadow-2xl hover:scale-105 disabled:hover:scale-100"
                    >
                      <Send className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-white/50 to-purple-50/30">
                <div className="text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                    <MessageSquare className="w-12 h-12 text-purple-500" />
                  </div>
                  <h3 className="text-3xl font-black text-gray-800 mb-3">Select a Conversation</h3>
                  <p className="text-gray-600 text-lg font-medium mb-6">Choose someone to start messaging</p>
                  <button className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-2xl transition-all mx-auto font-bold shadow-xl hover:shadow-2xl hover:scale-105">
                    <Sparkles className="w-5 h-5" />
                    Start New Chat
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminMessagesPage;