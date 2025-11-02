// ===================================================================
// FILE 2: src/app/protected/teacher/subject/online-tests/ai-generate/page.jsx
// ===================================================================
'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, Loader2, ArrowLeft, RefreshCw, Save, 
  Plus, Trash2, Edit, CheckCircle, AlertCircle 
} from 'lucide-react';

export default function AITestGenerator() {
  const router = useRouter();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [error, setError] = useState('');
  const [schoolId, setSchoolId] = useState(null); // Add state for schoolId
  
  const [formData, setFormData] = useState({
    subject: '',
    topic: '',
    questionCount: 10,
    difficulty: 'medium',
    questionTypes: ['objective', 'theory']
  });

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/protected/teacher/subject/online-tests/create');
      if (response.ok) {
        const data = await response.json();
        setSubjects(data.subjects || []);
        setSchoolId(data.schoolId || null); // Set schoolId from API response
      }
    } catch (err) {
      console.error('Error fetching subjects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!formData.subject || !formData.topic) {
      setError('Please select a subject and enter a topic');
      return;
    }

    try {
      setGenerating(true);
      setError('');
      
      const response = await fetch('/api/protected/teacher/subject/ai-generate-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (data.success) {
        setGeneratedQuestions(data.data.questions);
        if (!data.data.isAIGenerated) {
          setError(data.data.message || 'Using template-based generation');
        }
      } else {
        setError(data.error || 'Failed to generate test');
      }
    } catch (err) {
      console.error('Generation error:', err);
      setError('Failed to generate test. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveTest = () => {
    // Store generated questions in sessionStorage and redirect to create page
    sessionStorage.setItem('aiGeneratedQuestions', JSON.stringify({
      questions: generatedQuestions,
      subject: formData.subject,
      topic: formData.topic
    }));
    router.push('/protected/teacher/subject/online-tests/create');
  };

  const updateQuestion = (index, field, value) => {
    const updated = [...generatedQuestions];
    updated[index] = { ...updated[index], [field]: value };
    setGeneratedQuestions(updated);
  };

  const deleteQuestion = (index) => {
    setGeneratedQuestions(generatedQuestions.filter((_, i) => i !== index));
  };

  const handleQuestionTypeChange = (type) => {
    setFormData(prev => ({
      ...prev,
      questionTypes: prev.questionTypes.includes(type)
        ? prev.questionTypes.filter(t => t !== type)
        : [...prev.questionTypes, type]
    }));
  };

  const handleSubjectChange = (subjectId) => {
    const selectedSubject = subjects.find((ts) => ts.subject.id === subjectId);
    setFormData((prev) => ({
      ...prev,
      subjectId,
      subject: selectedSubject ? selectedSubject.subject.name : '',
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-purple-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-8 h-8 text-purple-600" />
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    AI Test Generator
                  </h1>
                </div>
                <p className="text-gray-600 mt-1">Generate comprehensive tests using AI technology</p>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-purple-100">
            <Loader2 className="w-16 h-16 text-purple-600 animate-spin mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading Your Subjects...</h3>
            <p className="text-gray-600">Please wait while we fetch your teaching subjects</p>
          </div>
        ) : subjects.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-red-100">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Subjects Found</h3>
            <p className="text-gray-600 mb-4">
              You don't have any subjects assigned yet. Please contact your administrator.
            </p>
            <button
              onClick={() => router.push('/protected/teacher/subject')}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Configuration Panel */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-purple-100 sticky top-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  Configure Test
                </h2>
                
                <div className="space-y-4">
                  {/* Subject Selection */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Your Subject <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.subjectId}
                      onChange={(e) => handleSubjectChange(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Select Subject</option>
                      {subjects.map((ts) => (
                        <option key={ts.subject.id} value={ts.subject.id}>
                          {ts.subject.name} ({ts.subject.code})
                        </option>
                      ))}
                    </select>
                    {formData.subjectId && (
                      <p className="text-xs text-gray-500 mt-1">
                        {subjects.find(ts => ts.subject.id === formData.subjectId)?.classes.join(', ')}
                      </p>
                    )}
                  </div>

                  {/* Topic Input */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Topic <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.topic}
                      onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="e.g., Algebra, Photosynthesis, World War II"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Be specific for better results
                    </p>
                  </div>

                  {/* Question Count */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Number of Questions
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="50"
                      value={formData.questionCount}
                      onChange={(e) => setFormData({ ...formData, questionCount: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Recommended: 10-20 questions
                    </p>
                  </div>

                  {/* Difficulty Level */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Difficulty Level
                    </label>
                    <select
                      value={formData.difficulty}
                      onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="easy">Easy - Basic concepts</option>
                      <option value="medium">Medium - Standard level</option>
                      <option value="hard">Hard - Advanced topics</option>
                    </select>
                  </div>

                  {/* Question Types */}
                  <div>
                    <label className="block text-sm font-medium mb-3">
                      Question Types
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-purple-50 transition-colors">
                        <input
                          type="checkbox"
                          checked={formData.questionTypes.includes('objective')}
                          onChange={() => handleQuestionTypeChange('objective')}
                          className="mr-3 text-purple-600 focus:ring-purple-500"
                        />
                        <div>
                          <p className="font-medium text-sm">Multiple Choice (MCQ)</p>
                          <p className="text-xs text-gray-500">Objective questions with 4 options</p>
                        </div>
                      </label>
                      <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-purple-50 transition-colors">
                        <input
                          type="checkbox"
                          checked={formData.questionTypes.includes('theory')}
                          onChange={() => handleQuestionTypeChange('theory')}
                          className="mr-3 text-purple-600 focus:ring-purple-500"
                        />
                        <div>
                          <p className="font-medium text-sm">Essay/Theory</p>
                          <p className="text-xs text-gray-500">Open-ended questions</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* School Info Display */}
                  {schoolId && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs text-blue-800">
                        <BookOpen className="w-4 h-4 inline mr-1" />
                        Generating for your school's curriculum
                      </p>
                    </div>
                  )}

                  {/* Error Display */}
                  {error && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-yellow-800">{error}</p>
                    </div>
                  )}

                {/* Generate Button */}
                <button
                  onClick={handleGenerate}
                  disabled={generating || formData.questionTypes.length === 0}
                  className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium transition-all"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Generate Test
                    </>
                  )}
                </button>

                {generatedQuestions.length > 0 && (
                  <button
                    onClick={handleSaveTest}
                    className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 font-medium transition-all"
                  >
                    <Save className="w-5 h-5" />
                    Use This Test
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Generated Questions Panel */}
          <div className="lg:col-span-2">
            {generating ? (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-purple-100">
                <Loader2 className="w-16 h-16 text-purple-600 animate-spin mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Generating Your Test...</h3>
                <p className="text-gray-600">AI is crafting high-quality questions for you</p>
              </div>
            ) : generatedQuestions.length > 0 ? (
              <div className="space-y-4">
                {/* Summary Card */}
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl shadow-lg p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Generated Test</h2>
                      <p className="opacity-90">
                        {formData.subject} • {formData.topic} • {formData.difficulty} level
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold">{generatedQuestions.length}</div>
                      <div className="text-sm opacity-90">Questions</div>
                    </div>
                  </div>
                </div>

                {/* Questions List */}
                {generatedQuestions.map((question, index) => (
                  <div key={question.id} className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="px-4 py-2 bg-purple-100 text-purple-800 rounded-lg font-semibold">
                          Q{index + 1}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          question.type === 'objective' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {question.type === 'objective' ? 'Multiple Choice' : 'Essay'}
                        </span>
                        <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                          {question.marks} marks
                        </span>
                      </div>
                      <button
                        onClick={() => deleteQuestion(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-2">Question</label>
                        <textarea
                          value={question.question}
                          onChange={(e) => updateQuestion(index, 'question', e.target.value)}
                          className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                          rows={2}
                        />
                      </div>

                      {question.type === 'objective' && (
                        <div>
                          <label className="block text-sm font-medium mb-2">Options</label>
                          {question.options.map((option, optIndex) => (
                            <div key={optIndex} className="flex items-center gap-2 mb-2">
                              <input
                                type="radio"
                                checked={question.correctAnswer === optIndex}
                                onChange={() => updateQuestion(index, 'correctAnswer', optIndex)}
                                className="text-purple-600"
                              />
                              <span className="font-medium w-8">{String.fromCharCode(65 + optIndex)}.</span>
                              <input
                                type="text"
                                value={option}
                                onChange={(e) => {
                                  const newOptions = [...question.options];
                                  newOptions[optIndex] = e.target.value;
                                  updateQuestion(index, 'options', newOptions);
                                }}
                                className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      {question.explanation && (
                        <div>
                          <label className="block text-sm font-medium mb-2">Explanation</label>
                          <textarea
                            value={question.explanation}
                            onChange={(e) => updateQuestion(index, 'explanation', e.target.value)}
                            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 bg-gray-50"
                            rows={2}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-purple-100">
                <Sparkles className="w-16 h-16 text-purple-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready to Generate</h3>
                <p className="text-gray-600 mb-4">Select your subject, enter a topic, and click "Generate Test"</p>
                {subjects.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 inline-block">
                    <p className="text-sm text-blue-800">
                      ✨ AI will create custom questions based on your school's subjects
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
