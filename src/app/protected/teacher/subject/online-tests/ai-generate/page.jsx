// src/app/protected/teacher/subject/online-tests/ai-generate/page.jsx
'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, Loader2, ArrowLeft, Save, Trash2, AlertCircle, BookOpen, Lightbulb
} from 'lucide-react';

export default function AITestGenerator() {
  const router = useRouter();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    subject: '',
    subjectId: '',
    topic: '',
    questionCount: 10,
    difficulty: 'medium',
    questionTypes: ['objective', 'theory'],
    examType: 'school_exam',
    targetClass: 'ss1',
    customPrompt: ''
  });

  const examTypes = [
    { value: 'school_exam', label: 'School Examination', desc: 'Standard school assessment' },
    { value: 'jamb', label: 'JAMB', desc: 'University entrance exam' },
    { value: 'waec', label: 'WAEC', desc: 'West African exam' },
    { value: 'utme', label: 'UTME', desc: 'Tertiary matriculation' },
    { value: 'common_entrance', label: 'Common Entrance', desc: 'JSS entrance' },
  ];

  const classLevels = [
    { value: 'jss1', label: 'JSS 1' }, { value: 'jss2', label: 'JSS 2' },
    { value: 'jss3', label: 'JSS 3' }, { value: 'ss1', label: 'SS 1' },
    { value: 'ss2', label: 'SS 2' }, { value: 'ss3', label: 'SS 3' },
    { value: 'custom', label: 'Custom' },
  ];

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/protected/teacher/subject/ai-generate-test');
      if (response.ok) {
        const data = await response.json();
        setSubjects(data.data.subjects || []);
      }
    } catch (err) {
      setError('Failed to load subjects.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!formData.subjectId) {
      setError('Please select a subject');
      return;
    }

    if (!formData.topic && !formData.customPrompt) {
      setError('Please provide a topic or custom prompt');
      return;
    }

    try {
      setGenerating(true);
      setError('');

      const response = await fetch('/api/protected/teacher/subject/ai-generate-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      
      if (data.success) {
        setGeneratedQuestions(data.data.questions);
      } else {
        setError(data.error || 'Failed to generate test');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveTest = () => {
    sessionStorage.setItem('aiGeneratedQuestions', JSON.stringify({
      questions: generatedQuestions,
      subject: formData.subject,
      topic: formData.topic,
      examType: formData.examType,
      targetClass: formData.targetClass
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-purple-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg">
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

        {subjects.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Subjects Found</h3>
            <p className="text-gray-600">Please contact your administrator.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Configuration Panel */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  Configure Test
                </h2>
                
                <div className="space-y-4">
                  {/* Subject */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Subject <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.subjectId}
                      onChange={(e) => {
                        const selected = subjects.find(s => s.subject.id === e.target.value);
                        setFormData({
                          ...formData,
                          subjectId: e.target.value,
                          subject: selected ? selected.subject.name : ''
                        });
                      }}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Select Subject</option>
                      {subjects.map((ts) => (
                        <option key={ts.subject.id} value={ts.subject.id}>
                          {ts.subject.name} ({ts.subject.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Exam Type */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Exam Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.examType}
                      onChange={(e) => setFormData({ ...formData, examType: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      {examTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label} - {type.desc}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Class Level */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Class Level <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.targetClass}
                      onChange={(e) => setFormData({ ...formData, targetClass: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      {classLevels.map((cls) => (
                        <option key={cls.value} value={cls.value}>
                          {cls.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Topic */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Topic
                    </label>
                    <input
                      type="text"
                      value={formData.topic}
                      onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="e.g., Algebra, Photosynthesis"
                    />
                  </div>

                  {/* Custom Prompt - NEW FEATURE */}
                  <div>
                    <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-yellow-500" />
                      Custom Instructions
                    </label>
                    <textarea
                      value={formData.customPrompt}
                      onChange={(e) => setFormData({ ...formData, customPrompt: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="Tell AI exactly what you want:&#10;- Specific topics/subtopics&#10;- Question style preferences&#10;- Areas to focus on&#10;- Any special requirements"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Example: "Focus on ecosystem balance, include food chain questions, avoid chemical equations"
                    </p>
                  </div>

                  {/* Question Count */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Questions</label>
                    <input
                      type="number"
                      min="5"
                      max="50"
                      value={formData.questionCount}
                      onChange={(e) => setFormData({ ...formData, questionCount: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Difficulty */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Difficulty</label>
                    <select
                      value={formData.difficulty}
                      onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>

                  {/* Question Types */}
                  <div>
                    <label className="block text-sm font-medium mb-3">Question Types</label>
                    <div className="space-y-2">
                      <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-purple-50">
                        <input
                          type="checkbox"
                          checked={formData.questionTypes.includes('objective')}
                          onChange={(e) => {
                            const types = e.target.checked
                              ? [...formData.questionTypes, 'objective']
                              : formData.questionTypes.filter(t => t !== 'objective');
                            setFormData({ ...formData, questionTypes: types });
                          }}
                          className="mr-3"
                        />
                        <div>
                          <p className="font-medium text-sm">Multiple Choice</p>
                          <p className="text-xs text-gray-500">Auto-graded MCQs</p>
                        </div>
                      </label>
                      <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-purple-50">
                        <input
                          type="checkbox"
                          checked={formData.questionTypes.includes('theory')}
                          onChange={(e) => {
                            const types = e.target.checked
                              ? [...formData.questionTypes, 'theory']
                              : formData.questionTypes.filter(t => t !== 'theory');
                            setFormData({ ...formData, questionTypes: types });
                          }}
                          className="mr-3"
                        />
                        <div>
                          <p className="font-medium text-sm">Essay/Theory</p>
                          <p className="text-xs text-gray-500">Manual grading</p>
                        </div>
                      </label>
                    </div>
                  </div>

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
                    className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
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
                      className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 font-medium"
                    >
                      <Save className="w-5 h-5" />
                      Use This Test
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Questions Panel */}
            <div className="lg:col-span-2">
              {generating ? (
                <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                  <Loader2 className="w-16 h-16 text-purple-600 animate-spin mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Generating Your Test...</h3>
                  <p className="text-gray-600">AI is crafting high-quality questions</p>
                </div>
              ) : generatedQuestions.length > 0 ? (
                <div className="space-y-4">
                  {/* Summary */}
                  <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold mb-2">Generated Test</h2>
                        <p className="opacity-90">
                          {formData.examType.replace('_', ' ').toUpperCase()} • {formData.targetClass.toUpperCase()} • {formData.subject}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold">{generatedQuestions.length}</div>
                        <div className="text-sm opacity-90">Questions</div>
                      </div>
                    </div>
                  </div>

                  {/* Questions */}
                  {generatedQuestions.map((q, index) => (
                    <div key={q.id} className="bg-white rounded-2xl shadow-lg p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span className="px-4 py-2 bg-purple-100 text-purple-800 rounded-lg font-semibold">
                            Q{index + 1}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            q.type === 'objective' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {q.type === 'objective' ? 'MCQ' : 'Essay'}
                          </span>
                          <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium">
                            {q.marks} marks
                          </span>
                        </div>
                        <button
                          onClick={() => deleteQuestion(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>

                      <textarea
                        value={q.question}
                        onChange={(e) => updateQuestion(index, 'question', e.target.value)}
                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 mb-3"
                        rows={2}
                      />

                      {q.type === 'objective' && (
                        <div className="space-y-2">
                          {q.options.map((opt, optIndex) => (
                            <div key={optIndex} className="flex items-center gap-2">
                              <input
                                type="radio"
                                checked={q.correctAnswer === optIndex}
                                onChange={() => updateQuestion(index, 'correctAnswer', optIndex)}
                                className="text-purple-600"
                              />
                              <span className="font-medium w-8">{String.fromCharCode(65 + optIndex)}.</span>
                              <input
                                type="text"
                                value={opt}
                                onChange={(e) => {
                                  const newOpts = [...q.options];
                                  newOpts[optIndex] = e.target.value;
                                  updateQuestion(index, 'options', newOpts);
                                }}
                                className="flex-1 px-3 py-2 border rounded-lg"
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      {q.explanation && (
                        <div className="mt-3">
                          <label className="block text-sm font-medium mb-1">Explanation</label>
                          <textarea
                            value={q.explanation}
                            onChange={(e) => updateQuestion(index, 'explanation', e.target.value)}
                            className="w-full px-4 py-3 border rounded-lg bg-gray-50"
                            rows={2}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                  <Sparkles className="w-16 h-16 text-purple-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Ready to Generate</h3>
                  <p className="text-gray-600 mb-4">Configure your test settings and click "Generate Test"</p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 inline-block">
                    <p className="text-sm text-blue-800">
                      ✨ AI will create custom questions for your exam type
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}