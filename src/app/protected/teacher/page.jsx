'use client'
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

// Teacher sub-roles each have their own dashboard under /protected/teacher/{department}.
// This page exists purely to route a logged-in teacher to the correct one based on
// their department, since there is no single shared "teacher" dashboard.
const DEPARTMENT_ROUTES = {
  class_teacher: '/protected/teacher/class/dashboard',
  subject_teacher: '/protected/teacher/subject/dashboard',
  coordinator: '/protected/teacher/coordinator/dashboard',
  director: '/protected/teacher/director/dashboard'
};

export default function TeacherRouter() {
  const router = useRouter();
  const [error, setError] = useState(null);

  useEffect(() => {
    verifyAndRedirect();
  }, []);

  const verifyAndRedirect = async () => {
    try {
      const response = await fetch('/api/auth/verify', {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Authentication failed');

      const data = await response.json();

      if (!data.authenticated || data.user.role !== 'TEACHER') {
        router.push('/auth/unauthorized');
        return;
      }

      const department = data.user.department || data.user.teacherProfile?.department;
      const target = DEPARTMENT_ROUTES[department];

      if (!target) {
        console.error('Unrecognized teacher department:', department);
        setError('Your account is not assigned to a recognized teacher role. Please contact your school admin.');
        return;
      }

      router.replace(target);
    } catch (err) {
      console.error('Teacher routing failed:', err);
      router.push('/protected');
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-md">
          <p className="text-gray-800 font-medium mb-2">Unable to load your dashboard</p>
          <p className="text-gray-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Loading your dashboard...</p>
      </div>
    </div>
  );
}
