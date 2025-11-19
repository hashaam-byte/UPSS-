// app/protected/teacher/subject/assignments/create/page.jsx - IMPROVED VISIBILITY
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateAssignment() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructions: '',
    assignmentType: 'homework',
    subjectId: '',
    dueDate: '',
    availableFrom: '',
    maxScore: 100,
    passingScore: 60,
    classes: [],
    allowLateSubmission: false,
    lateSubmissionPenalty: 10,
    attachments: []
  });

  useEffect(() => {
    fetchSubjectsAndClasses();
  }, []);

  const fetchSubjectsAndClasses = async () => {
    try {
      const response = await fetch('/api/protected/teacher/subject/assignments/create-data');
      if (response.ok) {
        const data = await response.json();
        setSubjects(data.data?.subjects || []);
        setClasses(data.data?.classes || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleClassSelection = (className) => {
    setFormData(prev => {
      const classes = prev.classes.includes(className)
        ? prev.classes.filter(c => c !== className)
        : [...prev.classes, className];
      return { ...prev, classes };
    });
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...files]
    }));
  };

  const removeAttachment = (index) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.classes.length === 0) {
      alert('Please select at least one class');
      return;
    }

    try {
      setLoading(true);
      
      const submitData = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'attachments') {
          formData.attachments.forEach(file => {
            submitData.append('attachments', file);
          });
        } else if (key === 'classes') {
          submitData.append('classes', JSON.stringify(formData.classes));
        } else {
          submitData.append(key, formData[key]);
        }
      });

      const response = await fetch('/api/protected/teacher/subject/assignments/create', {
        method: 'POST',
        body: submitData,
      });

      if (response.ok) {
        alert('Assignment created successfully!');
        router.push('/protected/teacher/subject/dashboard');
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to create assignment');
      }
    } catch (error) {
      console.error('Error creating assignment:', error);
      alert('Failed to create assignment');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAsDraft = async () => {
    setFormData(prev => ({ ...prev, status: 'draft' }));
    await handleSubmit(new Event('submit'));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Assignment</h1>
          <p className="text-gray-800 font-semibold">Create a new assignment for your students</p>
        </div>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 border-2 border-gray-400 rounded hover:bg-gray-100 font-semibold text-gray-900"
        >
          Cancel
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-gray-300">
          <h2 className="text-xl font-bold mb-4 text-gray-900">Basic Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold mb-2 text-gray-900">
                Assignment Title <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                placeholder="Enter assignment title"
                className="w-full px-3 py-2 border-2 border-gray-400 rounded-md font-medium text-gray-900 placeholder-gray-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold mb-2 text-gray-900">
                  Subject <span className="text-red-600">*</span>
                </label>
                <select
                  name="subjectId"
                  value={formData.subjectId}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border-2 border-gray-400 rounded-md font-medium text-gray-900"
                >
                  <option value="">Select subject</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name} ({subject.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 text-gray-900">
                  Assignment Type <span className="text-red-600">*</span>
                </label>
                <select
                  name="assignmentType"
                  value={formData.assignmentType}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border-2 border-gray-400 rounded-md font-medium text-gray-900"
                >
                  <option value="homework">Homework</option>
                  <option value="project">Project</option>
                  <option value="quiz">Quiz</option>
                  <option value="exam">Exam</option>
                  <option value="essay">Essay</option>
                  <option value="lab_report">Lab Report</option>
                  <option value="presentation">Presentation</option>
                  <option value="research">Research</option>
                  <option value="classwork">Classwork</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2 text-gray-900">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                placeholder="Brief description of the assignment"
                className="w-full px-3 py-2 border-2 border-gray-400 rounded-md font-medium text-gray-900 placeholder-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2 text-gray-900">
                Instructions <span className="text-red-600">*</span>
              </label>
              <textarea
                name="instructions"
                value={formData.instructions}
                onChange={handleInputChange}
                required
                rows={5}
                placeholder="Detailed instructions for students"
                className="w-full px-3 py-2 border-2 border-gray-400 rounded-md font-medium text-gray-900 placeholder-gray-600"
              />
            </div>
          </div>
        </div>

        {/* Classes Selection */}
        <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-gray-300">
          <h2 className="text-xl font-bold mb-4 text-gray-900">
            Select Classes <span className="text-red-600">*</span>
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {classes.map((className) => (
              <label
                key={className}
                className={`flex items-center p-3 border-2 rounded cursor-pointer hover:bg-gray-50 ${
                  formData.classes.includes(className) 
                    ? 'bg-blue-100 border-blue-600' 
                    : 'border-gray-400'
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.classes.includes(className)}
                  onChange={() => handleClassSelection(className)}
                  className="mr-2 w-4 h-4"
                />
                <span className="font-bold text-gray-900">{className}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Dates and Deadlines */}
        <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-gray-300">
          <h2 className="text-xl font-bold mb-4 text-gray-900">Dates & Deadlines</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2 text-gray-900">Available From</label>
              <input
                type="datetime-local"
                name="availableFrom"
                value={formData.availableFrom}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border-2 border-gray-400 rounded-md font-medium text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2 text-gray-900">
                Due Date <span className="text-red-600">*</span>
              </label>
              <input
                type="datetime-local"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border-2 border-gray-400 rounded-md font-medium text-gray-900"
              />
            </div>
          </div>
        </div>

        {/* Grading */}
        <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-gray-300">
          <h2 className="text-xl font-bold mb-4 text-gray-900">Grading</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2 text-gray-900">
                Maximum Score <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                name="maxScore"
                value={formData.maxScore}
                onChange={handleInputChange}
                required
                min="1"
                className="w-full px-3 py-2 border-2 border-gray-400 rounded-md font-medium text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2 text-gray-900">Passing Score</label>
              <input
                type="number"
                name="passingScore"
                value={formData.passingScore}
                onChange={handleInputChange}
                min="0"
                max={formData.maxScore}
                className="w-full px-3 py-2 border-2 border-gray-400 rounded-md font-medium text-gray-900"
              />
            </div>
          </div>
        </div>

        {/* Late Submission Settings */}
        <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-gray-300">
          <h2 className="text-xl font-bold mb-4 text-gray-900">Late Submission</h2>
          <div className="space-y-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="allowLateSubmission"
                checked={formData.allowLateSubmission}
                onChange={handleInputChange}
                className="mr-2 w-4 h-4"
              />
              <span className="font-bold text-gray-900">Allow late submissions</span>
            </label>

            {formData.allowLateSubmission && (
              <div>
                <label className="block text-sm font-bold mb-2 text-gray-900">
                  Late Submission Penalty (%)
                </label>
                <input
                  type="number"
                  name="lateSubmissionPenalty"
                  value={formData.lateSubmissionPenalty}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border-2 border-gray-400 rounded-md font-medium text-gray-900"
                />
                <p className="text-sm text-gray-800 font-semibold mt-1">
                  Percentage to deduct from late submissions
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Attachments */}
        <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-gray-300">
          <h2 className="text-xl font-bold mb-4 text-gray-900">Attachments</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold mb-2 text-gray-900">Upload Files</label>
              <input
                type="file"
                onChange={handleFileChange}
                multiple
                className="w-full px-3 py-2 border-2 border-gray-400 rounded-md font-medium text-gray-900"
              />
              <p className="text-sm text-gray-800 font-semibold mt-1">
                Upload reference materials, templates, or resources
              </p>
            </div>

            {formData.attachments.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-bold text-gray-900">Selected Files:</p>
                {formData.attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-100 rounded border-2 border-gray-400">
                    <span className="text-sm font-semibold text-gray-900">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="text-red-600 hover:text-red-800 font-bold"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 font-bold border-2 border-blue-700"
          >
            {loading ? 'Creating...' : 'Publish Assignment'}
          </button>
          <button
            type="button"
            onClick={handleSaveAsDraft}
            disabled={loading}
            className="flex-1 px-6 py-3 border-2 border-gray-400 rounded hover:bg-gray-100 disabled:opacity-50 font-bold text-gray-900"
          >
            Save as Draft
          </button>
        </div>
      </form>
    </div>
  );
}