'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { showSuccess, showError, TOAST_MESSAGES } from '@/lib/toast';
import { handleLoginRedirect } from '@/lib/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [useEmail, setUseEmail] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLoginSuccess = (user: any, accessToken: string) => {
    // Store token and user data
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('user', JSON.stringify(user));

    showSuccess(TOAST_MESSAGES.LOGIN_SUCCESS);

    // Check if profile is complete
    if (!user.profileComplete) {
      // Redirect to complete profile page
      window.location.href = '/complete-profile';
      return;
    }

    // Use centralized login redirect (hard navigation to refresh app state)
    handleLoginRedirect(user.role);
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
      const errorMessage = err.response?.data?.message || err.message || TOAST_MESSAGES.LOGIN_ERROR;
      setError(errorMessage);
      showError(errorMessage);
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (loading) return;
    
    setError('');
    setLoading(true);

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      const errorMsg = 'Google Client ID غير موجود. أضف NEXT_PUBLIC_GOOGLE_CLIENT_ID في .env.local';
      setError(errorMsg);
      showError(errorMsg);
      setLoading(false);
      return;
    }

    // OAuth 2.0 popup flow parameters
    const redirectUri = window.location.origin + '/auth/google/callback';
    const scope = 'openid email profile';
    const responseType = 'token id_token';
    const state = Math.random().toString(36).substring(7);
    
    // Store state for verification
    sessionStorage.setItem('google_oauth_state', state);

    // Build OAuth URL
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('response_type', responseType);
    authUrl.searchParams.append('scope', scope);
    authUrl.searchParams.append('state', state);
    authUrl.searchParams.append('nonce', Math.random().toString(36).substring(7));

    // Open popup window
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    
    const popup = window.open(
      authUrl.toString(),
      'Google Sign In',
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`
    );

    if (!popup) {
      const errorMsg = 'فشل فتح نافذة Google. قد يكون المتصفح قد حظر النوافذ المنبثقة.';
      setError(errorMsg);
      showError(errorMsg);
      setLoading(false);
      return;
    }

    // Listen for message from popup
    const handleMessage = async (event: MessageEvent) => {
      // Verify origin
      if (event.origin !== window.location.origin) return;
      
      if (event.data.type === 'GOOGLE_AUTH_SUCCESS' && event.data.idToken) {
        window.removeEventListener('message', handleMessage);
        
        try {
          const res = await api.post('/auth/google', { token: event.data.idToken });
          const { accessToken, user } = res.data;
          handleLoginSuccess(user, accessToken);
        } catch (err: any) {
          console.error('Google OAuth error:', err);
          const errorMsg = err.response?.data?.message || 'فشل تسجيل الدخول باستخدام Google';
          setError(errorMsg);
          showError(errorMsg);
          setLoading(false);
        }
      } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
        window.removeEventListener('message', handleMessage);
        const errorMsg = event.data.error || 'فشل تسجيل الدخول باستخدام Google';
        setError(errorMsg);
        showError(errorMsg);
        setLoading(false);
      }
    };

    window.addEventListener('message', handleMessage);

    // Check if popup was closed
    const checkPopup = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkPopup);
        window.removeEventListener('message', handleMessage);
        setLoading(false);
      }
    }, 500);
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
      const errorMsg = 'فشل تسجيل الدخول باستخدام Apple';
      setError(errorMsg);
      showError(errorMsg);
      setLoading(false);
    }
  };

  const initializeAppleSignIn = () => {
    if (typeof window === 'undefined' || !(window as any).AppleID) {
      const errorMsg = 'فشل تحميل Apple Sign-In';
      setError(errorMsg);
      showError(errorMsg);
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
        const errorMsg = err.response?.data?.message || 'فشل تسجيل الدخول باستخدام Apple';
        setError(errorMsg);
        showError(errorMsg);
        setLoading(false);
      }
    }).catch((err: any) => {
      console.error('Apple Sign-In error:', err);
      const errorMsg = 'فشل تسجيل الدخول باستخدام Apple';
      setError(errorMsg);
      showError(errorMsg);
      setLoading(false);
    });
  };

  return (
    <div className="min-h-screen flex" dir="rtl">
      {/* Left side - Decorative Islamic Panel */}
      <div 
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col items-center justify-center p-12 bg-[#1a3a2f]"
      >
        {/* Content - centered */}
        <div className={`relative z-10 text-center transition-all duration-1000 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
          {/* App name in Arabic calligraphy style */}
          <h1 className="text-4xl font-bold text-[#c9a227] mb-3 tracking-wide drop-shadow-lg" style={{ fontFamily: 'serif' }}>
            زاد الهداية
          </h1>
          
          {/* Tagline */}
          <p className="text-white text-lg mb-4 drop-shadow-md font-medium">
            منصة تعليمية إسلامية متكاملة
          </p>
          
          {/* Decorative line */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-[1px] bg-[#c9a227]/70"></div>
            <div className="w-2 h-2 rotate-45 bg-[#c9a227]"></div>
            <div className="w-12 h-[1px] bg-[#c9a227]/70"></div>
          </div>
          
          {/* Surah Al-Alaq - First 5 verses */}
          <div className="text-white/90 text-base leading-relaxed drop-shadow-md space-y-2">
            <p>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
            <p>اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ</p>
            <p>خَلَقَ الْإِنسَانَ مِنْ عَلَقٍ</p>
            <p>اقْرَأْ وَرَبُّكَ الْأَكْرَمُ</p>
            <p>الَّذِي عَلَّمَ بِالْقَلَمِ</p>
            <p>عَلَّمَ الْإِنسَانَ مَا لَمْ يَعْلَمْ</p>
          </div>
        </div>
        
        {/* Bottom decorative border */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#c9a227]/50 to-transparent"></div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-[#fdfbf7] to-[#f5f0e8] relative overflow-hidden">
        {/* Watermark pattern overlay */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'url(/islamic-bg.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center center',
          }}
        ></div>
        
        <div className={`w-full max-w-md relative z-10 transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {/* Mobile header - only visible on small screens */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-3xl font-bold text-[#1a3a2f] mb-2" style={{ fontFamily: 'serif' }}>
              زاد الهداية
            </h1>
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-8 h-[1px] bg-[#c9a227]/50"></div>
              <div className="w-1.5 h-1.5 rotate-45 bg-[#c9a227]"></div>
              <div className="w-8 h-[1px] bg-[#c9a227]/50"></div>
            </div>
            <p className="text-[#1a3a2f]/60 text-sm">منصة تعليمية إسلامية متكاملة</p>
          </div>

          {/* Form Card */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-[#c9a227]/10">
            <h2 className="text-2xl font-bold text-center mb-6 text-[#1a3a2f]">
              تسجيل الدخول
            </h2>

            {error && (
              <div 
                id="login-error"
                role="alert" 
                aria-live="assertive"
                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {/* Toggle buttons */}
              <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setUseEmail(true);
                    setUsername('');
                    setError('');
                  }}
                  className={`touch-btn flex-1 rounded-lg font-medium text-sm transition-all duration-300 ${
                    useEmail
                      ? 'bg-[#1a3a2f] text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-800'
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
                  className={`touch-btn flex-1 rounded-lg font-medium text-sm transition-all duration-300 ${
                    !useEmail
                      ? 'bg-[#1a3a2f] text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  اسم المستخدم
                </button>
              </div>

              {/* Input fields */}
              <div>
                <label htmlFor={useEmail ? 'email' : 'username'} className="block text-sm font-medium text-[#1a3a2f]/80 mb-2">
                  {useEmail ? 'البريد الإلكتروني' : 'اسم المستخدم'}
                </label>
                {useEmail ? (
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError('');
                    }}
                    required
                    autoComplete="email"
                    aria-describedby={error ? 'login-error' : undefined}
                    className="touch-input w-full border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1a3a2f]/20 focus:border-[#1a3a2f] text-gray-800 bg-white/80 transition-all duration-200"
                    placeholder="example@email.com"
                  />
                ) : (
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setError('');
                    }}
                    required
                    autoComplete="username"
                    aria-describedby={error ? 'login-error' : undefined}
                    className="touch-input w-full border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1a3a2f]/20 focus:border-[#1a3a2f] text-gray-800 bg-white/80 transition-all duration-200"
                    placeholder="اسم المستخدم"
                  />
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[#1a3a2f]/80 mb-2">
                  كلمة المرور
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  aria-describedby={error ? 'login-error' : undefined}
                  className="touch-input w-full border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1a3a2f]/20 focus:border-[#1a3a2f] text-gray-800 bg-white/80 transition-all duration-200"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="touch-btn w-full bg-[#1a3a2f] text-white rounded-xl font-bold hover:bg-[#143026] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    جاري التحقق...
                  </span>
                ) : 'دخول'}
              </button>
            </form>

            {/* Decorative Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 bg-white text-gray-400 text-sm flex items-center gap-2">
                  <span className="w-1 h-1 rotate-45 bg-[#c9a227]"></span>
                  أو
                  <span className="w-1 h-1 rotate-45 bg-[#c9a227]"></span>
                </span>
              </div>
            </div>

            {/* OAuth Buttons */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                aria-label="تسجيل الدخول باستخدام حساب Google"
                className="touch-btn w-full gap-3 bg-white border-2 border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
                type="button"
                onClick={handleAppleLogin}
                disabled={loading}
                aria-label="تسجيل الدخول باستخدام حساب Apple"
                className="touch-btn w-full gap-3 bg-black text-white rounded-xl font-medium hover:bg-gray-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C1.79 15.25 4.96 7.59 9.38 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                <span>تسجيل الدخول باستخدام Apple</span>
              </button>
            </div>

            {/* Register link */}
            <p className="mt-6 text-center text-gray-600">
              ليس لديك حساب؟{' '}
              <Link href="/register" className="text-[#1a3a2f] font-semibold hover:text-[#c9a227] transition-colors duration-200">
                سجل الآن
              </Link>
            </p>
          </div>

          {/* Bottom quote - desktop only */}
          <p className="hidden lg:block text-center text-[#1a3a2f]/50 text-xs mt-6">
            « وَقُل رَبِّ زِدْنِي عِلْمًا »
          </p>
        </div>
      </div>
    </div>
  );
}
