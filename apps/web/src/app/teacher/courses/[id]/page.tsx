'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function TeacherCoursePage() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    const courseId = Array.isArray(params.id) ? params.id[0] : params.id;
    if (courseId) {
      // Redirect to edit page
      router.replace(`/teacher/courses/${courseId}/edit`);
    }
  }, [params.id, router]);

  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
}

