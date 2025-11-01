// src/app/protected/students/tests/[id]/take/page.jsx
'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  Send,
  Save,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Eye,
  EyeOff,
  Info
} from 'lucide-react';

const TakeTestPage = () => {
  const params = useParams();
  const router = useRouter();
  const testId = params.id;

  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [showInstructions, setShowInstructions] = useState(true);
  const [testStarted, setTestStarted] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);

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
    if (testStarted && timeRemaining !== null) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timerRef.current);
    }
  }, [testStarted]);

  // Auto-save answers every 30 seconds
  useEffect(() => {
    if (testStarted) {
      const autoSaveInterval = setInterval(() => {
        autoSaveProgress();
      }, 30000);

      return () => clearInterval(autoSaveInterval);
    }
  }, [testStarted, answers]);

  const fetchTest = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/protected/students/tests/${testId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch test');
      }

      const data = await response.json();
      
      if (data.success) {
        const testData = data.data.test;
        setTest(testData);
        
        // Parse test configuration
        if (testData.testConfig) {
          let questionsList = testData.testConfig.questions;
          
          // Shuffle questions if enabled
          if (testData.testConfig.shuffleQuestions) {
            questionsList = shuffleArray([...questionsList]);
          }
          
          // Shuffle options for each question if enabled
          if (testData.testConfig.shuffleOptions) {
            questionsList = questionsList.map(q => {
              if (q.type === 'objective' && q.options) {
                const shuffled = shuffleArrayWithTracking(q.options, q.correctAnswer);
                return {
                  ...q,
                  options: shuffled.options,
                  correctAnswer: shuffled.newCorrectIndex
                };
              }
              return q;
            });
          }
          
          setQuestions(questionsList);
          setTimeRemaining(testData.testConfig.duration * 60); // Convert minutes to seconds
        }
      } else {
        throw new Error(data.error || 'Failed to load test');
      }
    } catch (err) {
      setError(err.message);
      console.error('Fetch test error:', err);
    } finally {
      setLoading(false);
    }
  };

  const shuffleArray = (array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const shuffleArrayWithTracking = (options, correctIndex) => {
    const optionsWithIndex = options.map((opt, idx) => ({ opt, idx }));
    const shuffled = shuffleArray(optionsWithIndex);
    
    return {
      options: shuffled.map(item => item.opt),
      newCorrectIndex: shuffled.findIndex(item => item.idx === correctIndex)
    };
  };

  const autoSaveProgress = async () => {
    try {
      setAutoSaving(true);
      // In a real implementation, you would save to localStorage or backend
      localStorage.setItem(`test_${testId}_progress`, JSON.stringify({
        answers,
        currentQuestion,
        timeRemaining,
        timestamp: new Date().toISOString()
      }));
      setAutoSaving(false);
    } catch (error) {
      console.error('Auto-save error:', error);
      setAutoSaving(false);
    }
  };

  const startTest = () => {
    setShowInstructions(false);
    setTestStarted(true);
    startTimeRef.current = new Date();
    
    // Try to restore progress from localStorage
    const savedProgress = localStorage.getItem(`test_${testId}_progress`);
    if (savedProgress) {
      const progress = JSON.parse(savedProgress);
      if (confirm('We found a saved progress for this test. Do you want to continue from where you left off?')) {
        setAnswers(progress.answers || {});
        setCurrentQuestion(progress.currentQuestion || 0);
        setTimeRemaining(progress.timeRemaining || timeRemaining);
      }
    }
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleAutoSubmit = () => {
    alert('Time is up! Your test will be submitted automatically.');
    submitTest();
  };

  const submitTest = async () => {
    if (submitting) return;

    try {
      setSubmitting(true);
      
      const timeSpent = startTimeRef.current 
        ? Math.floor((new Date() - startTimeRef.current) / 1000)
        : test.testConfig.duration * 60;

      const response = await fetch('/api/protected/teacher/subject/online-tests/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          testId,
          answers,
          timeSpent
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit test');
      }

      const data = await response.json();
      
      if (data.success) {
        // Clear saved progress
        localStorage.removeItem(`test_${testId}_progress`);
        
        // Show result or redirect
        if (test.testConfig?.showResultsImmediately && !data.submission.needsManualGrading) {
          router.push(`/protected/students/tests/${testId}/result?submissionId=${data.submission.id}`);
        } else {
          alert('Test submitted successfully! Your teacher will grade it soon.');
          router.push('/protected/students/tests');
        }
      } else {
        throw new Error(data.error || 'Failed to submit test');
      }
    } catch (error) {
      console.error('Submit test error:', error);
      alert('Failed to submit test: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getAnsweredCount = () => {
    return Object.keys(answers).filter(key => answers[key] !== null && answers[key] !== undefined && answers[key] !== '').length;
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
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Test</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/protected/students/tests')}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Back to Tests
          </button>
        </div>
      </div>
    );
  }

  // Instructions Screen
  if (showInstructions && !testStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{test.title}</h1>
              <p className="text-gray-600">{test.subject}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-purple-50 rounded-xl p-4 text-center border border-purple-200">
                <Clock className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Duration</p>
                <p className="text-xl font-bold text-gray-900">{test.testConfig?.duration} mins</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-200">
                <CheckCircle2 className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Questions</p>
                <p className="text-xl font-bold text-gray-900">{questions.length}</p>
              </div>
              <div className="bg-green-50 rounded-xl p-4 text-center border border-green-200">
                <AlertTriangle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Total Marks</p>
                <p className="text-xl font-bold text-gray-900">{test.maxScore}</p>
              </div>
            </div>

            {test.instructions && (
              <div className="mb-8 p-6 bg-yellow-50 rounded-xl border border-yellow-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Info className="w-5 h-5 mr-2 text-yellow-600" />
                  Important Instructions
                </h3>
                <div className="text-gray-700 whitespace-pre-wrap">{test.instructions}</div>
              </div>
            )}

            <div className="space-y-3 mb-8">
              <h3 className="font-semibold text-gray-900">General Rules:</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Once started, the timer cannot be paused</li>
                <li>Your answers are auto-saved every 30 seconds</li>
                <li>You can navigate between questions freely</li>
                <li>Submit before time runs out to avoid auto-submission</li>
                {test.testConfig?.allowRetake && <li className="text-green-600">You can retake this test if needed</li>}
                {!test.testConfig?.showResultsImmediately && <li>Results will be available after teacher review</li>}
              </ul>
            </div>

            <div className="flex justify-center">
              <button
                onClick={startTest}
                className="px-8 py-4 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl hover:from-green-600 hover:to-blue-600 transition-all font-bold text-lg shadow-lg"
              >
                Start Test Now
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Test Taking Screen
  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const isLastQuestion = currentQuestion === questions.length - 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Fixed Header with Timer */}
      <div className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{test.title}</h1>
              <p className="text-sm text-gray-600">
                Question {currentQuestion + 1} of {questions.length}
              </p>
            </div>

            <div className="flex items-center space-x-4">
              {autoSaving && (
                <span className="text-xs text-green-600 flex items-center">
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Saving...
                </span>
              )}
              
              <div className={`px-4 py-2 rounded-lg font-bold ${
                timeRemaining < 300 ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-blue-100 text-blue-700'
              }`}>
                <Clock className="w-5 h-5 inline mr-2" />
                {formatTime(timeRemaining)}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Progress: {getAnsweredCount()}/{questions.length} answered</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Question Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
              {/* Question Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                    {currentQuestion + 1}
                  </div>
                  <div>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      question.type === 'objective' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
                    }`}>
                      {question.type === 'objective' ? 'Multiple Choice' : 'Essay Question'}
                    </span>
                    <p className="text-sm text-gray-600 mt-1">{question.marks} mark(s)</p>
                  </div>
                </div>
              </div>

              {/* Question Text */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 leading-relaxed">
                  {question.question}
                </h2>
              </div>

              {/* Answer Area */}
              {question.type === 'objective' ? (
                <div className="space-y-3">
                  {question.options.map((option, index) => (
                    <label
                      key={index}
                      className={`flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        answers[question.id] === index
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${question.id}`}
                        checked={answers[question.id] === index}
                        onChange={() => handleAnswerChange(question.id, index)}
                        className="mt-1 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-3 text-gray-900 flex-1">
                        <span className="font-semibold mr-2">{String.fromCharCode(65 + index)}.</span>
                        {option}
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <div>
                  <textarea
                    value={answers[question.id] || ''}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    rows={12}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    placeholder="Type your answer here... Be clear and detailed."
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    {answers[question.id]?.length || 0} characters
                  </p>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                  disabled={currentQuestion === 0}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center space-x-2"
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span>Previous</span>
                </button>

                {isLastQuestion ? (
                  <button
                    onClick={() => setShowConfirmSubmit(true)}
                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl hover:from-green-600 hover:to-blue-600 transition-all font-medium flex items-center space-x-2"
                  >
                    <Send className="w-5 h-5" />
                    <span>Submit Test</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setCurrentQuestion(prev => Math.min(questions.length - 1, prev + 1))}
                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all font-medium flex items-center space-x-2"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Question Navigator Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 sticky top-24">
              <h3 className="font-semibold text-gray-900 mb-4">Question Navigator</h3>
              
              <div className="grid grid-cols-5 gap-2 mb-6">
                {questions.map((q, index) => {
                  const isAnswered = answers[q.id] !== null && answers[q.id] !== undefined && answers[q.id] !== '';
                  const isCurrent = index === currentQuestion;
                  
                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQuestion(index)}
                      className={`w-10 h-10 rounded-lg font-semibold transition-all ${
                        isCurrent
                          ? 'bg-blue-500 text-white ring-2 ring-blue-300'
                          : isAnswered
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      title={`Question ${index + 1}${isAnswered ? ' (Answered)' : ''}`}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <span className="text-gray-600">Current</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                  <span className="text-gray-600">Answered</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
                  <span className="text-gray-600">Not Answered</span>
                </div>
              </div>

              <button
                onClick={() => setShowConfirmSubmit(true)}
                className="w-full mt-6 px-4 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl hover:from-green-600 hover:to-blue-600 transition-all font-medium"
              >
                Submit Test
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Submit Modal */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Submit Test?</h2>
            
            <div className="mb-6 space-y-3">
              <p className="text-gray-700">
                You have answered <strong>{getAnsweredCount()} out of {questions.length}</strong> questions.
              </p>
              
              {getAnsweredCount() < questions.length && (
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 inline mr-2" />
                  <span className="text-yellow-800 text-sm">
                    {questions.length - getAnsweredCount()} question(s) unanswered
                  </span>
                </div>
              )}
              
              <p className="text-sm text-gray-600">
                Once submitted, you cannot change your answers{!test.testConfig?.allowRetake && ' or retake this test'}.
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirmSubmit(false)}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-medium"
              >
                Review Answers
              </button>
              <button
                onClick={submitTest}
                disabled={submitting}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl hover:from-green-600 hover:to-blue-600 transition-all font-medium disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 inline mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Confirm Submit'
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