import React, { useState, useEffect } from 'react';
import { User, CheckCircle, Save, ArrowLeft, Loader2 } from 'lucide-react';

export default function TheoryGradingInterface({ testId }) {
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [grades, setGrades] = useState({});
  const [feedback, setFeedback] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSubmissions();
  }, [testId]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const url = testId 
        ? `/api/protected/teacher/subject/online-tests/grade-theory?testId=${testId}`
        : '/api/protected/teacher/subject/online-tests/grade-theory';
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data.submissions || []);
        if (data.submissions && data.submissions.length > 0) {
          setSelectedSubmission(data.submissions[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGradeChange = (questionId, score) => {
    setGrades(prev => ({
      ...prev,
      [questionId]: score
    }));
  };

  const handleFeedbackChange = (questionId, text) => {
    setFeedback(prev => ({
      ...prev,
      [questionId]: text
    }));
  };

  const submitGrades = async () => {
    if (!selectedSubmission) return;

    // Validate all questions are graded
    const allGraded = selectedSubmission.answers.every(answer => 
      grades[answer.questionId] !== undefined && grades[answer.questionId] !== ''
    );

    if (!allGraded) {
      alert('Please grade all theory questions before submitting');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('/api/protected/teacher/subject/online-tests/grade-theory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: selectedSubmission.id,
          theoryGrades: grades,
          feedback: {
            ...feedback,
            general: feedback.general || ''
          }
        })
      });

      if (response.ok) {
        alert('Grades submitted successfully!');
        setGrades({});
        setFeedback({});
        fetchSubmissions(); // Refresh list
      } else {
        alert('Failed to submit grades');
      }
    } catch (error) {
      console.error('Error submitting grades:', error);
      alert('Failed to submit grades');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => window.history.back()}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Grade Theory Questions</h1>
                <p className="text-gray-600 mt-1">
                  {submissions.length} submission{submissions.length !== 1 ? 's' : ''} need grading
                </p>
              </div>
            </div>
          </div>
        </div>

        {submissions.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">All Caught Up!</h3>
            <p className="text-gray-600">No theory questions need grading at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Submissions List */}
            <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Submissions</h3>
              <div className="space-y-2">
                {submissions.map((submission) => (
                  <button
                    key={submission.id}
                    onClick={() => {
                      setSelectedSubmission(submission);
                      setGrades({});
                      setFeedback({});
                    }}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedSubmission?.id === submission.id
                        ? 'bg-blue-50 border-2 border-blue-500'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-4 h-4 text-gray-600" />
                      <p className="font-medium text-sm">{submission.student.name}</p>
                    </div>
                    <p className="text-xs text-gray-600">{submission.student.className}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {submission.assignment.title}
                    </p>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="text-gray-600">Objective: {submission.objectiveScore}/{submission.objectiveMaxScore}</span>
                      <span className="text-orange-600 font-medium">Theory: {submission.theoryMaxScore}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Grading Panel */}
            <div className="lg:col-span-3 space-y-6">
              {selectedSubmission && (
                <>
                  {/* Student Info */}
                  <div className="bg-white rounded-2xl shadow-sm p-6">
                    <h3 className="text-xl font-semibold mb-4">Student Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Student Name</p>
                        <p className="font-medium">{selectedSubmission.student.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Class</p>
                        <p className="font-medium">{selectedSubmission.student.className}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Test</p>
                        <p className="font-medium">{selectedSubmission.assignment.title}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Submitted</p>
                        <p className="font-medium">{new Date(selectedSubmission.submittedAt).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Objective Score:</span>
                        <span className="font-bold text-blue-600">
                          {selectedSubmission.objectiveScore}/{selectedSubmission.objectiveMaxScore}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm text-gray-700">Theory Total:</span>
                        <span className="font-bold text-orange-600">
                          {selectedSubmission.theoryMaxScore} marks
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Theory Questions */}
                  {selectedSubmission.answers.map((answer, index) => (
                    <div key={answer.questionId} className="bg-white rounded-2xl shadow-sm p-6">
                      <div className="flex items-start justify-between mb-4">
                        <h4 className="text-lg font-semibold text-gray-900">
                          Question {index + 1}
                        </h4>
                        <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                          {answer.marks} marks
                        </span>
                      </div>

                      <div className="space-y-4">
                        {/* Question Text */}
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Question:</p>
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-gray-900">{answer.question}</p>
                          </div>
                        </div>

                        {/* Sample Answer */}
                        {answer.sampleAnswer && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Expected Answer:</p>
                            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                              <p className="text-gray-900 whitespace-pre-wrap">{answer.sampleAnswer}</p>
                            </div>
                          </div>
                        )}

                        {/* Student Answer */}
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Student's Answer:</p>
                          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-gray-900 whitespace-pre-wrap">{answer.studentAnswer || 'No answer provided'}</p>
                          </div>
                        </div>

                        {/* Grading Input */}
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Score (out of {answer.marks}) *
                            </label>
                            <input
                              type="number"
                              min="0"
                              max={answer.marks}
                              step="0.5"
                              value={grades[answer.questionId] || ''}
                              onChange={(e) => handleGradeChange(answer.questionId, e.target.value)}
                              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                              placeholder="Enter score"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Feedback (optional)
                            </label>
                            <input
                              type="text"
                              value={feedback[answer.questionId] || ''}
                              onChange={(e) => handleFeedbackChange(answer.questionId, e.target.value)}
                              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                              placeholder="Optional feedback"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* General Feedback & Submit */}
                  <div className="bg-white rounded-2xl shadow-sm p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Overall Feedback</h4>
                    <textarea
                      value={feedback.general || ''}
                      onChange={(e) => setFeedback({ ...feedback, general: e.target.value })}
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows={4}
                      placeholder="Provide overall feedback to the student (optional)..."
                    />

                    <div className="mt-6 flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        <p>Total Score: <span className="font-bold text-lg text-gray-900">
                          {selectedSubmission.objectiveScore + Object.values(grades).reduce((sum, val) => sum + (parseFloat(val) || 0), 0)}
                        </span> / {selectedSubmission.objectiveMaxScore + selectedSubmission.theoryMaxScore}</p>
                      </div>
                      <button
                        onClick={submitGrades}
                        disabled={saving}
                        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-5 h-5" />
                            Submit Grades
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}