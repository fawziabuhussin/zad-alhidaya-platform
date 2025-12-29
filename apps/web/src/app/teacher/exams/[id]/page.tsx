'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

interface Question {
  id: string;
  prompt: string;
  type?: 'MULTIPLE_CHOICE' | 'TEXT' | 'ESSAY';
  choices?: string[];
  correctIndex?: number;
  explanation?: string;
  points: number;
  order: number;
}

interface Exam {
  id: string;
  title: string;
  description?: string;
  questions: Question[];
  maxScore: number;
  course: {
    id: string;
    title: string;
  };
}

export default function TeacherExamDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const [questionData, setQuestionData] = useState({
    prompt: '',
    type: 'MULTIPLE_CHOICE' as 'MULTIPLE_CHOICE' | 'TEXT' | 'ESSAY',
    choices: ['', '', '', ''],
    correctIndex: 0,
    explanation: '',
    points: 1,
    allowBonus: false,
  });
  const [totalPoints, setTotalPoints] = useState(0);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const cachedUser = JSON.parse(userStr);
          if (cachedUser.role === 'TEACHER' || cachedUser.role === 'ADMIN') {
            setUser(cachedUser);
            loadExam();
            return;
          }
        } catch (e) {
          // Invalid cached user
        }
      }

      const token = localStorage.getItem('accessToken');
      if (!token) {
        window.location.href = '/login';
        return;
      }

      const userRes = await api.get('/auth/me');
      const userData = userRes.data;
      
      if (userData.role !== 'TEACHER' && userData.role !== 'ADMIN') {
        window.location.href = '/dashboard';
        return;
      }

      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      loadExam();
    } catch (error: any) {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const cachedUser = JSON.parse(userStr);
          if (cachedUser.role === 'TEACHER' || cachedUser.role === 'ADMIN') {
            setUser(cachedUser);
            loadExam();
            return;
          }
        } catch (e) {
          // Invalid cached user
        }
      }
      window.location.href = '/login';
    }
  };

  const loadExam = async () => {
    try {
      const examId = Array.isArray(params.id) ? params.id[0] : params.id;
      const response = await api.get(`/exams/${examId}`);
      const examData = response.data;
      
      // Verify teacher owns this course
      if (user && examData.course?.teacherId !== user.id && user.role !== 'ADMIN') {
        alert('ليس لديك صلاحية للوصول إلى هذا الامتحان');
        router.push('/teacher/exams');
        return;
      }
      
      examData.questions = examData.questions.map((q: any) => ({
        ...q,
        type: q.type || 'MULTIPLE_CHOICE',
        choices: q.choices ? (typeof q.choices === 'string' ? JSON.parse(q.choices) : q.choices) : undefined,
      }));
      setExam(examData);
      calculateTotalPoints(examData.questions);
    } catch (error: any) {
      console.error('Failed to load exam:', error);
      if (error.response?.status === 403) {
        alert('ليس لديك صلاحية للوصول إلى هذا الامتحان');
        router.push('/teacher/exams');
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalPoints = (questions: Question[]) => {
    const total = questions.reduce((sum, q) => sum + q.points, 0);
    setTotalPoints(total);
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (questionData.type === 'MULTIPLE_CHOICE') {
        const validChoices = questionData.choices.filter(c => c.trim() !== '');
        if (validChoices.length < 2) {
          alert('يجب إضافة خيارين على الأقل لسؤال الاختيار من متعدد');
          return;
        }
        if (questionData.correctIndex === undefined || questionData.correctIndex < 0) {
          alert('يجب تحديد الإجابة الصحيحة');
          return;
        }
      }

      if (!questionData.prompt.trim()) {
        alert('يجب إدخال نص السؤال');
        return;
      }

      const examId = Array.isArray(params.id) ? params.id[0] : params.id;
      const newTotal = totalPoints + questionData.points;
      if (newTotal > exam!.maxScore && !questionData.allowBonus) {
        const confirmBonus = confirm(
          `المجموع الكلي (${newTotal}) يتجاوز الدرجة الكاملة (${exam!.maxScore}). هل تريد المتابعة كسؤال إضافي (bonus)?`
        );
        if (!confirmBonus) return;
        questionData.allowBonus = true;
      }

      const requestData: any = {
        ...questionData,
        allowBonus: questionData.allowBonus,
      };
      
      if (questionData.type === 'MULTIPLE_CHOICE') {
        const validChoices = questionData.choices.filter(c => c.trim() !== '');
        requestData.choices = validChoices;
        requestData.correctIndex = questionData.correctIndex ?? 0;
        requestData.explanation = questionData.explanation?.trim() || undefined;
      } else {
        requestData.choices = undefined;
        requestData.correctIndex = undefined;
        requestData.explanation = questionData.explanation?.trim() || undefined;
      }
      
      await api.post(`/exams/${examId}/questions`, requestData);
      setShowQuestionForm(false);
      setQuestionData({ 
        prompt: '', 
        type: 'MULTIPLE_CHOICE',
        choices: ['', '', '', ''], 
        correctIndex: 0,
        explanation: '',
        points: 1, 
        allowBonus: false 
      });
      loadExam();
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'فشل إضافة السؤال';
      alert(errorMsg);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا السؤال؟')) return;
    try {
      const examId = Array.isArray(params.id) ? params.id[0] : params.id;
      await api.delete(`/exams/${examId}/questions/${questionId}`);
      loadExam();
    } catch (error: any) {
      alert(error.response?.data?.message || 'فشل حذف السؤال');
    }
  };

  const handleUpdateQuestion = async (questionId: string, newPoints: number) => {
    try {
      const examId = Array.isArray(params.id) ? params.id[0] : params.id;
      const newTotal = totalPoints - exam!.questions.find(q => q.id === questionId)!.points + newPoints;
      if (newTotal > exam!.maxScore) {
        const allowBonus = confirm(
          `المجموع الكلي (${newTotal}) يتجاوز الدرجة الكاملة. هل تريد المتابعة؟`
        );
        if (!allowBonus) return;
      }

      await api.put(`/exams/${examId}/questions/${questionId}`, {
        points: newPoints,
        allowBonus: newTotal > exam!.maxScore,
      });
      loadExam();
    } catch (error: any) {
      alert(error.response?.data?.message || 'فشل تحديث السؤال');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary"></div>
      </div>
    );
  }

  if (!exam) {
    return <div className="text-center py-16 text-xl text-gray-800">الامتحان غير موجود</div>;
  }

  return (
    <div className="space-y-6 bg-gray-50 min-h-screen p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-gray-800">{exam.title}</h1>
          {exam.description && (
            <p className="text-lg text-gray-600">{exam.description}</p>
          )}
          <p className="text-base text-gray-600 mt-2">الدورة: {exam.course?.title || 'N/A'}</p>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-lg font-semibold text-gray-800">
              المجموع الكلي للنقاط: <span className="text-primary">{totalPoints}</span> / {exam.maxScore}
              {totalPoints > exam.maxScore && (
                <span className="text-green-600 mr-2">(يحتوي على أسئلة إضافية)</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/teacher/exams/${params.id}/attempts`}
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-bold text-lg hover:bg-green-700 transition"
          >
            عرض المحاولات
          </Link>
          <button
            onClick={() => router.push('/teacher/exams')}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold text-lg hover:bg-gray-300 transition"
          >
            ← العودة
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">أسئلة الامتحان ({exam.questions.length})</h2>
          <button
            onClick={() => setShowQuestionForm(!showQuestionForm)}
            className="px-6 py-3 bg-primary text-white rounded-lg font-bold text-lg hover:bg-primary-dark transition"
          >
            + إضافة سؤال
          </button>
        </div>

        {showQuestionForm && (
          <div className="mb-8 p-6 bg-gray-50 rounded-lg border-2 border-primary">
            <h3 className="text-xl font-bold mb-4 text-gray-800">سؤال جديد</h3>
            <form onSubmit={handleAddQuestion} className="space-y-4">
              <div>
                <label className="block text-lg font-semibold mb-2 text-gray-800">نص السؤال *</label>
                <textarea
                  value={questionData.prompt}
                  onChange={(e) => setQuestionData({ ...questionData, prompt: e.target.value })}
                  required
                  rows={3}
                  className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-primary bg-white text-gray-800"
                  placeholder="اكتب السؤال هنا..."
                />
              </div>

              <div className="relative w-full">
                <label className="block text-lg font-semibold mb-2 text-gray-800">نوع السؤال *</label>
                <div className="relative w-full">
                  <button
                    type="button"
                    onClick={() => setTypeDropdownOpen(!typeDropdownOpen)}
                    className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-primary focus:border-primary bg-white text-gray-800 font-medium text-right flex items-center justify-between mb-4"
                    style={{ minHeight: '56px' }}
                  >
                    <span className="flex-1 text-right">
                      {questionData.type === 'MULTIPLE_CHOICE' && 'اختيار من متعدد (تصحيح تلقائي)'}
                      {questionData.type === 'TEXT' && 'سؤال نصي قصير (تصحيح يدوي)'}
                      {questionData.type === 'ESSAY' && 'سؤال مقالي (تصحيح يدوي)'}
                    </span>
                    <svg 
                      className={`w-5 h-5 transition-transform ${typeDropdownOpen ? 'transform rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {typeDropdownOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setTypeDropdownOpen(false)}
                      />
                      <div 
                        className="absolute z-20 w-full mt-1 bg-white border-2 border-gray-300 rounded-lg shadow-lg"
                        style={{ direction: 'rtl' }}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            const newType = 'MULTIPLE_CHOICE';
                            setQuestionData({
                              ...questionData,
                              type: newType,
                              choices: questionData.choices.length > 0 ? questionData.choices : ['', '', '', ''],
                              correctIndex: questionData.correctIndex ?? 0,
                              explanation: questionData.explanation,
                            });
                            setTypeDropdownOpen(false);
                          }}
                          className={`w-full text-right px-4 py-3 text-lg hover:bg-gray-100 transition ${
                            questionData.type === 'MULTIPLE_CHOICE' ? 'bg-primary text-white' : 'text-gray-800'
                          }`}
                        >
                          اختيار من متعدد (تصحيح تلقائي)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const newType = 'TEXT';
                            setQuestionData({
                              ...questionData,
                              type: newType,
                              choices: [],
                              correctIndex: undefined as any,
                              explanation: '',
                            });
                            setTypeDropdownOpen(false);
                          }}
                          className={`w-full text-right px-4 py-3 text-lg hover:bg-gray-100 transition border-t border-gray-200 ${
                            questionData.type === 'TEXT' ? 'bg-primary text-white' : 'text-gray-800'
                          }`}
                        >
                          سؤال نصي قصير (تصحيح يدوي)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const newType = 'ESSAY';
                            setQuestionData({
                              ...questionData,
                              type: newType,
                              choices: [],
                              correctIndex: undefined as any,
                              explanation: '',
                            });
                            setTypeDropdownOpen(false);
                          }}
                          className={`w-full text-right px-4 py-3 text-lg hover:bg-gray-100 transition border-t border-gray-200 ${
                            questionData.type === 'ESSAY' ? 'bg-primary text-white' : 'text-gray-800'
                          }`}
                        >
                          سؤال مقالي (تصحيح يدوي)
                        </button>
                      </div>
                    </>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {questionData.type === 'MULTIPLE_CHOICE' 
                    ? '✓ سيتم التصحيح تلقائياً عند إتمام الطالب للامتحان'
                    : '⚠️ سيحتاج هذا السؤال إلى تصحيح يدوي من قبل المدرس'}
                </p>
              </div>

              {(questionData.type === 'MULTIPLE_CHOICE' || !questionData.type) && (
                <>
                  <div>
                    <label className="block text-lg font-semibold mb-2 text-gray-800">الخيارات *</label>
                    {questionData.choices.map((choice, index) => (
                      <div key={index} className="mb-3 flex items-center gap-3">
                        <input
                          type="radio"
                          name="correct"
                          checked={questionData.correctIndex === index}
                          onChange={() => setQuestionData({ ...questionData, correctIndex: index })}
                          className="w-5 h-5 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={choice}
                          onChange={(e) => {
                            const newChoices = [...questionData.choices];
                            newChoices[index] = e.target.value;
                            setQuestionData({ ...questionData, choices: newChoices });
                          }}
                          placeholder={`الخيار ${index + 1}`}
                          className="flex-1 px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-primary bg-white text-gray-800"
                        />
                        {questionData.choices.length > 2 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newChoices = questionData.choices.filter((_, i) => i !== index);
                              const newCorrectIndex = questionData.correctIndex === index ? 0 : 
                                questionData.correctIndex > index ? questionData.correctIndex - 1 : questionData.correctIndex;
                              setQuestionData({ ...questionData, choices: newChoices, correctIndex: newCorrectIndex });
                            }}
                            className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-semibold transition"
                          >
                            حذف
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setQuestionData({ ...questionData, choices: [...questionData.choices, ''] })}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-semibold transition"
                    >
                      + إضافة خيار
                    </button>
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-lg font-semibold mb-2 text-gray-800">
                      شرح الإجابة الصحيحة (اختياري)
                    </label>
                    <textarea
                      value={questionData.explanation}
                      onChange={(e) => setQuestionData({ ...questionData, explanation: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-primary bg-white text-gray-800"
                      placeholder="اكتب شرحاً للإجابة الصحيحة - سيظهر للطالب بعد إتمام الامتحان..."
                    />
                    <p className="text-sm text-gray-600 mt-2">
                      هذا الشرح سيظهر للطالب بعد إتمام الامتحان لمساعدته على فهم الإجابة الصحيحة
                    </p>
                  </div>
                </>
              )}

              {(questionData.type === 'TEXT' || questionData.type === 'ESSAY') && (
                <div className="p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
                  <p className="text-base text-yellow-800 font-semibold mb-2">
                    ⚠️ هذا سؤال {questionData.type === 'TEXT' ? 'نصي قصير' : 'مقالي'} - سيتم تصحيحه يدوياً من قبل المدرس
                  </p>
                  <p className="text-sm text-yellow-700">
                    بعد إضافة هذا السؤال، سيحتاج الامتحان إلى تصحيح يدوي. يمكنك إضافة ملاحظات أو معايير التصحيح في حقل الوصف.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-lg font-semibold mb-2 text-gray-800">النقاط *</label>
                  <input
                    type="number"
                    value={questionData.points}
                    onChange={(e) => setQuestionData({ ...questionData, points: parseFloat(e.target.value) })}
                    min="0.5"
                    step="0.5"
                    required
                    className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-primary bg-white text-gray-800"
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={questionData.allowBonus}
                      onChange={(e) => setQuestionData({ ...questionData, allowBonus: e.target.checked })}
                      className="w-5 h-5 cursor-pointer"
                    />
                    <span className="text-lg text-gray-800 font-medium">سؤال إضافي (bonus)</span>
                  </label>
                </div>
              </div>

              <div className={`p-4 rounded-lg border-2 ${
                totalPoints + questionData.points > exam.maxScore 
                  ? 'bg-yellow-50 border-yellow-300' 
                  : 'bg-green-50 border-green-300'
              }`}>
                <p className={`text-sm font-semibold ${
                  totalPoints + questionData.points > exam.maxScore 
                    ? 'text-yellow-800' 
                    : 'text-green-800'
                }`}>
                  المجموع بعد إضافة هذا السؤال: <span className="font-bold">{totalPoints + questionData.points}</span> / {exam.maxScore}
                  {totalPoints + questionData.points > exam.maxScore && !questionData.allowBonus && (
                    <span className="block mt-1">⚠️ سيتم اعتبار هذا السؤال إضافياً (bonus) إذا تجاوز المجموع</span>
                  )}
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="px-6 py-3 bg-primary text-white rounded-lg font-bold text-lg hover:bg-primary-dark transition"
                >
                  إضافة السؤال
                </button>
                <button
                  type="button"
                  onClick={() => setShowQuestionForm(false)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-bold text-lg hover:bg-gray-300 transition"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-4">
          {exam.questions.length === 0 ? (
            <p className="text-center py-12 text-xl text-gray-500">لا توجد أسئلة</p>
          ) : (
            exam.questions.map((question, index) => (
              <div key={question.id} className="p-6 bg-white border-2 border-gray-200 rounded-lg">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-bold text-primary">{index + 1}</span>
                    <p className="text-xl font-semibold flex-1 text-gray-800">{question.prompt}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg font-semibold">
                        {question.points} نقطة
                      </span>
                      <input
                        type="number"
                        value={question.points}
                        onChange={(e) => handleUpdateQuestion(question.id, parseFloat(e.target.value))}
                        min="0.5"
                        step="0.5"
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-center text-gray-800"
                      />
                    </div>
                    <button
                      onClick={() => handleDeleteQuestion(question.id)}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition font-semibold"
                    >
                      حذف
                    </button>
                  </div>
                </div>
                {(question.type === 'MULTIPLE_CHOICE' || !question.type) && question.choices && (
                  <div className="space-y-2 pr-12">
                    {question.choices.map((choice, choiceIndex) => (
                      <div
                        key={choiceIndex}
                        className={`p-4 rounded-lg border-2 ${
                          choiceIndex === question.correctIndex
                            ? 'bg-green-50 border-green-500'
                            : 'bg-gray-50 border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-semibold text-gray-800">
                            {String.fromCharCode(1570 + choiceIndex)}.
                          </span>
                          <span className="text-lg text-gray-800">{choice}</span>
                          {choiceIndex === question.correctIndex && (
                            <span className="px-3 py-1 bg-green-500 text-white rounded-lg text-sm font-bold">
                              ✓ الإجابة الصحيحة
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    {question.explanation && (
                      <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-300 rounded-lg">
                        <h4 className="text-lg font-bold text-blue-900 mb-2">📚 شرح الإجابة الصحيحة:</h4>
                        <p className="text-base text-blue-800 leading-relaxed">{question.explanation}</p>
                      </div>
                    )}
                  </div>
                )}
                {(question.type === 'TEXT' || question.type === 'ESSAY') && (
                  <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-300">
                    <p className="text-lg text-blue-800 font-semibold">
                      {question.type === 'TEXT' ? 'سؤال نصي قصير' : 'سؤال مقالي'} - يحتاج تصحيح يدوي
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}




