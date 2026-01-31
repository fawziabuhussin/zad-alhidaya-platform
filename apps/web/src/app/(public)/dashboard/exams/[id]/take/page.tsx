'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { AlertIcon, BookIcon, ClockIcon } from '@/components/Icons';

interface Question {
  id: string;
  prompt: string;
  type: 'MULTIPLE_CHOICE' | 'TEXT' | 'ESSAY';
  choices?: string[];
  correctIndex?: number;
  points: number;
  order: number;
}

interface Exam {
  id: string;
  title: string;
  description?: string;
  durationMinutes: number;
  startDate: string;
  endDate: string;
  maxScore: number;
  passingScore: number;
  questions: Question[];
  course?: { id: string; title: string };
  courseCompletionRequired?: boolean;
  allLessonsCompleted?: boolean;
  completedLessons?: number;
  totalLessons?: number;
}

export default function TakeExamPage() {
  const params = useParams();
  const router = useRouter();
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [startTime, setStartTime] = useState<Date | null>(null);

  useEffect(() => {
    loadExam();
  }, [params.id]);

  useEffect(() => {
    if (exam && startTime) {
      const interval = setInterval(() => {
        const elapsed = Math.floor((new Date().getTime() - startTime.getTime()) / 1000 / 60);
        const remaining = exam.durationMinutes - elapsed;
        setTimeRemaining(Math.max(0, remaining));

        if (remaining <= 0) {
          clearInterval(interval);
          handleSubmit();
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [exam, startTime]);

  const loadExam = async () => {
    try {
      const response = await api.get(`/exams/${params.id}`);
      
      const examData = {
        ...response.data,
        questions: (response.data.questions || []).map((q: any) => {
          let choices = q.choices;
          if (typeof choices === 'string') {
            try {
              choices = JSON.parse(choices);
            } catch (e) {
              choices = [];
            }
          }
          return {
            ...q,
            type: q.type || 'MULTIPLE_CHOICE',
            choices: choices || [],
          };
        }),
      };
      
      setExam(examData);
      setStartTime(new Date());
      setTimeRemaining(examData.durationMinutes);
      
      const initialAnswers: Record<string, any> = {};
      examData.questions.forEach((q: Question) => {
        if (q.type === 'MULTIPLE_CHOICE') {
          initialAnswers[q.id] = null;
        } else {
          initialAnswers[q.id] = '';
        }
      });
      setAnswers(initialAnswers);
    } catch (error: any) {
      console.error('Failed to load exam:', error);
      if (error.response?.status === 404) {
        router.push('/dashboard/exams');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers({ ...answers, [questionId]: value });
  };

  const handleSubmit = async () => {
    if (submitting) return;

    const unanswered = exam!.questions.filter(q => {
      if (q.type === 'MULTIPLE_CHOICE') {
        return answers[q.id] === null || answers[q.id] === undefined;
      } else {
        return !answers[q.id] || answers[q.id].trim() === '';
      }
    });

    if (unanswered.length > 0) {
      const confirmSubmit = confirm(
        `لديك ${unanswered.length} سؤال غير مجاب. هل تريد المتابعة والتسليم؟`
      );
      if (!confirmSubmit) return;
    }

    setSubmitting(true);
    try {
      const answersObj: Record<string, any> = {};
      exam!.questions.forEach(q => {
        if (q.type === 'MULTIPLE_CHOICE') {
          answersObj[q.id] = answers[q.id] !== null && answers[q.id] !== undefined ? answers[q.id] : null;
        } else {
          answersObj[q.id] = answers[q.id] || '';
        }
      });

      await api.post(`/exams/${params.id}/attempt`, {
        answers: answersObj,
      });

      alert('تم تسليم الامتحان بنجاح!');
      router.push('/dashboard/exams');
    } catch (error: any) {
      console.error('Failed to submit exam:', error);
      const errorMessage = error.response?.data?.message || 'فشل تسليم الامتحان';
      if (error.response?.data?.completedLessons !== undefined) {
        alert(`${errorMessage}\n\nالدروس المكتملة: ${error.response.data.completedLessons} من ${error.response.data.totalLessons}`);
      } else {
        alert(errorMessage);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a3a2f]"></div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="bg-white rounded-xl border border-stone-200 p-8 text-center max-w-md">
          <p className="text-lg text-stone-600 mb-4">الامتحان غير موجود</p>
          <button
            onClick={() => router.push('/dashboard/exams')}
            className="px-6 py-2 bg-[#1a3a2f] text-white rounded-lg hover:bg-[#2d5a4a] transition"
          >
            العودة إلى الامتحانات
          </button>
        </div>
      </div>
    );
  }

  const now = new Date();
  const start = new Date(exam.startDate);
  const end = new Date(exam.endDate);

  if (now < start) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="bg-white rounded-xl border border-stone-200 p-8 text-center max-w-md">
          <ClockIcon className="mx-auto mb-4 text-amber-500" size={48} />
          <p className="text-lg text-stone-800 mb-2">الامتحان لم يبدأ بعد</p>
          <p className="text-stone-600 mb-6">
            سيبدأ في: {start.toLocaleDateString('ar-SA')} {start.toLocaleTimeString('ar-SA')}
          </p>
          <button
            onClick={() => router.push('/dashboard/exams')}
            className="px-6 py-2 bg-[#1a3a2f] text-white rounded-lg hover:bg-[#2d5a4a] transition"
          >
            العودة إلى الامتحانات
          </button>
        </div>
      </div>
    );
  }

  if (now > end) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="bg-white rounded-xl border border-stone-200 p-8 text-center max-w-md">
          <AlertIcon className="mx-auto mb-4 text-red-500" size={48} />
          <p className="text-lg text-stone-800 mb-2">الامتحان انتهى</p>
          <p className="text-stone-600 mb-6">
            انتهى في: {end.toLocaleDateString('ar-SA')} {end.toLocaleTimeString('ar-SA')}
          </p>
          <button
            onClick={() => router.push('/dashboard/exams')}
            className="px-6 py-2 bg-[#1a3a2f] text-white rounded-lg hover:bg-[#2d5a4a] transition"
          >
            العودة إلى الامتحانات
          </button>
        </div>
      </div>
    );
  }

  if (exam.courseCompletionRequired && !exam.allLessonsCompleted) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl border border-amber-200 p-8 max-w-lg">
          <div className="flex items-center gap-3 mb-4">
            <AlertIcon className="text-amber-600" size={28} />
            <h2 className="text-xl font-bold text-stone-800">يجب إكمال جميع دروس الدورة</h2>
          </div>
          <p className="text-stone-600 mb-4">
            لا يمكنك إجراء هذا الامتحان حتى تكمل جميع دروس الدورة
          </p>
          <div className="bg-stone-50 rounded-lg p-4 mb-6">
            <p className="text-stone-700 font-medium mb-2">
              الدروس المكتملة: {exam.completedLessons || 0} من {exam.totalLessons || 0}
            </p>
            <div className="w-full bg-stone-200 rounded-full h-3">
              <div
                className="bg-[#1a3a2f] h-3 rounded-full transition-all"
                style={{ width: `${exam.totalLessons ? (exam.completedLessons || 0) / exam.totalLessons * 100 : 0}%` }}
              ></div>
            </div>
          </div>
          <button
            onClick={() => router.push(`/courses/${exam.course?.id || ''}`)}
            className="w-full px-6 py-3 bg-[#1a3a2f] text-white rounded-lg hover:bg-[#2d5a4a] transition"
          >
            العودة إلى الدورة
          </button>
        </div>
      </div>
    );
  }

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return hours > 0 ? `${hours}:${mins.toString().padStart(2, '0')}` : `${mins} دقيقة`;
  };

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Fixed Timer Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-stone-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <div>
            <h1 className="font-bold text-stone-800">{exam.title}</h1>
            <p className="text-xs text-stone-500">{exam.questions.length} سؤال</p>
          </div>
          <div className={`text-xl font-bold px-4 py-2 rounded-lg ${
            timeRemaining < 10 ? 'bg-red-50 text-red-600' : 
            timeRemaining < 30 ? 'bg-amber-50 text-amber-600' : 
            'bg-emerald-50 text-emerald-600'
          }`}>
            {formatTime(timeRemaining)}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Exam Info */}
        <div className="bg-white rounded-xl border border-stone-200 p-4 mb-6">
          <div className="flex flex-wrap gap-4 text-sm text-stone-600">
            <span>الدرجة الكاملة: {exam.maxScore}</span>
            <span>درجة النجاح: {exam.passingScore}</span>
            <span>المدة: {exam.durationMinutes} دقيقة</span>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-4 mb-6">
          {exam.questions && exam.questions.length > 0 ? (
            exam.questions.map((question, index) => (
              <div key={question.id} className="bg-white rounded-xl border border-stone-200 p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-start gap-3">
                    <span className="w-8 h-8 bg-[#1a3a2f] text-white rounded-lg flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-stone-800 font-medium whitespace-pre-wrap">{question.prompt}</p>
                      <p className="text-xs text-stone-500 mt-1">{question.points} نقطة</p>
                    </div>
                  </div>
                </div>

                {question.type === 'MULTIPLE_CHOICE' && question.choices && question.choices.length > 0 && (
                  <div className="space-y-2 mr-11">
                    {question.choices.map((choice: string, choiceIndex: number) => (
                      <label
                        key={choiceIndex}
                        className={`flex items-center p-3 border rounded-lg cursor-pointer transition ${
                          answers[question.id] === choiceIndex 
                            ? 'border-[#1a3a2f] bg-[#1a3a2f]/5' 
                            : 'border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question-${question.id}`}
                          value={choiceIndex}
                          checked={answers[question.id] === choiceIndex}
                          onChange={() => handleAnswerChange(question.id, choiceIndex)}
                          className="w-4 h-4 text-[#1a3a2f]"
                        />
                        <span className="mr-3 text-stone-800">{choice}</span>
                      </label>
                    ))}
                  </div>
                )}

                {question.type === 'TEXT' && (
                  <div className="mr-11">
                    <input
                      type="text"
                      value={answers[question.id] || ''}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:ring-2 focus:ring-[#1a3a2f] text-stone-800"
                      placeholder="اكتب إجابتك هنا..."
                    />
                  </div>
                )}

                {question.type === 'ESSAY' && (
                  <div className="mr-11">
                    <textarea
                      value={answers[question.id] || ''}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      rows={5}
                      className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:ring-2 focus:ring-[#1a3a2f] text-stone-800"
                      placeholder="اكتب إجابتك هنا..."
                    />
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="bg-white rounded-xl border border-stone-200 p-8 text-center">
              <p className="text-stone-600 mb-2">لا توجد أسئلة في هذا الامتحان</p>
              <p className="text-sm text-stone-500">يرجى التواصل مع المعلم لإضافة أسئلة</p>
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="bg-white rounded-xl border border-stone-200 p-4 sticky bottom-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-stone-600">
              تم الإجابة على {Object.values(answers).filter(a => a !== null && a !== '' && a !== undefined).length} من {exam.questions.length} سؤال
            </p>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-2 bg-[#1a3a2f] text-white rounded-lg font-medium hover:bg-[#2d5a4a] transition disabled:opacity-50"
            >
              {submitting ? 'جاري التسليم...' : 'تسليم الامتحان'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
