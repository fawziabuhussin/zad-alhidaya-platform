'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { BookIcon, ClockIcon, CheckCircleIcon, CloseIcon } from '@/components/Icons';

interface Attempt {
  id: string;
  score: number | null;
  status: string;
  answers: string;
  submittedAt: string;
  user: { name: string; email: string };
}

interface Exam {
  id: string;
  title: string;
  maxScore: number;
  questions: Array<{
    id: string;
    prompt: string;
    type: string;
    points: number;
    choices?: string[];
    correctIndex?: number;
  }>;
}

export default function ExamAttemptsPage() {
  const params = useParams();
  const router = useRouter();
  const [exam, setExam] = useState<Exam | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingScore, setEditingScore] = useState<{ [key: string]: number }>({});
  const [bonus, setBonus] = useState<{ [key: string]: number }>({});
  const [questionScores, setQuestionScores] = useState<{ [attemptId: string]: { [questionId: string]: number } }>({});
  const [gradingAttempt, setGradingAttempt] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [params.id]);

  const loadData = async () => {
    try {
      const [examRes, attemptsRes] = await Promise.all([
        api.get(`/exams/${params.id}`),
        api.get(`/exams/${params.id}/attempts`).catch(() => ({ data: [] })),
      ]);
      setExam(examRes.data);
      setAttempts(attemptsRes.data || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBonus = async (attemptId: string, bonusValue: number) => {
    try {
      await api.patch(`/exams/${params.id}/attempt/${attemptId}`, { bonus: bonusValue });
      setBonus({ ...bonus, [attemptId]: bonusValue });
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'فشل إضافة bonus');
    }
  };

  const handleSetFinalScore = async (attemptId: string, finalScore: number) => {
    try {
      if (finalScore > exam!.maxScore * 1.5) {
        alert(`الدرجة النهائية لا يمكن أن تتجاوز ${exam!.maxScore * 1.5}`);
        return;
      }
      await api.patch(`/exams/${params.id}/attempt/${attemptId}`, { finalScore });
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'فشل تحديث الدرجة');
    }
  };

  const handleGradePendingAttempt = async (attemptId: string) => {
    try {
      const scores = questionScores[attemptId] || {};
      const finalScore = editingScore[attemptId];
      
      if (!finalScore && Object.keys(scores).length === 0) {
        alert('يجب إدخال درجات للأسئلة أو الدرجة النهائية');
        return;
      }

      await api.post(`/exams/${params.id}/attempt/${attemptId}/grade`, {
        questionScores: Object.keys(scores).length > 0 ? scores : undefined,
        finalScore: finalScore || undefined,
        bonus: bonus[attemptId] || 0,
      });
      
      setGradingAttempt(null);
      setQuestionScores({ ...questionScores, [attemptId]: {} });
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'فشل تصحيح الامتحان');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a3a2f]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-gradient-to-l from-[#1a3a2f] via-[#1f4a3d] to-[#0d2b24] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                <BookIcon className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-xl font-bold">{exam?.title}</h1>
                <p className="text-white/70 text-sm">الدرجة الكاملة: {exam?.maxScore}</p>
              </div>
            </div>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition text-sm"
            >
              العودة
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-stone-200 p-4 text-center">
            <p className="text-2xl font-bold text-[#1a3a2f]">{attempts.length}</p>
            <p className="text-sm text-stone-500">إجمالي المحاولات</p>
          </div>
          <div className="bg-white rounded-xl border border-stone-200 p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">
              {attempts.filter(a => a.status === 'GRADED' || a.status === 'AUTO_GRADED').length}
            </p>
            <p className="text-sm text-stone-500">تم التصحيح</p>
          </div>
          <div className="bg-white rounded-xl border border-stone-200 p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">
              {attempts.filter(a => a.status === 'PENDING').length}
            </p>
            <p className="text-sm text-stone-500">في الانتظار</p>
          </div>
        </div>

        {/* Attempts Table */}
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
          {attempts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-stone-500">لا توجد محاولات بعد</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-stone-50 border-b border-stone-200">
                  <tr>
                    <th className="px-4 py-3 text-right text-sm font-medium text-stone-600">الطالب</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-stone-600">الحالة</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-stone-600">الدرجة</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-stone-600">Bonus</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-stone-600">الدرجة النهائية</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-stone-600">التاريخ</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-stone-600">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {attempts.map((attempt) => {
                    const currentBonus = bonus[attempt.id] || 0;
                    const currentScore = attempt.score || 0;
                    const newScore = currentScore + currentBonus;
                    const isPending = attempt.status === 'PENDING';
                    
                    return (
                      <tr key={attempt.id} className="hover:bg-stone-50">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-stone-800">{attempt.user.name}</p>
                            <p className="text-sm text-stone-500">{attempt.user.email}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            isPending ? 'bg-amber-50 text-amber-700' : 
                            attempt.status === 'GRADED' ? 'bg-emerald-50 text-emerald-700' :
                            'bg-stone-100 text-stone-600'
                          }`}>
                            {isPending ? 'في الانتظار' : attempt.status === 'GRADED' ? 'مصحح' : 'تلقائي'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-stone-800">
                            {attempt.score !== null ? `${attempt.score} / ${exam?.maxScore}` : '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={currentBonus}
                              onChange={(e) => setBonus({ ...bonus, [attempt.id]: parseFloat(e.target.value) || 0 })}
                              min="0"
                              step="0.5"
                              className="w-16 px-2 py-1 border border-stone-200 rounded text-sm text-stone-800"
                            />
                            <button
                              onClick={() => handleAddBonus(attempt.id, currentBonus)}
                              className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-xs hover:bg-emerald-100"
                            >
                              حفظ
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={editingScore[attempt.id] ?? (attempt.score ?? 0)}
                              onChange={(e) => setEditingScore({ ...editingScore, [attempt.id]: parseFloat(e.target.value) || 0 })}
                              min="0"
                              max={exam!.maxScore * 1.5}
                              step="0.5"
                              className="w-20 px-2 py-1 border border-stone-200 rounded text-sm text-stone-800"
                            />
                            <button
                              onClick={() => handleSetFinalScore(attempt.id, editingScore[attempt.id] ?? (attempt.score ?? 0))}
                              className="px-2 py-1 bg-[#1a3a2f] text-white rounded text-xs hover:bg-[#2d5a4a]"
                            >
                              حفظ
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-stone-600">
                          {new Date(attempt.submittedAt).toLocaleDateString('ar-SA')}
                        </td>
                        <td className="px-4 py-3">
                          {isPending && (
                            <button
                              onClick={() => setGradingAttempt(gradingAttempt === attempt.id ? null : attempt.id)}
                              className="px-3 py-1 bg-amber-50 text-amber-700 rounded text-xs hover:bg-amber-100"
                            >
                              {gradingAttempt === attempt.id ? 'إلغاء' : 'تصحيح'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Grading Modal */}
      {gradingAttempt && exam && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-stone-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-lg font-bold text-stone-800">تصحيح الامتحان</h2>
              <button
                onClick={() => setGradingAttempt(null)}
                className="p-2 text-stone-400 hover:text-stone-600"
              >
                <CloseIcon size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {exam.questions
                .filter(q => q.type === 'TEXT' || q.type === 'ESSAY')
                .map((question) => {
                  const attempt = attempts.find(a => a.id === gradingAttempt);
                  const answer = attempt ? JSON.parse(attempt.answers)[question.id] : '';
                  const currentScore = questionScores[gradingAttempt]?.[question.id] || 0;
                  
                  return (
                    <div key={question.id} className="p-4 bg-stone-50 rounded-lg border border-stone-200">
                      <p className="font-medium text-stone-800 mb-2">{question.prompt}</p>
                      <p className="text-xs text-stone-500 mb-3">الدرجة الكاملة: {question.points}</p>
                      <div className="p-3 bg-white rounded border border-stone-200 mb-3">
                        <p className="text-xs text-stone-500 mb-1">إجابة الطالب:</p>
                        <p className="text-stone-800 whitespace-pre-wrap">{answer || 'لم يتم الإجابة'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-stone-600">الدرجة:</label>
                        <input
                          type="number"
                          min="0"
                          max={question.points}
                          value={currentScore}
                          onChange={(e) => {
                            const newScores = { ...questionScores };
                            if (!newScores[gradingAttempt]) newScores[gradingAttempt] = {};
                            newScores[gradingAttempt][question.id] = parseFloat(e.target.value) || 0;
                            setQuestionScores(newScores);
                          }}
                          className="w-20 px-2 py-1 border border-stone-200 rounded text-sm"
                        />
                        <span className="text-sm text-stone-500">/ {question.points}</span>
                      </div>
                    </div>
                  );
                })}
              
              <div className="p-4 bg-stone-100 rounded-lg">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-sm font-medium text-stone-700 mb-1 block">الدرجة النهائية (اختياري)</label>
                    <input
                      type="number"
                      min="0"
                      max={exam.maxScore * 1.5}
                      value={editingScore[gradingAttempt] || ''}
                      onChange={(e) => setEditingScore({ ...editingScore, [gradingAttempt]: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-stone-700 mb-1 block">Bonus</label>
                    <input
                      type="number"
                      min="0"
                      value={bonus[gradingAttempt] || 0}
                      onChange={(e) => setBonus({ ...bonus, [gradingAttempt]: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm"
                    />
                  </div>
                </div>
                <button
                  onClick={() => handleGradePendingAttempt(gradingAttempt)}
                  className="w-full px-4 py-3 bg-[#1a3a2f] text-white rounded-lg font-medium hover:bg-[#2d5a4a] transition"
                >
                  حفظ التصحيح
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
