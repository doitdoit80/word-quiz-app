'use client';

import { useState, FormEvent, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function CompleteSignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    }>
      <CompleteSignupContent />
    </Suspense>
  );
}

function CompleteSignupContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    const trimmed = phone.replace(/[^0-9]/g, '');
    if (!trimmed.startsWith('010') || trimmed.length !== 11) {
      setError('핸드폰 번호는 010으로 시작하는 11자리여야 합니다.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/complete-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, phone: trimmed }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push('/');
      } else {
        setError(data.error);
      }
    } catch {
      setError('서버 오류가 발생했습니다.');
    }
    setLoading(false);
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-gray-500 mb-4">유효하지 않은 접근입니다.</p>
          <a href="/login" className="text-blue-600 hover:underline font-medium">
            로그인으로 돌아가기
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">📚 단어 테스트</h1>
          <p className="text-gray-500 mt-2">가입을 완료해주세요</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-5"
        >
          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg border border-red-200">
              {error}
            </div>
          )}

          <div className="bg-blue-50 text-blue-700 text-sm px-4 py-3 rounded-lg border border-blue-200">
            Google 계정으로 가입하려면 핸드폰 번호를 입력해주세요.
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">핸드폰 번호</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01012345678"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {loading ? '처리 중...' : '가입 완료'}
          </button>
        </form>
      </div>
    </div>
  );
}
