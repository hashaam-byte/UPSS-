// Component: /components/director/StreamManagement.jsx
// Stream management interface (SS Directors only)

'use client';

import { useState, useEffect } from 'react';
import StreamCard from './StreamCard';
import MapSubjectsModal from './MapSubjectsModal';

export default function StreamManagement({ directorInfo }) {
  const [streams, setStreams] = useState([]);
  const [enrollment, setEnrollment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStream, setSelectedStream] = useState(null);
  const [showMapModal, setShowMapModal] = useState(false);

  const fetchStreams = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/protected/teachers/director/subjects/streams');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch streams');
      }

      setStreams(data.streams);
      setEnrollment(data.enrollment);
    } catch (err) {
      console.error('Error fetching streams:', err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStreams();
  }, []);

  const handleMapSubjects = (stream) => {
    setSelectedStream(stream);
    setShowMapModal(true);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading streams...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Stream Management</h2>
        <p className="text-gray-600">
          Configure streams and map subjects to each stream
        </p>
      </div>

      {streams.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-600">No streams found. Streams should be created during initial setup.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {streams.map(stream => (
            <StreamCard
              key={stream.id}
              stream={stream}
              enrollment={enrollment.find(e => e.streamId === stream.id)}
              onMapSubjects={() => handleMapSubjects(stream)}
            />
          ))}
        </div>
      )}

      {showMapModal && selectedStream && (
        <MapSubjectsModal
          stream={selectedStream}
          onClose={() => {
            setShowMapModal(false);
            setSelectedStream(null);
            fetchStreams();
          }}
        />
      )}
    </div>
  );
}
