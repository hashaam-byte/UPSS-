// src/app/protected/students/tests/result/[id]/page.jsx
'use client';
import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  Award,
  TrendingUp,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Download,
  Eye,
  BookOpen
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

const TestResultPage = () => {
  const params = useParams();
  const router = useRouter();
  const testId = params.id;
  
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAnswers, setShowAnswers] = useState(false);

  useEffect(() => {
    fetchResult();
  }, [testId]);

  const fetchResult = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/protected/students/tests/result/${testId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch result');
      }

      const data = await response.json();
      
      if (data.success) {
        setResult(data.data);
      } else {
        throw new Error(data.error || 'Failed to load result');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 flex items-center space-x-4">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
          <span className="text-gray-700">Loading result...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-red-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
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

  if (!result) return null;

  const { test, submission, details, statistics } = result;
  const percentage = submission.score ? Math.round((submission.score / submission.maxScore) * 100) : 0;
  const passed = percentage >= (test.passingScore ? (test.passingScore / test.maxScore * 100) : 60);
  
  const getGradeColor = () => {
    if (percentage >= 90) return 'text-green-600 bg-green-100';
    if (percentage >= 80) return 'text-blue-600 bg-blue-100';
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-100';
    if (percentage >= 60) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => router.push('/protected/students/tests')}
            className="flex items-center text-purple-600 hover:text-purple-700 mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Tests
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{test.title}</h1>
              <p className="text-gray-600 mt-1">{test.subject.name} • {test.assignmentType}</p>
            </div>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
            >
              <Download className="w-5 h-5" />
              <span>Download Result</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Result Status Banner */}
        {submission.status === 'graded' ? (
          <div className={`mb-8 p-8 rounded-2xl shadow-lg ${
            passed 
              ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
              : 'bg-gradient-to-r from-red-500 to-pink-600'
          } text-white`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  {passed ? (
                    <CheckCircle className="w-12 h-12" />
                  ) : (
                    <XCircle className="w-12 h-12" />
                  )}
                  <h2 className="text-3xl font-bold">
                    {passed ? 'Congratulations!' : 'Keep Trying!'}
                  </h2>
                </div>
                <p className="text-white/90">
                  {passed 
                    ? 'You have successfully passed this test.' 
                    : 'You can review your answers and try again next time.'}
                </p>
              </div>
              <div className="text-right">
                <div className="text-6xl font-bold mb-2">{percentage}%</div>
                <div className="text-xl">{submission.score}/{submission.maxScore} marks</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-8 p-8 rounded-2xl shadow-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white">
            <div className="flex items-center space-x-4">
              <Clock className="w-12 h-12" />
              <div>
                <h2 className="text-2xl font-bold mb-2">Awaiting Grading</h2>
                <p className="text-white/90">
                  Your test has been submitted and is being reviewed by your teacher. 
                  You'll be notified once grading is complete.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Statistics Grid */}
        {submission.status === 'graded' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Score</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {submission.score}/{submission.maxScore}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Award className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>

            {statistics && (
              <>
                <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Correct</p>
                      <p className="text-3xl font-bold text-green-600">
                        {statistics.correctAnswers}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Incorrect</p>
                      <p className="text-3xl font-bold text-red-600">
                        {statistics.incorrectAnswers}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                      <XCircle className="w-6 h-6 text-red-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Time Taken</p>
                      <p className="text-3xl font-bold text-blue-600">
                        {Math.floor(details.timeSpent / 60)}m
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Clock className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Submission Details */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Submission Details</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Submitted At</p>
              <p className="font-semibold">{new Date(submission.submittedAt).toLocaleString()}</p>
            </div>
            {submission.status === 'graded' && submission.gradedAt && (
              <div>
                <p className="text-sm text-gray-600">Graded At</p>
                <p className="font-semibold">{new Date(submission.gradedAt).toLocaleString()}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                submission.status === 'graded' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
              }`}>
                {submission.status}
              </span>
            </div>
            {submission.isLateSubmission && (
              <div>
                <p className="text-sm text-gray-600">Submission Type</p>
                <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  Late Submission
                </span>
              </div>
            )}
          </div>

          {submission.feedback && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-2">Teacher's Feedback</p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-gray-800">{submission.feedback}</p>
              </div>
            </div>
          )}
        </div>

        {/* Answers Review */}
        {submission.status === 'graded' && details && details.answers && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Answer Review</h3>
              <button
                onClick={() => setShowAnswers(!showAnswers)}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
              >
                <Eye className="w-5 h-5" />
                <span>{showAnswers ? 'Hide' : 'Show'} Answers</span>
              </button>
            </div>

            {showAnswers && (
              <div className="space-y-6">
                {details.answers.map((answer, index) => (
                  <div
                    key={index}
                    className={`p-6 rounded-xl border-2 ${
                      answer.type === 'objective'
                        ? answer.isCorrect
                          ? 'border-green-200 bg-green-50'
                          : 'border-red-200 bg-red-50'
                        : 'border-blue-200 bg-blue-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          answer.type === 'objective'
                            ? answer.isCorrect
                              ? 'bg-green-500 text-white'
                              : 'bg-red-500 text-white'
                            : 'bg-blue-500 text-white'
                        }`}>
                          {answer.type === 'objective' ? (
                            answer.isCorrect ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />
                          ) : (
                            <BookOpen className="w-5 h-5" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-sm font-medium text-gray-700">Question {index + 1}</span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              answer.type === 'objective' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
                            }`}>
                              {answer.type === 'objective' ? 'Multiple Choice' : 'Essay'}
                            </span>
                          </div>
                          <p className="text-gray-900 font-medium">{answer.question}</p>
                        </div>
                      </div>
                      <div className="ml-4 text-right">
                        <div className="text-sm text-gray-600">Score</div>
                        <div className="text-lg font-bold">
                          {answer.scored !== null ? answer.scored : '-'}/{answer.marks}
                        </div>
                      </div>
                    </div>

                    {answer.type === 'objective' ? (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-700">Your Answer:</span>
                          <span className={`font-semibold ${answer.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                            {String.fromCharCode(65 + answer.studentAnswer)}
                          </span>
                        </div>
                        {!answer.isCorrect && (
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-700">Correct Answer:</span>
                            <span className="font-semibold text-green-600">
                              {String.fromCharCode(65 + answer.correctAnswer)}
                            </span>
                          </div>
                        )}
                        {answer.explanation && (
                          <div className="mt-3 p-3 bg-white/50 rounded-lg">
                            <p className="text-sm font-medium text-gray-700 mb-1">Explanation:</p>
                            <p className="text-sm text-gray-600">{answer.explanation}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Your Answer:</p>
                          <div className="p-3 bg-white/50 rounded-lg">
                            <p className="text-sm text-gray-800 whitespace-pre-wrap">
                              {answer.studentAnswer || 'No answer provided'}
                            </p>
                          </div>
                        </div>
                        {answer.teacherFeedback && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-1">Teacher's Feedback:</p>
                            <div className="p-3 bg-blue-100 rounded-lg">
                              <p className="text-sm text-blue-900">{answer.teacherFeedback}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Performance Tips */}
        {submission.status === 'graded' && !passed && (
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
            <div className="flex items-start space-x-3">
              <TrendingUp className="w-6 h-6 text-yellow-600 mt-1" />
              <div>
                <h3 className="font-semibold text-yellow-900 mb-2">Tips for Improvement</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800">
                  <li>Review the questions you got wrong and understand the correct answers</li>
                  <li>Consult your teacher or classmates if you need clarification</li>
                  <li>Practice similar questions to improve your understanding</li>
                  <li>Manage your time better in the next test</li>
                  <li>Review course materials regularly, not just before tests</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestResultPage;