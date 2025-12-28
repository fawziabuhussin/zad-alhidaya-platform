'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';

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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-gray-50 min-h-screen p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-gray-800">{exam?.title}</h1>
          <p className="text-lg text-gray-700">الدرجة الكاملة: {exam?.maxScore}</p>
        </div>
        <button
          onClick={() => router.back()}
          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold text-lg hover:bg-gray-300 transition"
        >
          ← العودة
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {attempts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-gray-500">لا توجد محاولات بعد</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-primary text-white">
                <tr>
                  <th className="px-6 py-4 text-right text-lg font-bold">الطالب</th>
                  <th className="px-6 py-4 text-right text-lg font-bold">الحالة</th>
                  <th className="px-6 py-4 text-right text-lg font-bold">الدرجة الحالية</th>
                  <th className="px-6 py-4 text-right text-lg font-bold">إضافة Bonus</th>
                  <th className="px-6 py-4 text-right text-lg font-bold">الدرجة النهائية</th>
                  <th className="px-6 py-4 text-right text-lg font-bold">التاريخ</th>
                  <th className="px-6 py-4 text-right text-lg font-bold">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {attempts.map((attempt) => {
                  const currentBonus = bonus[attempt.id] || 0;
                  const currentScore = attempt.score || 0;
                  const newScore = currentScore + currentBonus;
                  const isPending = attempt.status === 'PENDING';
                  const attemptAnswers = attempt.answers ? JSON.parse(attempt.answers) : {};
                  
                  return (
                    <tr key={attempt.id} className="hover:bg-gray-50 bg-white">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-lg font-semibold text-gray-800">{attempt.user.name}</p>
                          <p className="text-base text-gray-600">{attempt.user.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                          isPending ? 'bg-yellow-100 text-yellow-800' : 
                          attempt.status === 'GRADED' ? 'bg-green-100 text-green-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {isPending ? 'في الانتظار' : attempt.status === 'GRADED' ? 'مصحح' : 'تلقائي'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-2xl font-bold text-gray-800">
                          {attempt.score !== null ? `${attempt.score} / ${exam?.maxScore}` : 'لم يتم التصحيح'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={currentBonus}
                            onChange={(e) => setBonus({ ...bonus, [attempt.id]: parseFloat(e.target.value) || 0 })}
                            min="0"
                            step="0.5"
                            className="w-24 px-3 py-2 border-2 border-gray-300 rounded-lg text-lg text-gray-800 bg-white"
                            placeholder="0"
                          />
                          <button
                            onClick={() => handleAddBonus(attempt.id, currentBonus)}
                            className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition font-semibold"
                          >
                            إضافة
                          </button>
                        </div>
                        {currentBonus > 0 && (
                          <p className="text-sm text-green-600 mt-1">
                            النتيجة بعد Bonus: {newScore} / {exam?.maxScore}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={editingScore[attempt.id] ?? (attempt.score ?? 0)}
                            onChange={(e) => setEditingScore({ ...editingScore, [attempt.id]: parseFloat(e.target.value) || 0 })}
                            min="0"
                            max={exam!.maxScore * 1.5}
                            step="0.5"
                            className="w-32 px-3 py-2 border-2 border-gray-300 rounded-lg text-lg text-gray-800 bg-white"
                          />
                          <button
                            onClick={() => handleSetFinalScore(attempt.id, editingScore[attempt.id] ?? (attempt.score ?? 0))}
                            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition font-semibold"
                          >
                            حفظ
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-base text-gray-800">
                        {new Date(attempt.submittedAt).toLocaleDateString('ar-SA')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {isPending ? (
                            <button
                              onClick={() => setGradingAttempt(gradingAttempt === attempt.id ? null : attempt.id)}
                              className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition font-semibold text-sm"
                            >
                              {gradingAttempt === attempt.id ? 'إلغاء' : 'تصحيح'}
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                const bonusForAll = prompt('أدخل قيمة bonus للجميع:');
                                if (bonusForAll) {
                                  attempts.forEach(a => {
                                    handleAddBonus(a.id, parseFloat(bonusForAll));
                                  });
                                }
                              }}
                              className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition font-semibold text-sm"
                            >
                              Bonus للجميع
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Grading Modal for Pending Attempts */}
      {gradingAttempt && exam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">تصحيح الامتحان</h2>
              <button
                onClick={() => setGradingAttempt(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            {exam.questions
              .filter(q => q.type === 'TEXT' || q.type === 'ESSAY')
              .map((question) => {
                const attempt = attempts.find(a => a.id === gradingAttempt);
                const answer = attempt ? JSON.parse(attempt.answers)[question.id] : '';
                const currentScore = questionScores[gradingAttempt]?.[question.id] || 0;
                
                return (
                  <div key={question.id} className="mb-6 p-4 border-2 border-gray-200 rounded-lg bg-gray-50">
                    <div className="mb-3">
                      <p className="text-lg font-semibold text-gray-800 mb-2">{question.prompt}</p>
                      <p className="text-sm text-gray-600">الدرجة الكاملة: {question.points}</p>
                    </div>
                    <div className="mb-3 p-3 bg-white rounded border border-gray-300">
                      <p className="text-sm text-gray-600 mb-1">إجابة الطالب:</p>
                      <p className="text-gray-800 whitespace-pre-wrap">{answer || 'لم يتم الإجابة'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="text-gray-800 font-semibold">الدرجة:</label>
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
                        className="w-24 px-3 py-2 border-2 border-gray-300 rounded-lg text-lg text-gray-800 bg-white"
                      />
                      <span className="text-gray-600">/ {question.points}</span>
                    </div>
                  </div>
                );
              })}
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <label className="text-gray-800 font-semibold">الدرجة النهائية (اختياري):</label>
                <input
                  type="number"
                  min="0"
                  max={exam.maxScore * 1.5}
                  value={editingScore[gradingAttempt] || ''}
                  onChange={(e) => setEditingScore({ ...editingScore, [gradingAttempt]: parseFloat(e.target.value) || 0 })}
                  className="w-32 px-3 py-2 border-2 border-gray-300 rounded-lg text-lg text-gray-800 bg-white"
                />
              </div>
              <div className="flex items-center gap-3 mb-3">
                <label className="text-gray-800 font-semibold">Bonus:</label>
                <input
                  type="number"
                  min="0"
                  value={bonus[gradingAttempt] || 0}
                  onChange={(e) => setBonus({ ...bonus, [gradingAttempt]: parseFloat(e.target.value) || 0 })}
                  className="w-24 px-3 py-2 border-2 border-gray-300 rounded-lg text-lg text-gray-800 bg-white"
                />
              </div>
              <button
                onClick={() => handleGradePendingAttempt(gradingAttempt)}
                className="w-full px-6 py-3 bg-primary text-white rounded-lg font-bold text-lg hover:bg-primary-dark transition"
              >
                حفظ التصحيح
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

