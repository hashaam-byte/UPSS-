'use client'
import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Search, 
  Filter, 
  Plus,
  Paperclip,
  Smile,
  MoreHorizontal,
  Phone,
  Video,
  Info,
  Archive,
  Star,
  Trash2,
  Users,
  MessageSquare,
  Clock,
  Check,
  CheckCheck,
  Circle
} from 'lucide-react';

const HeadAdminMessages = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const messagesEndRef = useRef(null);

  // Mock data
  useEffect(() => {
    const mockConversations = [
      {
        id: 1,
        name: "Rainbow College Admin",
        avatar: null,
        lastMessage: "Thank you for the quick response regarding the billing issue.",
        timestamp: "2 min ago",
        unreadCount: 0,
        isOnline: true,
        type: "school_admin",
        school: "Rainbow College"
      },
      {
        id: 2,
        name: "Future Leaders Academy",
        avatar: null,
        lastMessage: "We're experiencing issues with student enrollment.",
        timestamp: "1 hour ago",
        unreadCount: 3,
        isOnline: false,
        type: "school_admin",
        school: "Future Leaders Academy"
      },
      {
        id: 3,
        name: "Platform Administrators",
        avatar: null,
        lastMessage: "Sarah: The new analytics dashboard is ready for review.",
        timestamp: "3 hours ago",
        unreadCount: 1,
        isOnline: true,
        type: "group",
        memberCount: 4
      },
      {
        id: 4,
        name: "Excellence High School",
        avatar: null,
        lastMessage: "Our subscription expires next week. Please help with renewal.",
        timestamp: "1 day ago",
        unreadCount: 0,
        isOnline: false,
        type: "school_admin",
        school: "Excellence High School"
      },
      {
        id: 5,
        name: "Support Team",
        avatar: null,
        lastMessage: "Michael: Resolved 15 tickets today. Great work team!",
        timestamp: "2 days ago",
        unreadCount: 0,
        isOnline: true,
        type: "group",
        memberCount: 6
      }
    ];
    setConversations(mockConversations);
    setSelectedConversation(mockConversations[0]);
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      // Mock messages for selected conversation
      const mockMessages = [
        {
          id: 1,
          senderId: selectedConversation.id === 1 ? 'school_admin' : 'head_admin',
          senderName: selectedConversation.id === 1 ? 'Sarah Johnson' : 'You',
          message: "Hello! I need help with our billing setup. We're trying to upgrade to the Premium plan.",
          timestamp: "2024-09-01 10:30",
          status: "read",
          type: "text"
        },
        {
          id: 2,
          senderId: 'head_admin',
          senderName: 'You',
          message: "Hi Sarah! I'd be happy to help you with the billing upgrade. Let me check your current subscription details.",
          timestamp: "2024-09-01 10:32",
          status: "read",
          type: "text"
        },
        {
          id: 3,
          senderId: selectedConversation.id === 1 ? 'school_admin' : 'head_admin',
          senderName: selectedConversation.id === 1 ? 'Sarah Johnson' : 'You',
          message: "That would be great! We currently have 445 students and 27 teachers.",
          timestamp: "2024-09-01 10:35",
          status: "read",
          type: "text"
        },
        {
          id: 4,
          senderId: 'head_admin',
          senderName: 'You',
          message: "Perfect! Based on your numbers, the Premium plan would be ₦112,500 per term. I've generated an invoice for you. Please check your email.",
          timestamp: "2024-09-01 10:40",
          status: "delivered",
          type: "text"
        },
        {
          id: 5,
          senderId: selectedConversation.id === 1 ? 'school_admin' : 'head_admin',
          senderName: selectedConversation.id === 1 ? 'Sarah Johnson' : 'You',
          message: "Thank you for the quick response regarding the billing issue.",
          timestamp: "2024-09-01 14:28",
          status: "read",
          type: "text"
        }
      ];
      setMessages(mockMessages);
    }
  }, [selectedConversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim() && selectedConversation) {
      const message = {
        id: messages.length + 1,
        senderId: 'head_admin',
        senderName: 'You',
        message: newMessage,
        timestamp: new Date().toISOString(),
        status: 'sent',
        type: 'text'
      };
      setMessages([...messages, message]);
      setNewMessage('');
      
      // Update conversation's last message
      setConversations(prev => 
        prev.map(conv => 
          conv.id === selectedConversation.id 
            ? { ...conv, lastMessage: newMessage, timestamp: 'Just now' }
            : conv
        )
      );
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent': return <Check size={14} className="text-gray-400" />;
      case 'delivered': return <CheckCheck size={14} className="text-gray-400" />;
      case 'read': return <CheckCheck size={14} className="text-blue-500" />;
      default: return <Clock size={14} className="text-gray-400" />;
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const NewMessageModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">New Message</h3>
          <button
            onClick={() => setShowNewMessageModal(false)}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
          >
            ✕
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Recipient Type
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white">
              <option>School Administrator</option>
              <option>Platform Administrator</option>
              <option>All School Admins (Broadcast)</option>
              <option>All Platform Admins</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Recipient
            </label>
            <input
              type="text"
              placeholder="Search for recipient..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Subject
            </label>
            <input
              type="text"
              placeholder="Message subject..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Message
            </label>
            <textarea
              rows={4}
              placeholder="Type your message..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white resize-none"
            ></textarea>
          </div>
        </div>
        
        <div className="flex gap-3 pt-6 mt-6 border-t border-gray-200 dark:border-slate-700">
          <button
            onClick={() => setShowNewMessageModal(false)}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-500 to-indigo-500 text-white rounded-lg hover:from-emerald-600 hover:to-indigo-600 transition-all duration-300 font-medium">
            Send Message
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-slate-900">
      {/* Sidebar - Conversations List */}
      <div className="w-80 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-indigo-600 bg-clip-text text-transparent">
              Messages
            </h1>
            <button
              onClick={() => setShowNewMessageModal(true)}
              className="p-2 bg-gradient-to-r from-emerald-500 to-indigo-500 text-white rounded-lg hover:from-emerald-600 hover:to-indigo-600 transition-all duration-300 shadow-lg"
            >
              <Plus size={18} />
            </button>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
        
        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => setSelectedConversation(conversation)}
              className={`p-4 border-b border-gray-100 dark:border-slate-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors ${
                selectedConversation?.id === conversation.id ? 'bg-blue-50 dark:bg-blue-900/10 border-r-2 border-r-blue-500' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {conversation.type === 'group' ? (
                      <Users size={20} />
                    ) : (
                      conversation.name.split(' ').map(n => n[0]).join('').substring(0, 2)
                    )}
                  </div>
                  {conversation.isOnline && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full"></div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">{conversation.name}</h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{conversation.timestamp}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 truncate">{conversation.lastMessage}</p>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-2">
                      {conversation.type === 'school_admin' && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">{conversation.school}</span>
                      )}
                      {conversation.type === 'group' && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">{conversation.memberCount} members</span>
                      )}
                    </div>
                    {conversation.unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {selectedConversation.type === 'group' ? (
                        <Users size={18} />
                      ) : (
                        selectedConversation.name.split(' ').map(n => n[0]).join('').substring(0, 2)
                      )}
                    </div>
                    {selectedConversation.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full"></div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{selectedConversation.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedConversation.isOnline ? 'Online' : 'Last seen 2 hours ago'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                    <Phone size={18} />
                  </button>
                  <button className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                    <Video size={18} />
                  </button>
                  <button className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                    <Info size={18} />
                  </button>
                  <button className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                    <MoreHorizontal size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-slate-900">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderId === 'head_admin' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-xs lg:max-w-md xl:max-w-lg ${
                      message.senderId === 'head_admin'
                        ? 'bg-gradient-to-r from-emerald-500 to-indigo-500 text-white'
                        : 'bg-white dark:bg-slate-800 text-gray-900 dark:text-white border border-gray-200 dark:border-slate-700'
                    } rounded-2xl px-4 py-2 shadow-sm`}>
                      {message.senderId !== 'head_admin' && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{message.senderName}</p>
                      )}
                      <p className="text-sm">{message.message}</p>
                      <div className={`flex items-center justify-end gap-1 mt-1 ${
                        message.senderId === 'head_admin' ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        <span className="text-xs">{formatTime(message.timestamp)}</span>
                        {message.senderId === 'head_admin' && getStatusIcon(message.status)}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Message Input */}
            <div className="bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 p-4">
              <div className="flex items-center gap-3">
                <button className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                  <Paperclip size={18} />
                </button>
                
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type a message..."
                    className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-full focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white"
                  />
                </div>
                
                <button className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                  <Smile size={18} />
                </button>
                
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="p-2 bg-gradient-to-r from-emerald-500 to-indigo-500 text-white rounded-lg hover:from-emerald-600 hover:to-indigo-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </>
        ) : (
          /* No Conversation Selected */
          <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-slate-900">
            <div className="text-center">
              <MessageSquare size={64} className="mx-auto text-gray-400 dark:text-gray-500 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Welcome to Messages</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Select a conversation to start messaging or create a new one
              </p>
              <button
                onClick={() => setShowNewMessageModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-indigo-500 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-indigo-600 transition-all duration-300 shadow-lg"
              >
                Start New Conversation
              </button>
            </div>
          </div>
        )}
      </div>

      {/* New Message Modal */}
      {showNewMessageModal && <NewMessageModal />}
    </div>
  );
};

export default HeadAdminMessages;