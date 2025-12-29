'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';

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
      console.log('Exam data:', response.data);
      console.log('Questions:', response.data.questions);
      
      // Parse questions and ensure choices are arrays
      const examData = {
        ...response.data,
        questions: (response.data.questions || []).map((q: any) => {
          let choices = q.choices;
          if (typeof choices === 'string') {
            try {
              choices = JSON.parse(choices);
            } catch (e) {
              console.error('Failed to parse choices:', e);
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
      
      // Initialize answers
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

    // Check if all required questions are answered
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
      // Convert answers to the format expected by API
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary"></div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="text-center py-12">
        <p className="text-xl text-gray-500 mb-4">الامتحان غير موجود</p>
        <button
          onClick={() => router.push('/dashboard/exams')}
          className="px-6 py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary-dark transition"
        >
          العودة إلى الامتحانات
        </button>
      </div>
    );
  }

  const now = new Date();
  const start = new Date(exam.startDate);
  const end = new Date(exam.endDate);

  if (now < start) {
    return (
      <div className="text-center py-12">
        <p className="text-xl text-gray-500 mb-4">الامتحان لم يبدأ بعد</p>
        <p className="text-lg text-gray-600 mb-6">
          سيبدأ في: {start.toLocaleDateString('ar-SA')} {start.toLocaleTimeString('ar-SA')}
        </p>
        <button
          onClick={() => router.push('/dashboard/exams')}
          className="px-6 py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary-dark transition"
        >
          العودة إلى الامتحانات
        </button>
      </div>
    );
  }

  if (now > end) {
    return (
      <div className="text-center py-12">
        <p className="text-xl text-gray-500 mb-4">الامتحان انتهى</p>
        <p className="text-lg text-gray-600 mb-6">
          انتهى في: {end.toLocaleDateString('ar-SA')} {end.toLocaleTimeString('ar-SA')}
        </p>
        <button
          onClick={() => router.push('/dashboard/exams')}
          className="px-6 py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary-dark transition"
        >
          العودة إلى الامتحانات
        </button>
      </div>
    );
  }

  // Check if all lessons are completed
  if (exam.courseCompletionRequired && !exam.allLessonsCompleted) {
    return (
      <div className="text-center py-12">
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-8 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-yellow-800 mb-4">⚠️ يجب إكمال جميع دروس الدورة</h2>
          <p className="text-lg text-gray-700 mb-4">
            لا يمكنك إجراء هذا الامتحان حتى تكمل جميع دروس الدورة
          </p>
          <div className="bg-white rounded-lg p-4 mb-6">
            <p className="text-gray-800 font-semibold">
              الدروس المكتملة: {exam.completedLessons || 0} من {exam.totalLessons || 0}
            </p>
            <div className="w-full bg-gray-200 rounded-full h-4 mt-2">
              <div
                className="bg-primary h-4 rounded-full transition-all"
                style={{ width: `${exam.totalLessons ? (exam.completedLessons || 0) / exam.totalLessons * 100 : 0}%` }}
              ></div>
            </div>
          </div>
          <button
            onClick={() => router.push(`/courses/${exam.course?.id || ''}`)}
            className="px-6 py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary-dark transition"
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-gray-800">{exam.title}</h1>
            {exam.description && (
              <p className="text-gray-700 mb-4">{exam.description}</p>
            )}
            <div className="flex gap-4 text-sm text-gray-600">
              <span>الدرجة الكاملة: {exam.maxScore}</span>
              <span>درجة النجاح: {exam.passingScore}</span>
              <span>عدد الأسئلة: {exam.questions.length}</span>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold mb-2 ${
              timeRemaining < 10 ? 'text-red-600' : 
              timeRemaining < 30 ? 'text-yellow-600' : 
              'text-green-600'
            }`}>
              {formatTime(timeRemaining)}
            </div>
            <p className="text-sm text-gray-500">الوقت المتبقي</p>
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-6 mb-6">
        {exam.questions && exam.questions.length > 0 ? (
          exam.questions.map((question, index) => (
          <div key={question.id} className="bg-white rounded-lg shadow-lg p-6 border-2 border-gray-200">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                السؤال {index + 1} ({question.points} نقطة)
              </h3>
            </div>
            <p className="text-lg mb-4 whitespace-pre-wrap text-gray-800 font-semibold">{question.prompt}</p>

            {question.type === 'MULTIPLE_CHOICE' && question.choices && question.choices.length > 0 && (
              <div className="space-y-3">
                {question.choices.map((choice: string, choiceIndex: number) => (
                  <label
                    key={choiceIndex}
                    className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-primary cursor-pointer transition"
                  >
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      value={choiceIndex}
                      checked={answers[question.id] === choiceIndex}
                      onChange={() => handleAnswerChange(question.id, choiceIndex)}
                      className="w-5 h-5 text-primary focus:ring-primary"
                    />
                    <span className="mr-3 text-lg text-gray-800">{choice}</span>
                  </label>
                ))}
              </div>
            )}

            {question.type === 'TEXT' && (
              <input
                type="text"
                value={answers[question.id] || ''}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-primary text-gray-800 bg-white"
                placeholder="اكتب إجابتك هنا..."
              />
            )}

            {question.type === 'ESSAY' && (
              <textarea
                value={answers[question.id] || ''}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                rows={6}
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-primary text-gray-800 bg-white"
                placeholder="اكتب إجابتك هنا..."
              />
            )}
          </div>
          ))
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center border-2 border-gray-200">
            <p className="text-xl text-gray-800 mb-4 font-bold">لا توجد أسئلة في هذا الامتحان</p>
            <p className="text-gray-700">يرجى التواصل مع المعلم لإضافة أسئلة</p>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-lg text-gray-800 font-semibold">
              تم الإجابة على {Object.values(answers).filter(a => a !== null && a !== '' && a !== undefined).length} من {exam.questions.length} سؤال
            </p>
          </div>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-8 py-4 bg-primary text-white rounded-lg font-bold text-lg hover:bg-primary-dark transition disabled:opacity-50"
          >
            {submitting ? 'جاري التسليم...' : 'تسليم الامتحان'}
          </button>
        </div>
      </div>
    </div>
  );
}

