// src/app/protected/students/tests/page.jsx
'use client';
import React, { useState, useEffect } from 'react';
import {
  FileText,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Eye,
  PlayCircle,
  Loader2,
  BookOpen,
  Award,
  TrendingUp,
  Filter,
  Search
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const StudentOnlineTests = () => {
  const router = useRouter();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('available');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTests();
  }, [filterStatus]);

  const fetchTests = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);

      const response = await fetch(`/api/protected/students/tests?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch tests: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setTests(data.data.tests || []);
      } else {
        throw new Error(data.error || 'Failed to load tests');
      }
    } catch (err) {
      setError(err.message);
      console.error('Fetch tests error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (test) => {
    const now = new Date();
    const availableFrom = new Date(test.availableFrom);
    const dueDate = new Date(test.dueDate);
    
    if (test.mySubmission) {
      if (test.mySubmission.status === 'graded') {
        return { text: 'Completed', color: 'bg-green-100 text-green-800', icon: CheckCircle2 };
      }
      return { text: 'Submitted', color: 'bg-blue-100 text-blue-800', icon: Clock };
    }
    
    if (now < availableFrom) {
      return { text: 'Upcoming', color: 'bg-purple-100 text-purple-800', icon: Calendar };
    }
    
    if (now > dueDate) {
      return { text: 'Expired', color: 'bg-red-100 text-red-800', icon: AlertTriangle };
    }
    
    return { text: 'Available', color: 'bg-yellow-100 text-yellow-800', icon: PlayCircle };
  };

  const getTimeRemaining = (dueDate) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diff = due - now;
    
    if (diff < 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days} day${days !== 1 ? 's' : ''} left`;
    if (hours > 0) return `${hours} hour${hours !== 1 ? 's' : ''} left`;
    return 'Due soon';
  };

  const handleStartTest = (testId) => {
    router.push(`/protected/students/tests/${testId}`);
  };

  const handleViewResult = (testId) => {
    router.push(`/protected/students/tests/result/${testId}`);
  };

  const filteredTests = tests.filter(test => {
    if (searchTerm) {
      return test.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
             test.subject.name.toLowerCase().includes(searchTerm.toLowerCase());
    }
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 flex items-center space-x-4">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
          <span className="text-gray-700">Loading tests...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-red-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Tests</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchTests}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Online Tests & Exams</h1>
              <p className="text-gray-600 mt-1">
                Take your tests online • {filteredTests.length} test{filteredTests.length !== 1 ? 's' : ''} available
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Available Tests</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {tests.filter(t => !t.mySubmission && new Date() >= new Date(t.availableFrom) && new Date() <= new Date(t.dueDate)).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <PlayCircle className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-3xl font-bold text-green-600">
                  {tests.filter(t => t.mySubmission?.status === 'graded').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-3xl font-bold text-blue-600">
                  {tests.filter(t => t.mySubmission && t.mySubmission.status !== 'graded').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Score</p>
                <p className="text-3xl font-bold text-purple-600">
                  {tests.filter(t => t.mySubmission?.score).length > 0
                    ? Math.round(
                        tests
                          .filter(t => t.mySubmission?.score)
                          .reduce((sum, t) => sum + (t.mySubmission.score / t.mySubmission.maxScore * 100), 0) /
                          tests.filter(t => t.mySubmission?.score).length
                      )
                    : 0}%
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8 border border-gray-100">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="sm:w-48">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All Tests</option>
                <option value="available">Available</option>
                <option value="upcoming">Upcoming</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tests Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredTests.map((test) => {
            const statusBadge = getStatusBadge(test);
            const StatusIcon = statusBadge.icon;
            const now = new Date();
            const isAvailable = !test.mySubmission && 
                              now >= new Date(test.availableFrom) && 
                              now <= new Date(test.dueDate);
            
            return (
              <div key={test.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{test.title}</h3>
                      <p className="text-sm text-gray-600">{test.subject.name}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusBadge.color}`}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {statusBadge.text}
                  </span>
                </div>

                {test.description && (
                  <p className="text-sm text-gray-600 mb-4">{test.description}</p>
                )}

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>{test.testConfig?.duration || 60} mins</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <BookOpen className="w-4 h-4" />
                    <span>{test.testConfig?.questions?.length || 0} questions</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Award className="w-4 h-4" />
                    <span>{test.maxScore} marks</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(test.dueDate).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Time Remaining Bar */}
                {!test.mySubmission && now <= new Date(test.dueDate) && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                      <span>{getTimeRemaining(test.dueDate)}</span>
                      <span>Due: {new Date(test.dueDate).toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          ((new Date(test.dueDate) - now) / (1000 * 60 * 60 * 24)) < 1 
                            ? 'bg-red-500' 
                            : 'bg-yellow-500'
                        }`}
                        style={{ 
                          width: `${Math.max(0, Math.min(100, 
                            ((new Date(test.dueDate) - now) / (new Date(test.dueDate) - new Date(test.availableFrom))) * 100
                          ))}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Submission Info */}
                {test.mySubmission && (
                  <div className={`mb-4 p-3 rounded-lg ${
                    test.mySubmission.status === 'graded' 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-blue-50 border border-blue-200'
                  }`}>
                    {test.mySubmission.status === 'graded' ? (
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-green-800">Score</span>
                          <span className="text-lg font-bold text-green-600">
                            {test.mySubmission.score}/{test.mySubmission.maxScore}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-green-700">Percentage</span>
                          <span className="text-sm font-semibold text-green-600">
                            {Math.round((test.mySubmission.score / test.mySubmission.maxScore) * 100)}%
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-blue-800">
                        <p className="font-medium">Submitted - Awaiting Grading</p>
                        <p className="text-xs text-blue-600 mt-1">
                          Submitted on {new Date(test.mySubmission.submittedAt).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Instructions Preview */}
                {test.instructions && (
                  <div className="mb-4 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                    <span className="font-medium">Instructions: </span>
                    {test.instructions.substring(0, 100)}
                    {test.instructions.length > 100 && '...'}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  {isAvailable ? (
                    <button
                      onClick={() => handleStartTest(test.id)}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-medium flex items-center justify-center space-x-2"
                    >
                      <PlayCircle className="w-5 h-5" />
                      <span>Start Test</span>
                    </button>
                  ) : test.mySubmission ? (
                    <button
                      onClick={() => handleViewResult(test.id)}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center space-x-2"
                    >
                      <Eye className="w-5 h-5" />
                      <span>View Result</span>
                    </button>
                  ) : (
                    <button
                      disabled
                      className="flex-1 px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed font-medium"
                    >
                      Not Available
                    </button>
                  )}
                </div>

                {/* Test Settings Info */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex flex-wrap gap-2 text-xs">
                    {test.testConfig?.allowRetake && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">Retakes Allowed</span>
                    )}
                    {test.testConfig?.showResultsImmediately && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded">Instant Results</span>
                    )}
                    {test.testConfig?.shuffleQuestions && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">Shuffled</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredTests.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Tests Found</h3>
            <p className="text-gray-600">
              {searchTerm || filterStatus !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'No tests have been assigned yet.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentOnlineTests;