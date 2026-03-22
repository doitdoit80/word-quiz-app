'use client';

import { useState, FormEvent, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

type Tab = 'find-email' | 'reset-password';

export default function FindAccountPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    }>
      <FindAccountContent />
    </Suspense>
  );
}

function FindAccountContent() {
  const searchParams = useSearchParams();
  const initialTab: Tab = searchParams.get('tab') === 'reset' ? 'reset-password' : 'find-email';
  const [tab, setTab] = useState<Tab>(initialTab);

  // Find email state
  const [findName, setFindName] = useState('');
  const [findPhone, setFindPhone] = useState('');
  const [findLoading, setFindLoading] = useState(false);
  const [findResult, setFindResult] = useState<{ email: string; maskedEmail: string; createdAt: string } | null>(null);
  const [findError, setFindError] = useState('');

  // Reset password state
  const [resetEmail, setResetEmail] = useState('');
  const [resetPhone, setResetPhone] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMsg, setResetMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  async function handleFindEmail(e: FormEvent) {
    e.preventDefault();
    setFindError('');
    setFindResult(null);

    if (!findName || !findPhone) {
      setFindError('모든 항목을 입력해주세요.');
      return;
    }

    setFindLoading(true);
    try {
      const res = await fetch('/api/auth/find-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: findName, phone: findPhone }),
      });
      const data = await res.json();
      if (res.ok) {
        setFindResult(data);
      } else {
        setFindError(data.error);
      }
    } catch {
      setFindError('서버 오류가 발생했습니다.');
    }
    setFindLoading(false);
  }

  async function handleResetPassword(e: FormEvent) {
    e.preventDefault();
    setResetMsg(null);

    if (!resetEmail || !resetPhone) {
      setResetMsg({ type: 'err', text: '모든 항목을 입력해주세요.' });
      return;
    }

    setResetLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail, phone: resetPhone }),
      });
      const data = await res.json();
      if (res.ok) {
        setResetMsg({ type: 'ok', text: '비밀번호 초기화 이메일을 발송했습니다. 이메일을 확인해주세요. (5분 내 유효)' });
        setResetEmail('');
        setResetPhone('');
      } else {
        setResetMsg({ type: 'err', text: data.error });
      }
    } catch {
      setResetMsg({ type: 'err', text: '서버 오류가 발생했습니다.' });
    }
    setResetLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">📚 단어 테스트</h1>
          <p className="text-gray-500 mt-2">계정 찾기</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* 탭 */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setTab('find-email')}
              className={`flex-1 py-3 text-sm font-medium transition ${
                tab === 'find-email'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              아이디 찾기
            </button>
            <button
              onClick={() => setTab('reset-password')}
              className={`flex-1 py-3 text-sm font-medium transition ${
                tab === 'reset-password'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              비밀번호 초기화
            </button>
          </div>

          <div className="p-8">
            {tab === 'find-email' ? (
              <form onSubmit={handleFindEmail} className="space-y-4">
                {findError && (
                  <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg border border-red-200">
                    {findError}
                  </div>
                )}

                {findResult && (
                  <div className="bg-green-50 text-green-700 text-sm px-4 py-4 rounded-lg border border-green-200">
                    <p className="font-semibold mb-1">계정을 찾았습니다!</p>
                    <p>이메일: <span className="font-mono">{findResult.maskedEmail}</span></p>
                    <p className="text-xs text-green-600 mt-1">
                      가입일: {new Date(findResult.createdAt).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                  <input
                    type="text"
                    value={findName}
                    onChange={(e) => setFindName(e.target.value)}
                    placeholder="홍길동"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">핸드폰 번호</label>
                  <input
                    type="tel"
                    value={findPhone}
                    onChange={(e) => setFindPhone(e.target.value)}
                    placeholder="01012345678"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={findLoading}
                  className="w-full py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {findLoading ? '찾는 중...' : '아이디 찾기'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                {resetMsg && (
                  <div
                    className={`text-sm px-4 py-3 rounded-lg border ${
                      resetMsg.type === 'ok'
                        ? 'bg-green-50 text-green-600 border-green-200'
                        : 'bg-red-50 text-red-600 border-red-200'
                    }`}
                  >
                    {resetMsg.text}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="example@email.com"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">핸드폰 번호</label>
                  <input
                    type="tel"
                    value={resetPhone}
                    onChange={(e) => setResetPhone(e.target.value)}
                    placeholder="01012345678"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {resetLoading ? '발송 중...' : '초기화 이메일 발송'}
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
    </div>
  );
}
