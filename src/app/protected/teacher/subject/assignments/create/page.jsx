// app/protected/teacher/subject/assignments/create/page.jsx - FIXED
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
      
      // Create FormData for file upload
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
          <h1 className="text-3xl font-bold">Create Assignment</h1>
          <p className="text-gray-600">Create a new assignment for your students</p>
        </div>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 border rounded hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Assignment Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                placeholder="Enter assignment title"
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Subject <span className="text-red-500">*</span>
                </label>
                <select
                  name="subjectId"
                  value={formData.subjectId}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border rounded-md"
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
                <label className="block text-sm font-medium mb-2">
                  Assignment Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="assignmentType"
                  value={formData.assignmentType}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border rounded-md"
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
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                placeholder="Brief description of the assignment"
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Instructions <span className="text-red-500">*</span>
              </label>
              <textarea
                name="instructions"
                value={formData.instructions}
                onChange={handleInputChange}
                required
                rows={5}
                placeholder="Detailed instructions for students"
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>
        </div>

        {/* Classes Selection */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">
            Select Classes <span className="text-red-500">*</span>
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {classes.map((className) => (
              <label
                key={className}
                className={`flex items-center p-3 border rounded cursor-pointer hover:bg-gray-50 ${
                  formData.classes.includes(className) ? 'bg-blue-50 border-blue-500' : ''
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.classes.includes(className)}
                  onChange={() => handleClassSelection(className)}
                  className="mr-2"
                />
                <span>{className}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Dates and Deadlines */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Dates & Deadlines</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Available From</label>
              <input
                type="datetime-local"
                name="availableFrom"
                value={formData.availableFrom}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Due Date <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>
        </div>

        {/* Grading */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Grading</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Maximum Score <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="maxScore"
                value={formData.maxScore}
                onChange={handleInputChange}
                required
                min="1"
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Passing Score</label>
              <input
                type="number"
                name="passingScore"
                value={formData.passingScore}
                onChange={handleInputChange}
                min="0"
                max={formData.maxScore}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>
        </div>

        {/* Late Submission Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Late Submission</h2>
          <div className="space-y-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="allowLateSubmission"
                checked={formData.allowLateSubmission}
                onChange={handleInputChange}
                className="mr-2"
              />
              <span>Allow late submissions</span>
            </label>

            {formData.allowLateSubmission && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Late Submission Penalty (%)
                </label>
                <input
                  type="number"
                  name="lateSubmissionPenalty"
                  value={formData.lateSubmissionPenalty}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border rounded-md"
                />
                <p className="text-sm text-gray-600 mt-1">
                  Percentage to deduct from late submissions
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Attachments */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Attachments</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Upload Files</label>
              <input
                type="file"
                onChange={handleFileChange}
                multiple
                className="w-full px-3 py-2 border rounded-md"
              />
              <p className="text-sm text-gray-600 mt-1">
                Upload reference materials, templates, or resources
              </p>
            </div>

            {formData.attachments.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Selected Files:</p>
                {formData.attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="text-red-500 hover:text-red-700"
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
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Publish Assignment'}
          </button>
          <button
            type="button"
            onClick={handleSaveAsDraft}
            disabled={loading}
            className="flex-1 px-6 py-3 border rounded hover:bg-gray-50 disabled:opacity-50"
          >
            Save as Draft
          </button>
        </div>
      </form>
    </div>
  );
}