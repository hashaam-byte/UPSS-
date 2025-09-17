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
  X
} from 'lucide-react';

const AdminMessagesPage = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
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
        // Update conversation list to show new message
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
    } else if (diffInHours < 168) { // Less than a week
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

  return (
    <div className="h-[calc(100vh-120px)] flex bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
      {/* Left Sidebar - Conversations List */}
      <div className="w-80 flex-shrink-0 border-r border-white/10 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Messages</h2>
            <button
              onClick={() => setShowNewMessageModal(true)}
              className="p-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-4">
              <div className="animate-pulse space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-3 p-3">
                    <div className="w-10 h-10 bg-white/10 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-white/10 rounded mb-1"></div>
                      <div className="h-3 bg-white/5 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-4 text-center">
              <MessageSquare className="w-12 h-12 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400">No conversations found</p>
              <button
                onClick={() => setShowNewMessageModal(true)}
                className="mt-2 text-emerald-400 hover:text-emerald-300 text-sm"
              >
                Start a conversation
              </button>
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => setSelectedConversation(conversation)}
                className={`w-full flex items-center gap-3 p-4 hover:bg-white/5 transition-colors border-l-2 ${
                  selectedConversation?.id === conversation.id
                    ? 'bg-white/10 border-l-emerald-500'
                    : 'border-l-transparent'
                }`}
              >
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full flex items-center justify-center text-white font-medium">
                    {conversation.participant?.role === 'headadmin' ? (
                      <Crown className="w-5 h-5" />
                    ) : (
                      `${conversation.participant?.firstName?.[0] || '?'}${conversation.participant?.lastName?.[0] || ''}`
                    )}
                  </div>
                  {conversation.unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {conversation.unreadCount}
                    </div>
                  )}
                </div>
                <div className="flex-1 text-left overflow-hidden">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-white truncate">
                      {conversation.participant?.role === 'headadmin' ? 'Head Admin' : 
                       `${conversation.participant?.firstName || 'Unknown'} ${conversation.participant?.lastName || ''}`}
                    </p>
                    <span className="text-xs text-gray-400">
                      {conversation.lastMessage ? formatMessageTime(conversation.lastMessage.createdAt) : ''}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 truncate">
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
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full flex items-center justify-center text-white">
                  {selectedConversation.participant?.role === 'headadmin' ? (
                    <Crown className="w-5 h-5" />
                  ) : (
                    `${selectedConversation.participant?.firstName?.[0] || '?'}${selectedConversation.participant?.lastName?.[0] || ''}`
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-white">
                    {selectedConversation.participant?.role === 'headadmin' ? 'Head Admin' : 
                     `${selectedConversation.participant?.firstName || 'Unknown'} ${selectedConversation.participant?.lastName || ''}`}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {selectedConversation.participant?.role === 'headadmin' ? 'System Administrator' : 
                     selectedConversation.participant?.email || 'No email'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                  <Star className="w-4 h-4" />
                </button>
                <button className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                  <Archive className="w-4 h-4" />
                </button>
                <button className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <MessageSquare className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg">No messages yet</p>
                    <p className="text-gray-500 text-sm">Start the conversation by sending a message below</p>
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
                      <div className={`max-w-md ${isFromCurrentUser ? 'order-1' : 'order-2'}`}>
                        <div
                          className={`px-4 py-3 rounded-2xl ${
                            isFromCurrentUser
                              ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white'
                              : 'bg-white/10 text-white border border-white/20'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                        </div>
                        <div className={`mt-1 flex items-center gap-2 text-xs text-gray-400 ${
                          isFromCurrentUser ? 'justify-end' : 'justify-start'
                        }`}>
                          <span>{formatMessageTime(message.createdAt)}</span>
                          {isFromCurrentUser && (
                            <div className="flex items-center">
                              <CheckCheck className={`w-3 h-3 ${message.isRead ? 'text-emerald-400' : 'text-gray-400'}`} />
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
            <div className="p-4 border-t border-white/10">
              <form onSubmit={sendMessage} className="flex items-end gap-3">
                <div className="flex-1 bg-white/5 rounded-2xl border border-white/20 focus-within:border-emerald-500/50 transition-colors">
                  <div className="flex items-center px-4 py-2">
                    <button
                      type="button"
                      className="p-2 text-gray-400 hover:text-white transition-colors"
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 bg-transparent text-white placeholder-gray-400 resize-none max-h-32 py-2 px-2 focus:outline-none"
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
                      className="p-2 text-gray-400 hover:text-white transition-colors"
                    >
                      <Smile className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="p-3 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-all"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Select a Conversation</h3>
              <p className="text-gray-400">Choose a conversation from the sidebar to start messaging</p>
              <button
                onClick={() => setShowNewMessageModal(true)}
                className="mt-4 flex items-center gap-2 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg transition-colors mx-auto"
              >
                <Plus className="w-4 h-4" />
                Start New Conversation
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="absolute bottom-4 right-4 max-w-sm bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
            <button onClick={() => setError('')} className="ml-2">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMessagesPage;