'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';

interface Submission {
  id: string;
  content: string;
  fileUrl?: string;
  score?: number;
  feedback?: string;
  submittedAt: string;
  gradedAt?: string;
  user: { name: string; email: string };
}

interface Homework {
  id: string;
  title: string;
  description: string;
  maxScore: number;
}

export default function HomeworkSubmissionsPage() {
  const params = useParams();
  const router = useRouter();
  const [homework, setHomework] = useState<Homework | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingScore, setEditingScore] = useState<{ [key: string]: number }>({});
  const [editingFeedback, setEditingFeedback] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    loadData();
  }, [params.id]);

  const loadData = async () => {
    try {
      const [homeworkRes, submissionsRes] = await Promise.all([
        api.get(`/homework/${params.id}`),
        api.get(`/homework/${params.id}/submissions`).catch(() => ({ data: [] })),
      ]);
      setHomework(homeworkRes.data);
      setSubmissions(submissionsRes.data || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGrade = async (submissionId: string) => {
    try {
      const score = editingScore[submissionId];
      const feedback = editingFeedback[submissionId] || '';

      if (score === undefined || score < 0 || score > homework!.maxScore) {
        alert(`الدرجة يجب أن تكون بين 0 و ${homework!.maxScore}`);
        return;
      }

      await api.post(`/homework/${params.id}/grade/${submissionId}`, {
        score,
        feedback,
      });

      // Clear editing state
      const newEditingScore = { ...editingScore };
      const newEditingFeedback = { ...editingFeedback };
      delete newEditingScore[submissionId];
      delete newEditingFeedback[submissionId];
      setEditingScore(newEditingScore);
      setEditingFeedback(newEditingFeedback);

      loadData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'فشل تصحيح الواجب');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-gray-50 min-h-screen p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-gray-800">{homework?.title}</h1>
          <p className="text-lg text-gray-700 mb-2">{homework?.description}</p>
          <p className="text-lg font-semibold text-gray-800">الدرجة الكاملة: {homework?.maxScore}</p>
        </div>
        <button
          onClick={() => router.back()}
          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold text-lg hover:bg-gray-300 transition"
        >
          ← العودة
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {submissions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-gray-500">لا توجد إجابات بعد</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {submissions.map((submission) => {
              const isGraded = submission.score !== null && submission.score !== undefined;
              const currentScore = editingScore[submission.id] ?? submission.score ?? 0;
              const currentFeedback = editingFeedback[submission.id] ?? submission.feedback ?? '';

              return (
                <div key={submission.id} className="p-6 hover:bg-gray-50 bg-white">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold mb-1 text-gray-800">{submission.user.name}</h3>
                      <p className="text-base text-gray-700">{submission.user.email}</p>
                      <p className="text-sm text-gray-600 mt-2">
                        تم الإرسال: {new Date(submission.submittedAt).toLocaleString('ar-SA')}
                      </p>
                      {isGraded && submission.gradedAt && (
                        <p className="text-sm text-green-700 mt-1">
                          تم التصحيح: {new Date(submission.gradedAt).toLocaleString('ar-SA')}
                        </p>
                      )}
                    </div>
                    {isGraded && (
                      <div className="text-left">
                        <div className="text-2xl font-bold text-primary">
                          {submission.score} / {homework?.maxScore}
                        </div>
                        <div className="text-sm text-gray-500">
                          {((submission.score! / homework!.maxScore) * 100).toFixed(1)}%
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-lg font-semibold mb-2 text-gray-800">الإجابة:</h4>
                    <div className="text-base whitespace-pre-wrap text-gray-800">{submission.content}</div>
                    {submission.fileUrl && (
                      <div className="mt-3">
                        <a
                          href={submission.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline font-semibold"
                        >
                          📎 فتح الملف المرفق
                        </a>
                      </div>
                    )}
                  </div>

                  {submission.feedback && (
                    <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                      <h4 className="text-lg font-semibold mb-2 text-gray-800">التعليقات:</h4>
                      <div className="text-base whitespace-pre-wrap text-gray-800">{submission.feedback}</div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-lg font-semibold mb-2 text-gray-800">الدرجة</label>
                      <div className="flex items-center gap-4">
                        <input
                          type="number"
                          value={currentScore}
                          onChange={(e) =>
                            setEditingScore({ ...editingScore, [submission.id]: parseFloat(e.target.value) || 0 })
                          }
                          min="0"
                          max={homework!.maxScore}
                          step="0.5"
                          className="w-32 px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-primary text-gray-800 bg-white"
                        />
                        <span className="text-lg text-gray-800">/ {homework?.maxScore}</span>
                        {currentScore > 0 && (
                          <span className="text-lg text-gray-700">
                            ({((currentScore / homework!.maxScore) * 100).toFixed(1)}%)
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-lg font-semibold mb-2 text-gray-800">التعليقات (اختياري)</label>
                      <textarea
                        value={currentFeedback}
                        onChange={(e) =>
                          setEditingFeedback({ ...editingFeedback, [submission.id]: e.target.value })
                        }
                        rows={4}
                        className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-primary text-gray-800 bg-white"
                        placeholder="اكتب تعليقاتك هنا..."
                      />
                    </div>

                    <button
                      onClick={() => handleGrade(submission.id)}
                      className="px-6 py-3 bg-primary text-white rounded-lg font-bold text-lg hover:bg-primary-dark transition"
                    >
                      {isGraded ? 'تحديث التصحيح' : 'تصحيح الواجب'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

