'use client'
import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Send, 
  Search,
  Users,
  GraduationCap,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  Smile,
  Paperclip,
  Phone,
  Video,
  Megaphone,
  Filter,
  UserCheck,
  BookOpen,
  TrendingUp,
  Calendar
} from 'lucide-react';

const ClassTeacherMessagesPage = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [classStudents, setClassStudents] = useState([]);
  const [assignedClass, setAssignedClass] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, students, teachers, admin
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchClassMessages();
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

  const fetchClassMessages = async () => {
    try {
      const response = await fetch('/api/protected/teachers/class/messages');
      const data = await response.json();

      if (response.ok) {
        setClassStudents(data.classStudents || []);
        setAssignedClass(data.assignedClass || '');
      } else {
        setError(data.error || 'Failed to fetch class data');
      }
    } catch (error) {
      console.error('Error fetching class messages:', error);
      setError('Network error occurred');
    }
  };

  const fetchConversations = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/protected/teachers/messages/conversations');
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
      const response = await fetch(`/api/protected/teachers/messages/${conversationId}`);
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
    if (!newMessage.trim() || !selectedConversation || sendingMessage) return;

    setSendingMessage(true);
    try {
      const response = await fetch('/api/protected/teachers/messages/send', {
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
        setMessages(prev => [...prev, { ...data.message, fromCurrentUser: true }]);
        setNewMessage('');
        fetchConversations();
      } else {
        setError(data.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Network error occurred');
    } finally {
      setSendingMessage(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return <Users className="w-4 h-4 text-purple-500" />;
      case 'director': return <GraduationCap className="w-4 h-4 text-blue-500" />;
      case 'coordinator': return <BookOpen className="w-4 h-4 text-green-500" />;
      case 'subject_teacher':
      case 'teacher': return <User className="w-4 h-4 text-orange-500" />;
      case 'student': return <UserCheck className="w-4 h-4 text-indigo-500" />;
      default: return <MessageSquare className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'from-purple-500 to-pink-500';
      case 'director': return 'from-blue-500 to-cyan-500';
      case 'coordinator': return 'from-green-500 to-emerald-500';
      case 'subject_teacher':
      case 'teacher': return 'from-orange-500 to-red-500';
      case 'student': return 'from-indigo-500 to-purple-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getFilteredConversations = () => {
    let filtered = conversations;

    // Filter by type
    if (filterType !== 'all') {
      if (filterType === 'students') {
        filtered = filtered.filter(conv => conv.participant?.role === 'student');
      } else if (filterType === 'teachers') {
        filtered = filtered.filter(conv => ['teacher', 'subject_teacher', 'coordinator', 'director'].includes(conv.participant?.role));
      } else if (filterType === 'admin') {
        filtered = filtered.filter(conv => conv.participant?.role === 'admin');
      }
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(conv =>
        conv.participant?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.participant?.lastName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  };

  const filteredConversations = getFilteredConversations();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl animate-pulse"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-blue-400 rounded-2xl animate-ping"></div>
          </div>
          <p className="text-gray-600 mt-4 font-medium">Loading class messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="h-screen flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-white/70 to-green-50/70 backdrop-blur-sm shadow-lg border-b border-white/50 p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <UserCheck className="w-8 h-8 text-green-600" />
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 via-green-800 to-blue-800 bg-clip-text text-transparent">
                    Class Teacher Messages
                  </h1>
                  <p className="text-gray-600">
                    Managing {assignedClass} - {classStudents.length} students
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="bg-white/60 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/50">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">Class: {assignedClass}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-700 font-medium">{error}</p>
              <button 
                onClick={() => setError('')}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 flex overflow-hidden">
          {/* Conversations Sidebar */}
          <div className="w-80 bg-gradient-to-br from-white/70 to-gray-50/70 backdrop-blur-sm border-r border-gray-200/50 flex flex-col">
            {/* Search and Filter */}
            <div className="p-4 border-b border-gray-200/50 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white/50 backdrop-blur-sm text-sm"
                />
              </div>
              
              {/* Filter Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                    filterType === 'all' 
                      ? 'bg-green-500 text-white' 
                      : 'bg-white/60 text-gray-600 hover:bg-white/80'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterType('students')}
                  className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                    filterType === 'students' 
                      ? 'bg-indigo-500 text-white' 
                      : 'bg-white/60 text-gray-600 hover:bg-white/80'
                  }`}
                >
                  Students
                </button>
                <button
                  onClick={() => setFilterType('teachers')}
                  className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                    filterType === 'teachers' 
                      ? 'bg-orange-500 text-white' 
                      : 'bg-white/60 text-gray-600 hover:bg-white/80'
                  }`}
                >
                  Teachers
                </button>
                <button
                  onClick={() => setFilterType('admin')}
                  className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                    filterType === 'admin' 
                      ? 'bg-purple-500 text-white' 
                      : 'bg-white/60 text-gray-600 hover:bg-white/80'
                  }`}
                >
                  Admin
                </button>
              </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium">No conversations found</p>
                  <p className="text-gray-400 text-sm mt-1">
                    {filterType === 'all' 
                      ? 'Start messaging your students or colleagues'
                      : `No ${filterType} conversations found`}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200/50">
                  {filteredConversations.map((conversation) => (
                    <button
                      key={conversation.id}
                      onClick={() => setSelectedConversation(conversation)}
                      className={`w-full p-4 text-left hover:bg-green-50/50 transition-colors duration-200 ${
                        selectedConversation?.id === conversation.id 
                          ? 'bg-gradient-to-r from-green-50 to-blue-50 border-r-4 border-green-500' 
                          : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className={`w-12 h-12 bg-gradient-to-br ${getRoleColor(conversation.participant?.role)} rounded-full flex items-center justify-center shadow-lg`}>
                            {getRoleIcon(conversation.participant?.role)}
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
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900 truncate">
                              {conversation.participant?.firstName} {conversation.participant?.lastName}
                            </p>
                            {conversation.participant?.role === 'student' && (
                              <div className="w-2 h-2 bg-indigo-400 rounded-full flex-shrink-0"></div>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 truncate capitalize">
                            {conversation.participant?.role?.replace('_', ' ')}
                          </p>
                          <p className="text-xs text-gray-500 truncate mt-1">
                            {conversation.lastMessage?.content || 'No messages yet'}
                          </p>
                        </div>
                        <div className="text-xs text-gray-400">
                          {conversation.lastMessage && formatMessageTime(conversation.lastMessage.createdAt)}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col bg-gradient-to-br from-white/50 to-green-50/30">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="bg-gradient-to-r from-white/80 to-green-50/80 backdrop-blur-sm p-4 border-b border-gray-200/50 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 bg-gradient-to-br ${getRoleColor(selectedConversation.participant?.role)} rounded-full flex items-center justify-center shadow-lg`}>
                        {getRoleIcon(selectedConversation.participant?.role)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {selectedConversation.participant?.firstName} {selectedConversation.participant?.lastName}
                        </h3>
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-gray-600 capitalize">
                            {selectedConversation.participant?.role?.replace('_', ' ')}
                          </p>
                          {selectedConversation.participant?.role === 'student' && (
                            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                              Your Student
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100/50 rounded-lg transition-colors">
                        <Calendar className="w-5 h-5" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100/50 rounded-lg transition-colors">
                        <Phone className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.fromCurrentUser ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-lg ${
                          message.fromCurrentUser
                            ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white'
                            : 'bg-white border border-gray-200/50'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <div className="flex items-center justify-between mt-2">
                          <p
                            className={`text-xs ${
                              message.fromCurrentUser
                                ? 'text-green-100'
                                : 'text-gray-500'
                            }`}
                          >
                            {formatMessageTime(message.createdAt)}
                          </p>
                          {message.fromCurrentUser && (
                            <CheckCircle className="w-3 h-3 text-green-200" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="bg-gradient-to-r from-white/80 to-green-50/80 backdrop-blur-sm p-4 border-t border-gray-200/50">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="w-full px-4 py-3 pr-12 border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white/70 backdrop-blur-sm"
                        disabled={sendingMessage}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage(e);
                          }
                        }}
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
                      disabled={!newMessage.trim() || sendingMessage}
                      className="p-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl hover:from-blue-500 hover:to-purple-500 transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      {sendingMessage ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-10 h-10 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium text-lg">Select a conversation</p>
                  <p className="text-gray-400 text-sm mt-1">Choose a student or colleague to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassTeacherMessagesPage;