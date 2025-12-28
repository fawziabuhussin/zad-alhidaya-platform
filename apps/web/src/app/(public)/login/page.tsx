'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [useEmail, setUseEmail] = useState(true);

  useEffect(() => {
    // Load Google Sign-In script on mount
    if (typeof window !== 'undefined' && !(window as any).google) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  }, []);

  const handleLoginSuccess = (user: any, accessToken: string) => {
    // Store token and user data
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('user', JSON.stringify(user));
    
    // Determine redirect path based on role
    let redirectPath = '/dashboard';
    const userRole = user.role?.toUpperCase() || user.role;
    
    if (userRole === 'ADMIN') {
      redirectPath = '/admin';
    } else if (userRole === 'TEACHER') {
      redirectPath = '/teacher';
    }
    
    // Force page reload to new location
    window.location.replace(redirectPath);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (loading) return; // Prevent double submission
    
    setError('');
    setLoading(true);

    try {
      const loginData = useEmail 
        ? { email, password }
        : { username, password };
      const response = await api.post('/auth/login', loginData);
      
      if (!response || !response.data) {
        throw new Error('No response from server');
      }
      
      const { accessToken, user } = response.data;

      if (!accessToken) {
        throw new Error('No access token received');
      }

      if (!user) {
        throw new Error('No user data received');
      }

      handleLoginSuccess(user, accessToken);
      
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.response) {
        console.error('Error response:', err.response.data);
      }
      const errorMessage = err.response?.data?.message || err.message || 'فشل تسجيل الدخول';
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (loading) return;
    
    setError('');
    setLoading(true);

    try {
      // Wait for Google script to load
      if (typeof window === 'undefined' || !(window as any).google) {
        // Load Google Sign-In script
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      if (!clientId) {
        setError('Google Client ID غير موجود. أضف NEXT_PUBLIC_GOOGLE_CLIENT_ID في .env.local');
        setLoading(false);
        return;
      }

      // Initialize Google Sign-In
      (window as any).google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: any) => {
          try {
            const res = await api.post('/auth/google', { token: response.credential });
            const { accessToken, user } = res.data;
            handleLoginSuccess(user, accessToken);
          } catch (err: any) {
            console.error('Google OAuth error:', err);
            setError(err.response?.data?.message || 'فشل تسجيل الدخول باستخدام Google');
            setLoading(false);
          }
        },
      });

      // Trigger sign-in popup
      (window as any).google.accounts.id.prompt();
      setLoading(false);
    } catch (err: any) {
      console.error('Google login error:', err);
      setError('فشل تحميل Google Sign-In. تأكد من إضافة NEXT_PUBLIC_GOOGLE_CLIENT_ID في .env.local');
      setLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    if (loading) return;
    
    setError('');
    setLoading(true);

    try {
      // Apple Sign In
      if (typeof window === 'undefined' || !(window as any).AppleID) {
        // Load Apple Sign-In script
        const script = document.createElement('script');
        script.src = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
        script.async = true;
        document.head.appendChild(script);
        
        script.onload = () => {
          initializeAppleSignIn();
        };
      } else {
        initializeAppleSignIn();
      }
    } catch (err: any) {
      console.error('Apple login error:', err);
      setError('فشل تسجيل الدخول باستخدام Apple');
      setLoading(false);
    }
  };

  const initializeAppleSignIn = () => {
    if (typeof window === 'undefined' || !(window as any).AppleID) {
      setError('فشل تحميل Apple Sign-In');
      setLoading(false);
      return;
    }

    (window as any).AppleID.auth.init({
      clientId: process.env.NEXT_PUBLIC_APPLE_CLIENT_ID || '',
      scope: 'name email',
      redirectURI: window.location.origin + '/auth/apple/callback',
      usePopup: true,
    });

    (window as any).AppleID.auth.signIn({
      requestedScopes: 'name email',
    }).then(async (response: any) => {
      try {
        const res = await api.post('/auth/apple', {
          identityToken: response.id_token,
          user: response.user,
        });
        const { accessToken, user } = res.data;
        handleLoginSuccess(user, accessToken);
      } catch (err: any) {
        console.error('Apple OAuth error:', err);
        setError(err.response?.data?.message || 'فشل تسجيل الدخول باستخدام Apple');
        setLoading(false);
      }
    }).catch((err: any) => {
      console.error('Apple Sign-In error:', err);
      setError('فشل تسجيل الدخول باستخدام Apple');
      setLoading(false);
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          تسجيل الدخول
        </h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => {
                setUseEmail(true);
                setUsername('');
                setError('');
              }}
              className={`flex-1 px-4 py-2 rounded-lg font-semibold transition ${
                useEmail
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              البريد الإلكتروني
            </button>
            <button
              type="button"
              onClick={() => {
                setUseEmail(false);
                setEmail('');
                setError('');
              }}
              className={`flex-1 px-4 py-2 rounded-lg font-semibold transition ${
                !useEmail
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              اسم المستخدم
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">
              {useEmail ? 'البريد الإلكتروني' : 'اسم المستخدم'}
            </label>
            {useEmail ? (
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-800 bg-white"
                placeholder="example@email.com"
              />
            ) : (
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError('');
                }}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-800 bg-white"
                placeholder="اسم المستخدم أو البريد الإلكتروني"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">
              كلمة المرور
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-800 bg-white"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-3 rounded-lg font-bold hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'جاري التحقق...' : 'دخول'}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">أو</span>
          </div>
        </div>

        {/* OAuth Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>تسجيل الدخول باستخدام Google</span>
          </button>

          <button
            onClick={handleAppleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C1.79 15.25 4.96 7.59 9.38 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
            <span>تسجيل الدخول باستخدام Apple</span>
          </button>
        </div>

        <p className="mt-6 text-center text-gray-700">
          ليس لديك حساب؟{' '}
          <Link href="/register" className="text-primary font-semibold hover:underline">
            سجل الآن
          </Link>
        </p>
      </div>
    </div>
  );
}

