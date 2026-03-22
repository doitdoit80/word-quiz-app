'use client';

import { useState, FormEvent, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    if (!token) {
      setResult({ type: 'err', text: '유효하지 않은 링크입니다.' });
    }
  }, [token]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setResult(null);

    if (!newPassword || !confirmPassword) {
      setResult({ type: 'err', text: '모든 항목을 입력해주세요.' });
      return;
    }

    if (newPassword.length < 8) {
      setResult({ type: 'err', text: '새 비밀번호는 8자 이상이어야 합니다.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setResult({ type: 'err', text: '새 비밀번호가 일치하지 않습니다.' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ type: 'ok', text: '비밀번호가 초기화되었습니다!' });
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setResult({ type: 'err', text: data.error });
      }
    } catch {
      setResult({ type: 'err', text: '서버 오류가 발생했습니다.' });
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">📚 단어 테스트</h1>
          <p className="text-gray-500 mt-2">비밀번호 초기화</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          {result?.type === 'ok' ? (
            <div className="text-center">
              <div className="bg-green-50 text-green-700 text-sm px-4 py-4 rounded-lg border border-green-200 mb-6">
                {result.text}
              </div>
              <Link
                href="/login"
                className="inline-block px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
              >
                로그인하러 가기
              </Link>
            </div>
          ) : !token ? (
            <div className="text-center">
              <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg border border-red-200 mb-6">
                유효하지 않은 링크입니다.
              </div>
              <Link
                href="/find-account"
                className="text-blue-600 hover:underline font-medium text-sm"
              >
                비밀번호 초기화 다시 요청하기
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {result?.type === 'err' && (
                <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg border border-red-200">
                  {result.text}
                </div>
              )}

              <p className="text-sm text-gray-600 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                ⏰ 이 링크는 <strong>5분</strong> 동안만 유효합니다.
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">새 비밀번호</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="8자 이상"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  autoComplete="new-password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">새 비밀번호 확인</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="새 비밀번호 다시 입력"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  autoComplete="new-password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {loading ? '처리 중...' : '비밀번호 변경'}
              </button>
            </form>
          )}

          <p className="text-center text-sm text-gray-500 mt-6">
            <Link href="/login" className="text-blue-600 hover:underline font-medium">
              로그인으로 돌아가기
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
