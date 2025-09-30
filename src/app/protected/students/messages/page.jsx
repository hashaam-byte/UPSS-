'use client'
import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Send, 
  Search,
  User,
  Paperclip,
  MoreVertical,
  CheckCheck,
  X,
  BookOpen
} from 'lucide-react';

const StudentMessagesPage = () => {
  const [conversations, setConversations] = useState([]);
  const [allTeachers, setAllTeachers] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/protected/students/messages/conversations');
      const data = await response.json();

      if (response.ok) {
        setConversations(data.conversations || []);
        setAllTeachers(data.allTeachers || []);
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
      const response = await fetch(`/api/protected/students/messages/${conversationId}`);
      const data = await response.json();

      if (response.ok) {
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const response = await fetch('/api/protected/students/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const startNewConversation = (teacher) => {
    setSelectedConversation({
      id: teacher.id,
      participant: teacher
    });
    setMessages([]);
    setShowNewChat(false);
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

  const getTeacherRole = (teacher) => {
    if (teacher.teacherProfile?.coordinatorClass) {
      return `Class Teacher - ${teacher.teacherProfile.coordinatorClass}`;
    }
    const subjects = teacher.teacherProfile?.teacherSubjects?.map(ts => ts.subject?.name).filter(Boolean).join(', ');
    return subjects ? `Subject Teacher - ${subjects}` : 'Teacher';
  };

  const filteredConversations = conversations.filter(conv =>
    conv.participant?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.participant?.lastName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTeachers = allTeachers.filter(teacher =>
    teacher.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    teacher.lastName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl animate-pulse mx-auto"></div>
          <p className="text-gray-600 mt-4 font-medium">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="h-screen flex flex-col">
        <div className="bg-gradient-to-r from-white/70 to-green-50/70 backdrop-blur-sm shadow-lg border-b border-white/50 p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 via-green-800 to-blue-800 bg-clip-text text-transparent">
                Messages
              </h1>
              <p className="text-gray-600">Chat with your teachers</p>
            </div>
            <button
              onClick={() => setShowNewChat(true)}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl font-semibold hover:scale-105 transition-all shadow-lg"
            >
              New Chat
            </button>
          </div>
        </div>

        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-300 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 text-red-600">⚠</div>
              <p className="text-red-700 font-medium">{error}</p>
            </div>
            <button onClick={() => setError('')} className="text-red-600 hover:text-red-800">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        <div className="flex-1 flex overflow-hidden">
          <div className="w-80 bg-gradient-to-br from-white/70 to-gray-50/70 backdrop-blur-sm border-r border-gray-200/50 flex flex-col">
            <div className="p-4 border-b border-gray-200/50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search teachers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white/50 backdrop-blur-sm text-sm"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No conversations yet</p>
                  <p className="text-gray-400 text-sm mt-1">Start chatting with your teachers</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200/50">
                  {filteredConversations.map((conversation) => (
                    <button
                      key={conversation.id}
                      onClick={() => setSelectedConversation(conversation)}
                      className={`w-full p-4 text-left hover:bg-green-50/50 transition-colors ${
                        selectedConversation?.id === conversation.id 
                          ? 'bg-gradient-to-r from-green-50 to-blue-50 border-r-4 border-green-500' 
                          : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white shadow-lg">
                            <User className="w-6 h-6" />
                          </div>
                          {conversation.unreadCount > 0 && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                              {conversation.unreadCount}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-gray-900 truncate">
                            {conversation.participant?.firstName} {conversation.participant?.lastName}
                          </p>
                          <p className="text-sm text-gray-600 truncate">
                            {getTeacherRole(conversation.participant)}
                          </p>
                          <p className="text-xs text-gray-500 truncate mt-1">
                            {conversation.lastMessage?.content || 'No messages yet'}
                          </p>
                        </div>
                        {conversation.lastMessage && (
                          <div className="text-xs text-gray-400">
                            {formatMessageTime(conversation.lastMessage.createdAt)}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col bg-gradient-to-br from-white/50 to-green-50/30">
            {selectedConversation ? (
              <>
                <div className="bg-gradient-to-r from-white/80 to-green-50/80 backdrop-blur-sm p-4 border-b border-gray-200/50 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white shadow-lg">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {selectedConversation.participant?.firstName} {selectedConversation.participant?.lastName}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {getTeacherRole(selectedConversation.participant)}
                        </p>
                      </div>
                    </div>
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100/50 rounded-lg transition-colors">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.fromCurrentUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-lg ${
                          message.fromCurrentUser
                            ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white'
                            : 'bg-white border border-gray-200/50'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <div className={`flex items-center gap-2 mt-2 text-xs ${
                          message.fromCurrentUser ? 'text-green-100' : 'text-gray-500'
                        }`}>
                          <span>{formatMessageTime(message.createdAt)}</span>
                          {message.fromCurrentUser && (
                            <CheckCheck className={`w-4 h-4 ${message.isRead ? 'text-white' : 'text-green-200'}`} />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                <div className="bg-gradient-to-r from-white/80 to-green-50/80 backdrop-blur-sm p-4 border-t border-gray-200/50">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type your message..."
                        className="w-full px-4 py-3 pr-12 border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white/70 backdrop-blur-sm"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <Paperclip className="w-5 h-5" />
                      </button>
                    </div>
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                      className="p-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl hover:from-blue-500 hover:to-purple-500 transition-all hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium text-lg">Select a teacher</p>
                  <p className="text-gray-400 text-sm mt-1">Choose a teacher to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {showNewChat && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-blue-500 p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">Message a Teacher</h3>
                  <button
                    onClick={() => setShowNewChat(false)}
                    className="text-white/80 hover:text-white p-1 rounded transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              <div className="p-6 overflow-y-auto max-h-96">
                <div className="space-y-2">
                  {filteredTeachers.map((teacher) => (
                    <button
                      key={teacher.id}
                      onClick={() => startNewConversation(teacher)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-green-50 rounded-xl transition-colors"
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white">
                        <User className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-gray-900">
                          {teacher.firstName} {teacher.lastName}
                        </p>
                        <p className="text-sm text-gray-600">
                          {getTeacherRole(teacher)}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentMessagesPage;