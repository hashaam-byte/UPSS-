// Component: /components/director/StreamCard.jsx
// Individual stream card display

'use client';

export default function StreamCard({ stream, enrollment, onMapSubjects }) {
  const getStreamColor = () => {
    const colors = {
      SCIENCE: 'blue',
      ARTS: 'purple',
      COMMERCIAL: 'green',
    };
    return colors[stream.name] || 'gray';
  };

  const color = getStreamColor();

  const coreCount = stream.subjectMappings.filter(m => m.isCore).length;
  const electiveCount = stream.subjectMappings.filter(m => m.isElective).length;

  return (
    <div className={`bg-white rounded-lg shadow-lg border-t-4 border-${color}-500 p-6`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className={`text-xl font-bold text-${color}-600 mb-1`}>
            {stream.displayName}
          </h3>
          {stream.description && (
            <p className="text-sm text-gray-600">{stream.description}</p>
          )}
        </div>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-${color}-100 text-${color}-800`}>
          {stream.classLevel}
        </span>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex justify-between items-center py-2 border-b border-gray-200">
          <span className="text-sm text-gray-600">Core Subjects</span>
          <span className="font-semibold text-gray-900">{coreCount}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-gray-200">
          <span className="text-sm text-gray-600">Elective Subjects</span>
          <span className="font-semibold text-gray-900">{electiveCount}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-gray-200">
          <span className="text-sm text-gray-600">Total Mapped</span>
          <span className="font-semibold text-gray-900">{stream._count.subjectMappings}</span>
        </div>
        <div className="flex justify-between items-center py-2">
          <span className="text-sm text-gray-600">Students Enrolled</span>
          <span className="font-semibold text-gray-900">{enrollment?.enrollmentCount || 0}</span>
        </div>
      </div>

      <div className="mb-4 p-3 bg-gray-50 rounded">
        <p className="text-xs text-gray-600 mb-1">Elective Range</p>
        <p className="text-sm font-medium text-gray-900">
          {stream.minimumElectives} - {stream.maximumElectives} subjects
        </p>
      </div>

      <button
        onClick={onMapSubjects}
        className={`w-full px-4 py-2 bg-${color}-600 text-white rounded-lg hover:bg-${color}-700 transition-colors font-medium`}
      >
        Manage Subjects
      </button>
    </div>
  );
}
