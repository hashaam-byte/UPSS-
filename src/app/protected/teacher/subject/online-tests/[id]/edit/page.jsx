'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Save, Plus, Trash2, GripVertical, 
  Clock, Calendar, Users, Settings, Loader2, AlertCircle 
} from 'lucide-react';

export default function EditOnlineTest() {
  const params = useParams();
  const router = useRouter();
  const testId = params.id;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [errors, setErrors] = useState({});

  // Test Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subjectId: '',
    testType: 'exam',
    duration: 60,
    classes: [],
    scheduledDate: '',
    totalMarks: 100,
    passingMarks: 60,
    instructions: '',
    allowRetake: false,
    showResultsImmediately: true,
    shuffleQuestions: false,
    shuffleOptions: false,
    status: 'draft'
  });

  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    fetchData();
  }, [testId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch test details
      const testResponse = await fetch(`/api/protected/teacher/subject/online-tests?status=all`);
      if (testResponse.ok) {
        const testData = await testResponse.json();
        const test = testData.tests.find(t => t.id === testId);
        
        if (test) {
          // Parse test config
          let testConfig = null;
          if (test.attachments && test.attachments.length > 0) {
            testConfig = JSON.parse(test.attachments[0]);
          }

          // Populate form
          setFormData({
            title: test.title,
            description: test.description || '',
            subjectId: test.subject.id,
            testType: test.assignmentType === 'exam' ? 'test' : test.assignmentType,
            duration: testConfig?.duration || 60,
            classes: test.classes || [],
            scheduledDate: test.availableFrom ? new Date(test.availableFrom).toISOString().slice(0, 16) : '',
            totalMarks: test.maxScore,
            passingMarks: test.passingScore,
            instructions: test.instructions || '',
            allowRetake: testConfig?.allowRetake || false,
            showResultsImmediately: testConfig?.showResultsImmediately || true,
            shuffleQuestions: testConfig?.shuffleQuestions || false,
            shuffleOptions: testConfig?.shuffleOptions || false,
            status: test.status === 'active' ? 'published' : test.status
          });

          setQuestions(testConfig?.questions || []);
        }
      }

      // Fetch subjects and classes
      const subjectsResponse = await fetch('/api/protected/teacher/subject/online-tests/create');
      if (subjectsResponse.ok) {
        const data = await subjectsResponse.json();
        setSubjects(data.subjects || []);
        setClasses(data.classes || []);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.subjectId) newErrors.subjectId = 'Subject is required';
    if (formData.classes.length === 0) newErrors.classes = 'Select at least one class';
    if (questions.length === 0) newErrors.questions = 'Add at least one question';
    if (formData.totalMarks <= 0) newErrors.totalMarks = 'Total marks must be greater than 0';
    if (formData.passingMarks > formData.totalMarks) {
      newErrors.passingMarks = 'Passing marks cannot exceed total marks';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      alert('Please fix the errors before submitting');
      return;
    }

    try {
      setSaving(true);

      const payload = {
        ...formData,
        questions,
        id: testId
      };

      const response = await fetch(`/api/protected/teacher/subject/online-tests/${testId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert('Test updated successfully!');
        router.push(`/protected/teacher/subject/online-tests/${testId}`);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update test');
      }
    } catch (error) {
      console.error('Error updating test:', error);
      alert('Failed to update test');
    } finally {
      setSaving(false);
    }
  };

  const addQuestion = (type) => {
    const newQuestion = {
      id: `q_${Date.now()}`,
      type,
      question: '',
      marks: type === 'objective' ? 2 : 10,
      options: type === 'objective' ? ['', '', '', ''] : null,
      correctAnswer: type === 'objective' ? 0 : null,
      explanation: '',
      sampleAnswer: type === 'theory' ? '' : null
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (index, field, value) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const updateOption = (qIndex, optIndex, value) => {
    const updated = [...questions];
    updated[qIndex].options[optIndex] = value;
    setQuestions(updated);
  };

  const deleteQuestion = (index) => {
    if (confirm('Delete this question?')) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const moveQuestion = (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= questions.length) return;
    
    const updated = [...questions];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setQuestions(updated);
  };

  const toggleClass = (className) => {
    setFormData(prev => ({
      ...prev,
      classes: prev.classes.includes(className)
        ? prev.classes.filter(c => c !== className)
        : [...prev.classes, className]
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  // Calculate total marks
  const calculatedTotalMarks = questions.reduce((sum, q) => sum + (q.marks || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
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
                <h1 className="text-3xl font-bold text-gray-900">Edit Test</h1>
                <p className="text-gray-600 mt-1">Modify test details and questions</p>
              </div>
            </div>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Basic Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="E.g., Biology Mid-Term Exam"
                />
                {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Brief description of the test..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <select
                  value={formData.subjectId}
                  onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Subject</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.subjectId}>
                      {subject.subject.name}
                    </option>
                  ))}
                </select>
                {errors.subjectId && <p className="text-red-500 text-sm mt-1">{errors.subjectId}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test Type
                </label>
                <select
                  value={formData.testType}
                  onChange={(e) => setFormData({ ...formData, testType: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="test">Test</option>
                  <option value="quiz">Quiz</option>
                  <option value="exam">Exam</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Available From
                </label>
                <input
                  type="datetime-local"
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Passing Marks
                </label>
                <input
                  type="number"
                  value={formData.passingMarks}
                  onChange={(e) => setFormData({ ...formData, passingMarks: parseInt(e.target.value) })}
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.passingMarks && <p className="text-red-500 text-sm mt-1">{errors.passingMarks}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>

            {/* Classes */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Select Classes *
              </label>
              <div className="flex flex-wrap gap-2">
                {classes.map((className) => (
                  <button
                    key={className}
                    type="button"
                    onClick={() => toggleClass(className)}
                    className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                      formData.classes.includes(className)
                        ? 'bg-blue-100 border-blue-500 text-blue-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:border-blue-300'
                    }`}
                  >
                    {className}
                  </button>
                ))}
              </div>
              {errors.classes && <p className="text-red-500 text-sm mt-1">{errors.classes}</p>}
            </div>

            {/* Instructions */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Instructions
              </label>
              <textarea
                value={formData.instructions}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Special instructions for students..."
              />
            </div>

            {/* Settings */}
            <div className="mt-4 pt-4 border-t">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Test Settings</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.allowRetake}
                    onChange={(e) => setFormData({ ...formData, allowRetake: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Allow students to retake test</span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.showResultsImmediately}
                    onChange={(e) => setFormData({ ...formData, showResultsImmediately: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Show results immediately after submission</span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.shuffleQuestions}
                    onChange={(e) => setFormData({ ...formData, shuffleQuestions: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Shuffle questions for each student</span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.shuffleOptions}
                    onChange={(e) => setFormData({ ...formData, shuffleOptions: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Shuffle answer options</span>
                </label>
              </div>
            </div>
          </div>

          {/* Questions */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  Questions ({questions.length})
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Total Marks: {calculatedTotalMarks}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => addQuestion('objective')}
                  className="px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Objective
                </button>
                <button
                  type="button"
                  onClick={() => addQuestion('theory')}
                  className="px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Theory
                </button>
              </div>
            </div>

            {errors.questions && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{errors.questions}</span>
              </div>
            )}

            <div className="space-y-4">
              {questions.map((q, qIndex) => (
                <div key={q.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => moveQuestion(qIndex, 'up')}
                        disabled={qIndex === 0}
                        className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                      >
                        ▲
                      </button>
                      <GripVertical className="w-4 h-4 text-gray-400" />
                      <button
                        type="button"
                        onClick={() => moveQuestion(qIndex, 'down')}
                        disabled={qIndex === questions.length - 1}
                        className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                      >
                        ▼
                      </button>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          q.type === 'objective' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {q.type === 'objective' ? 'Objective' : 'Theory'} • Q{qIndex + 1}
                        </span>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={q.marks}
                            onChange={(e) => updateQuestion(qIndex, 'marks', parseInt(e.target.value) || 0)}
                            className="w-16 px-2 py-1 text-sm border border-gray-300 rounded"
                            min="1"
                          />
                          <span className="text-sm text-gray-600">marks</span>
                          <button
                            type="button"
                            onClick={() => deleteQuestion(qIndex)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <textarea
                        value={q.question}
                        onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                        placeholder="Enter question..."
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3"
                      />

                      {q.type === 'objective' && (
                        <div className="space-y-2">
                          {q.options.map((opt, optIndex) => (
                            <div key={optIndex} className="flex items-center gap-2">
                              <input
                                type="radio"
                                name={`correct-${qIndex}`}
                                checked={q.correctAnswer === optIndex}
                                onChange={() => updateQuestion(qIndex, 'correctAnswer', optIndex)}
                                className="w-4 h-4 text-green-600"
                              />
                              <span className="text-sm font-medium w-6">
                                {String.fromCharCode(65 + optIndex)}.
                              </span>
                              <input
                                type="text"
                                value={opt}
                                onChange={(e) => updateOption(qIndex, optIndex, e.target.value)}
                                placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      {q.type === 'theory' && (
                        <div className="mt-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Sample Answer
                          </label>
                          <textarea
                            value={q.sampleAnswer || ''}
                            onChange={(e) => updateQuestion(qIndex, 'sampleAnswer', e.target.value)}
                            placeholder="Provide a sample answer for reference..."
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          />
                        </div>
                      )}

                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Explanation
                        </label>
                        <textarea
                          value={q.explanation}
                          onChange={(e) => updateQuestion(qIndex, 'explanation', e.target.value)}
                          placeholder="Explain the correct answer..."
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {questions.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <p>No questions added yet</p>
                  <p className="text-sm mt-1">Click the buttons above to add questions</p>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}