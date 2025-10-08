// app/protected/teacher/subject/online-tests/create/page.jsx
'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Save, GripVertical, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';

export default function CreateOnlineTest() {
  const router = useRouter();
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [testData, setTestData] = useState({
    title: '',
    description: '',
    subjectId: '',
    testType: 'test',
    duration: 60,
    classes: [],
    scheduledDate: '',
    totalMarks: 100,
    passingMarks: 60,
    instructions: '',
    allowRetake: false,
    showResultsImmediately: true,
    shuffleQuestions: false,
    shuffleOptions: false
  });

  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/protected/teacher/subject/online-tests/create');
      if (response.ok) {
        const data = await response.json();
        setSubjects(data.subjects || []);
        setClasses(data.classes || []);
      } else {
        setError('Failed to load test creation data');
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = (type) => {
    const newQuestion = {
      id: `q_${Date.now()}`,
      type,
      question: '',
      marks: type === 'objective' ? 1 : 10,
      options: type === 'objective' ? ['', '', '', ''] : null,
      correctAnswer: type === 'objective' ? null : null,
      explanation: '',
      sampleAnswer: type === 'theory' ? '' : null
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (id, field, value) => {
    setQuestions(questions.map(q => 
      q.id === id ? { ...q, [field]: value } : q
    ));
  };

  const updateOption = (questionId, optionIndex, value) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId && q.options) {
        const newOptions = [...q.options];
        newOptions[optionIndex] = value;
        return { ...q, options: newOptions };
      }
      return q;
    }));
  };

  const deleteQuestion = (id) => {
    if (confirm('Are you sure you want to delete this question?')) {
      setQuestions(questions.filter(q => q.id !== id));
    }
  };

  const moveQuestion = (index, direction) => {
    const newQuestions = [...questions];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex >= 0 && newIndex < questions.length) {
      [newQuestions[index], newQuestions[newIndex]] = [newQuestions[newIndex], newQuestions[index]];
      setQuestions(newQuestions);
    }
  };

  const handleClassSelection = (className) => {
    setTestData(prev => ({
      ...prev,
      classes: prev.classes.includes(className)
        ? prev.classes.filter(c => c !== className)
        : [...prev.classes, className]
    }));
  };

  const calculateTotalMarks = () => {
    return questions.reduce((sum, q) => sum + Number(q.marks), 0);
  };

  const validateForm = () => {
    if (!testData.title.trim()) {
      alert('Please enter a test title');
      return false;
    }

    if (!testData.subjectId) {
      alert('Please select a subject');
      return false;
    }

    if (testData.classes.length === 0) {
      alert('Please select at least one class');
      return false;
    }

    if (questions.length === 0) {
      alert('Please add at least one question');
      return false;
    }

    // Validate each question
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      
      if (!q.question.trim()) {
        alert(`Question ${i + 1} must have text`);
        return false;
      }

      if (q.type === 'objective') {
        if (q.options.some(opt => !opt.trim())) {
          alert(`Question ${i + 1}: All options must be filled`);
          return false;
        }
        if (q.correctAnswer === null || q.correctAnswer === undefined) {
          alert(`Question ${i + 1}: Please select the correct answer`);
          return false;
        }
      }
    }

    return true;
  };

  const handleSubmit = async (status) => {
    if (!validateForm()) return;

    try {
      setSaving(true);
      setError('');

      const submitData = {
        ...testData,
        totalMarks: calculateTotalMarks(),
        questions,
        status
      };

      const response = await fetch('/api/protected/teacher/subject/online-tests/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      });

      const result = await response.json();

      if (response.ok) {
        alert(result.message || `Test ${status === 'published' ? 'published' : 'saved'} successfully!`);
        router.push('/protected/teacher/subject/online-tests');
      } else {
        setError(result.error || 'Failed to create test');
      }
    } catch (err) {
      console.error('Error creating test:', err);
      setError('Network error occurred');
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
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Create Online Test/Exam</h1>
                <p className="text-gray-600 mt-1">Create objective and theory questions with automatic grading</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.back()}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={() => handleSubmit('draft')}
                disabled={saving}
                className="px-4 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 disabled:opacity-50"
              >
                Save Draft
              </button>
              <button
                onClick={() => handleSubmit('published')}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Publish Test
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Test Details */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Details</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-2">
                Test Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={testData.title}
                onChange={(e) => setTestData({ ...testData, title: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Mathematics Mid-Term Exam"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Subject <span className="text-red-500">*</span>
              </label>
              <select
                value={testData.subjectId}
                onChange={(e) => setTestData({ ...testData, subjectId: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Subject</option>
                {subjects.map(ts => (
                  <option key={ts.subject.id} value={ts.subject.id}>
                    {ts.subject.name} ({ts.subject.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Test Type <span className="text-red-500">*</span>
              </label>
              <select
                value={testData.testType}
                onChange={(e) => setTestData({ ...testData, testType: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="test">Class Test</option>
                <option value="exam">Examination</option>
                <option value="quiz">Quiz</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Duration (minutes)</label>
              <input
                type="number"
                value={testData.duration}
                onChange={(e) => setTestData({ ...testData, duration: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Scheduled Date & Time</label>
              <input
                type="datetime-local"
                value={testData.scheduledDate}
                onChange={(e) => setTestData({ ...testData, scheduledDate: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={testData.description}
                onChange={(e) => setTestData({ ...testData, description: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="Brief description of the test"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium mb-2">Instructions for Students</label>
              <textarea
                value={testData.instructions}
                onChange={(e) => setTestData({ ...testData, instructions: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Important instructions students should read before starting"
              />
            </div>
          </div>

          {/* Class Selection */}
          <div className="mt-6">
            <label className="block text-sm font-medium mb-2">
              Select Classes <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {classes.map(className => (
                <label
                  key={className}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                    testData.classes.includes(className) ? 'bg-blue-50 border-blue-500' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={testData.classes.includes(className)}
                    onChange={() => handleClassSelection(className)}
                    className="mr-2"
                  />
                  <span className="text-sm">{className}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Settings */}
          <div className="mt-6 border-t pt-4">
            <h3 className="text-sm font-semibold mb-3">Test Settings</h3>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={testData.allowRetake}
                  onChange={(e) => setTestData({ ...testData, allowRetake: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm">Allow students to retake test</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={testData.showResultsImmediately}
                  onChange={(e) => setTestData({ ...testData, showResultsImmediately: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm">Show results immediately after submission</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={testData.shuffleQuestions}
                  onChange={(e) => setTestData({ ...testData, shuffleQuestions: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm">Shuffle questions order</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={testData.shuffleOptions}
                  onChange={(e) => setTestData({ ...testData, shuffleOptions: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm">Shuffle answer options (MCQ)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Questions Section */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold">Questions</h2>
              <p className="text-sm text-gray-600 mt-1">
                {questions.length} questions • {calculateTotalMarks()} total marks
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => addQuestion('objective')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Objective (MCQ)
              </button>
              <button
                onClick={() => addQuestion('theory')}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Theory
              </button>
            </div>
          </div>

          {questions.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500 mb-4">No questions added yet</p>
              <p className="text-sm text-gray-400">Click "Add Objective" or "Add Theory" to create questions</p>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((question, index) => (
                <div key={question.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => moveQuestion(index, 'up')}
                          disabled={index === 0}
                          className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                        >
                          ▲
                        </button>
                        <GripVertical className="w-5 h-5 text-gray-400" />
                        <button
                          onClick={() => moveQuestion(index, 'down')}
                          disabled={index === questions.length - 1}
                          className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                        >
                          ▼
                        </button>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        question.type === 'objective' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {question.type === 'objective' ? 'Objective' : 'Theory'} • Q{index + 1}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={question.marks}
                        onChange={(e) => updateQuestion(question.id, 'marks', parseInt(e.target.value) || 1)}
                        className="w-16 px-2 py-1 border rounded text-sm"
                        min="1"
                      />
                      <span className="text-sm text-gray-600">marks</span>
                      <button
                        onClick={() => deleteQuestion(question.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Question Text <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={question.question}
                        onChange={(e) => updateQuestion(question.id, 'question', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg"
                        rows={2}
                        placeholder="Enter your question here..."
                      />
                    </div>

                    {question.type === 'objective' ? (
                      <>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Answer Options <span className="text-red-500">*</span>
                          </label>
                          <div className="space-y-2">
                            {question.options.map((option, optIndex) => (
                              <div key={optIndex} className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  name={`correct-${question.id}`}
                                  checked={question.correctAnswer === optIndex}
                                  onChange={() => updateQuestion(question.id, 'correctAnswer', optIndex)}
                                  className="text-green-600"
                                />
                                <span className="text-sm font-medium w-6">
                                  {String.fromCharCode(65 + optIndex)}.
                                </span>
                                <input
                                  type="text"
                                  value={option}
                                  onChange={(e) => updateOption(question.id, optIndex, e.target.value)}
                                  className="flex-1 px-3 py-2 border rounded-lg"
                                  placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
                                />
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Select the radio button next to the correct answer
                          </p>
                        </div>
                      </>
                    ) : (
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Sample/Expected Answer (for grading reference)
                        </label>
                        <textarea
                          value={question.sampleAnswer}
                          onChange={(e) => updateQuestion(question.id, 'sampleAnswer', e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg"
                          rows={3}
                          placeholder="Provide a sample answer or key points students should include..."
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Explanation (shown after submission)
                      </label>
                      <textarea
                        value={question.explanation}
                        onChange={(e) => updateQuestion(question.id, 'explanation', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg"
                        rows={2}
                        placeholder="Optional: Explain the correct answer..."
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary */}
        {questions.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">Test Summary</p>
                <p className="text-sm text-gray-600 mt-1">
                  {questions.length} questions • {calculateTotalMarks()} total marks • 
                  {questions.filter(q => q.type === 'objective').length} objective • 
                  {questions.filter(q => q.type === 'theory').length} theory
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Passing Marks</p>
                <input
                  type="number"
                  value={testData.passingMarks}
                  onChange={(e) => setTestData({ ...testData, passingMarks: parseInt(e.target.value) })}
                  className="w-20 px-2 py-1 border rounded text-center font-semibold"
                  min="0"
                  max={calculateTotalMarks()}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}