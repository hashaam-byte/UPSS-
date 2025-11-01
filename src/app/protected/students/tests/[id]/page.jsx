// src/app/protected/students/tests/[id]/page.jsx
'use client';
import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  AlertTriangle,
  Save,
  Send,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

const TakeTestPage = () => {
  const params = useParams();
  const router = useRouter();
  const testId = params.id;
  
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [started, setStarted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Test state
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [flaggedQuestions, setFlaggedQuestions] = useState(new Set());
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    fetchTest();
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [testId]);

  useEffect(() => {
    if (started && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [started, timeRemaining]);

  const fetchTest = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/protected/students/tests/${testId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch test');
      }

      const data = await response.json();
      
      if (data.success) {
        setTest(data.data.test);
        // Check if already submitted
        if (data.data.test.mySubmission && !data.data.test.testConfig.allowRetake) {
          router.push(`/protected/students/tests/result/${testId}`);
        }
      } else {
        throw new Error(data.error || 'Failed to load test');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTest = () => {
    startTimeRef.current = Date.now();
    setTimeRemaining(test.testConfig.duration * 60);
    setStarted(true);
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const toggleFlagQuestion = (questionIndex) => {
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionIndex)) {
        newSet.delete(questionIndex);
      } else {
        newSet.add(questionIndex);
      }
      return newSet;
    });
  };

  const handleAutoSubmit = async () => {
    await submitTest(true);
  };

  const submitTest = async (autoSubmit = false) => {
    try {
      setSubmitting(true);
      
      const timeSpent = startTimeRef.current 
        ? Math.floor((Date.now() - startTimeRef.current) / 1000)
        : 0;

      const response = await fetch('/api/protected/students/tests/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          testId: testId,
          answers: answers,
          timeSpent: timeSpent,
          autoSubmit: autoSubmit
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit test');
      }

      const data = await response.json();
      
      if (data.success) {
        router.push(`/protected/students/tests/result/${testId}`);
      } else {
        throw new Error(data.error || 'Submission failed');
      }
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getAnsweredCount = () => {
    return Object.keys(answers).length;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 flex items-center space-x-4">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
          <span className="text-gray-700">Loading test...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-red-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!test) return null;

  const questions = test.testConfig.questions || [];
  const currentQ = questions[currentQuestion];

  // Pre-start screen
  if (!started) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{test.title}</h1>
            <p className="text-gray-600">{test.subject.name}</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Test Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Duration</p>
                <p className="font-semibold">{test.testConfig.duration} minutes</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Questions</p>
                <p className="font-semibold">{questions.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Marks</p>
                <p className="font-semibold">{test.maxScore}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Passing Marks</p>
                <p className="font-semibold">{test.passingScore || Math.ceil(test.maxScore * 0.6)}</p>
              </div>
            </div>
          </div>

          {test.instructions && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
              <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                Instructions
              </h3>
              <p className="text-sm text-blue-800 whitespace-pre-wrap">{test.instructions}</p>
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-semibold mb-1">Important Notes:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Once started, the timer cannot be paused</li>
                  <li>Make sure you have a stable internet connection</li>
                  <li>Your answers are auto-saved as you progress</li>
                  <li>The test will auto-submit when time expires</li>
                  {!test.testConfig.allowRetake && <li>You can only attempt this test once</li>}
                </ul>
              </div>
            </div>
          </div>

          <button
            onClick={handleStartTest}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all font-semibold text-lg"
          >
            Start Test
          </button>
        </div>
      </div>
    );
  }

  // Test in progress
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Fixed Header with Timer */}
      <div className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{test.title}</h1>
              <p className="text-sm text-gray-600">{test.subject.name}</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                timeRemaining < 300 ? 'bg-red-100 text-red-700' : 
                timeRemaining < 600 ? 'bg-yellow-100 text-yellow-700' : 
                'bg-green-100 text-green-700'
              }`}>
                <Clock className="w-5 h-5" />
                <span className="font-mono font-bold text-lg">{formatTime(timeRemaining)}</span>
              </div>
              
              <button
                onClick={() => setShowSubmitConfirm(true)}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center space-x-2"
              >
                <Send className="w-5 h-5" />
                <span>Submit Test</span>
              </button>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Question {currentQuestion + 1} of {questions.length}</span>
              <span>{getAnsweredCount()} answered</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question Navigation Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-32">
              <h3 className="font-semibold text-gray-900 mb-4">Questions</h3>
              <div className="grid grid-cols-5 gap-2">
                {questions.map((q, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentQuestion(index)}
                    className={`relative aspect-square rounded-lg font-medium text-sm transition-all ${
                      currentQuestion === index
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg scale-110'
                        : answers[q.id]
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {index + 1}
                    {flaggedQuestions.has(index) && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border-2 border-white"></span>
                    )}
                  </button>
                ))}
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="space-y-2 text-xs">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-green-100 rounded"></div>
                    <span className="text-gray-600">Answered ({getAnsweredCount()})</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-gray-100 rounded"></div>
                    <span className="text-gray-600">Not answered ({questions.length - getAnsweredCount()})</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-yellow-400 rounded-full"></div>
                    <span className="text-gray-600">Flagged ({flaggedQuestions.size})</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Question Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-4">
                    <span className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      currentQ.type === 'objective' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {currentQ.type === 'objective' ? 'Multiple Choice' : 'Essay Question'}
                    </span>
                    <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium">
                      {currentQ.marks} mark{currentQ.marks !== 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Question {currentQuestion + 1}
                  </h2>
                  <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap">
                    {currentQ.question}
                  </p>
                </div>
                
                <button
                  onClick={() => toggleFlagQuestion(currentQuestion)}
                  className={`p-2 rounded-lg transition-colors ${
                    flaggedQuestions.has(currentQuestion)
                      ? 'bg-yellow-100 text-yellow-600'
                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                  }`}
                  title="Flag for review"
                >
                  🚩
                </button>
              </div>

              <div className="mt-8">
                {currentQ.type === 'objective' ? (
                  <div className="space-y-3">
                    {currentQ.options.map((option, index) => (
                      <label
                        key={index}
                        className={`flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all ${
                          answers[currentQ.id] === index
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question-${currentQ.id}`}
                          checked={answers[currentQ.id] === index}
                          onChange={() => handleAnswerChange(currentQ.id, index)}
                          className="mt-1 mr-4 w-5 h-5 text-purple-600"
                        />
                        <div className="flex-1">
                          <span className="font-medium text-gray-900 mr-2">
                            {String.fromCharCode(65 + index)}.
                          </span>
                          <span className="text-gray-700">{option}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Answer
                    </label>
                    <textarea
                      value={answers[currentQ.id] || ''}
                      onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                      rows={12}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 resize-none"
                      placeholder="Type your answer here..."
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      Write a detailed answer. This will be manually graded by your teacher.
                    </p>
                  </div>
                )}
              </div>

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                  disabled={currentQuestion === 0}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center space-x-2"
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span>Previous</span>
                </button>

                {currentQuestion === questions.length - 1 ? (
                  <button
                    onClick={() => setShowSubmitConfirm(true)}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center space-x-2"
                  >
                    <Send className="w-5 h-5" />
                    <span>Submit Test</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setCurrentQuestion(Math.min(questions.length - 1, currentQuestion + 1))}
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center space-x-2"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Submit Test?</h3>
              <p className="text-gray-600">
                You have answered {getAnsweredCount()} out of {questions.length} questions.
              </p>
            </div>

            {getAnsweredCount() < questions.length && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-yellow-800">
                  You have {questions.length - getAnsweredCount()} unanswered question{questions.length - getAnsweredCount() !== 1 ? 's' : ''}. 
                  Are you sure you want to submit?
                </p>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Review Answers
              </button>
              <button
                onClick={() => submitTest(false)}
                disabled={submitting}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-medium flex items-center justify-center space-x-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>Submit Now</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TakeTestPage;