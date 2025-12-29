'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';

interface Lesson {
  id: string;
  title: string;
  description?: string;
  type: string;
  youtubeUrl?: string;
  textContent?: string;
  durationMinutes?: number;
}

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    loadLesson();
  }, [params.lessonId]);

  const loadLesson = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.push('/login');
        return;
      }

      // Get lesson and check completion status in parallel
      const [lessonResponse, progressResponse] = await Promise.all([
        api.get(`/lessons/${params.lessonId}`),
        api.get(`/progress/lessons/${params.lessonId}/status`).catch(() => ({ data: { completed: false } })),
      ]);

      setLesson(lessonResponse.data);
      setCompleted(progressResponse.data?.completed || false);
    } catch (error: any) {
      console.error('Failed to load lesson:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    try {
      await api.post(`/progress/lessons/${params.lessonId}/complete`);
      setCompleted(true);
      // Show success message
      alert('تم إكمال الدرس بنجاح!');
    } catch (error: any) {
      console.error('Failed to mark lesson as complete:', error);
      alert(error.response?.data?.message || 'فشل في إكمال الدرس');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">الدرس غير موجود</p>
      </div>
    );
  }

  // Extract YouTube video ID
  const getYouTubeEmbedUrl = (url?: string) => {
    if (!url) return null;
    if (url.includes('youtube.com/embed/')) return url;
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }
    return url;
  };

  const embedUrl = getYouTubeEmbedUrl(lesson.youtubeUrl);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => router.back()}
          className="mb-4 text-primary hover:underline"
        >
          ← العودة
        </button>

        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold mb-6 text-gray-800">{lesson.title}</h1>

          {embedUrl && (
            <div className="mb-6">
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  src={embedUrl}
                  className="absolute top-0 left-0 w-full h-full rounded-lg"
                  allowFullScreen
                  frameBorder="0"
                />
              </div>
            </div>
          )}

          {lesson.textContent && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <p className="whitespace-pre-line text-gray-800">{lesson.textContent}</p>
            </div>
          )}

          {lesson.description && (
            <div className="mb-6">
              <p className="text-gray-800">{lesson.description}</p>
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={handleComplete}
              disabled={completed}
              className="px-6 py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {completed ? '✓ تم الإكمال' : '✓ اكمال الدرس'}
            </button>
            <button
              onClick={() => router.back()}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300 transition"
            >
              العودة
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

