'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { loadData } from '@/lib/storage';

export default function ProfilePage() {
  const { user, isLoading, refreshUser } = useAuth();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [syncLoading, setSyncLoading] = useState(false);
  const [syncMsg, setSyncMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [localPreview, setLocalPreview] = useState<{
    wordBooks: number;
    totalWords: number;
    testHistory: number;
    statsCount: number;
    conquered: number;
    bookNames: string[];
  } | null>(null);

  // Initialize from user on first load
  const [profileInit, setProfileInit] = useState(false);
  if (user && !profileInit) {
    setName(user.name);
    setPhone(user.phone);
    setProfileInit(true);
  }

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 text-center">
        <p className="text-gray-500 mb-4">로그인이 필요합니다.</p>
        <Link href="/login" className="text-blue-600 hover:underline">
          로그인
        </Link>
      </div>
    );
  }

  async function handleUpdateProfile(e: FormEvent) {
    e.preventDefault();
    setProfileMsg(null);
    const trimmedName = name.trim();
    const trimmedPhone = phone.replace(/[^0-9]/g, '');
    if (!trimmedName) {
      setProfileMsg({ type: 'err', text: '이름을 입력해주세요.' });
      return;
    }
    if (!trimmedPhone.startsWith('010') || trimmedPhone.length !== 11) {
      setProfileMsg({ type: 'err', text: '핸드폰 번호는 010으로 시작하는 11자리여야 합니다.' });
      return;
    }
    setProfileLoading(true);
    try {
      const res = await fetch('/api/auth/update-profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedName, phone: trimmedPhone }),
      });
      const data = await res.json();
      if (res.ok) {
        await refreshUser();
        setProfileMsg({ type: 'ok', text: '회원정보가 변경되었습니다.' });
      } else {
        setProfileMsg({ type: 'err', text: data.error });
      }
    } catch {
      setProfileMsg({ type: 'err', text: '서버 오류가 발생했습니다.' });
    }
    setProfileLoading(false);
  }

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    setPwMsg(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwMsg({ type: 'err', text: '모든 항목을 입력해주세요.' });
      return;
    }
    if (newPassword.length < 8) {
      setPwMsg({ type: 'err', text: '새 비밀번호는 8자 이상이어야 합니다.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwMsg({ type: 'err', text: '새 비밀번호가 일치하지 않습니다.' });
      return;
    }

    setPwLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setPwMsg({ type: 'ok', text: '비밀번호가 변경되었습니다.' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPwMsg({ type: 'err', text: data.error });
      }
    } catch {
      setPwMsg({ type: 'err', text: '서버 오류가 발생했습니다.' });
    }
    setPwLoading(false);
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">회원정보</h1>
        <Link
          href="/"
          className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
        >
          홈으로
        </Link>
      </div>

      {/* 기본 정보 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">기본 정보</h2>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-500 mb-1">이메일</label>
          <p className="text-gray-900">{user.email}</p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-500 mb-1">핸드폰 번호</label>
          <p className="text-gray-900">{user.phone || '-'}</p>
        </div>

        <div className="mb-2">
          <label className="block text-sm font-medium text-gray-500 mb-1">보석</label>
          <p className="text-blue-600 font-semibold">💎 {user.gems}개</p>
        </div>

        <div className="mb-2">
          <label className="block text-sm font-medium text-gray-500 mb-1">계정 유형</label>
          <p className="text-gray-900">
            {user.role === 'admin' ? (
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                관리자
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                일반 사용자
              </span>
            )}
          </p>
        </div>
      </div>

      {/* 이름 변경 */}
      <form
        onSubmit={handleUpdateProfile}
        className="bg-white rounded-xl border border-gray-200 p-6 mb-6"
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">회원정보 변경</h2>

        {profileMsg && (
          <div
            className={`text-sm px-4 py-3 rounded-lg border mb-4 ${
              profileMsg.type === 'ok'
                ? 'bg-green-50 text-green-600 border-green-200'
                : 'bg-red-50 text-red-600 border-red-200'
            }`}
          >
            {profileMsg.text}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">핸드폰 번호</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01012345678"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>
          <button
            type="submit"
            disabled={profileLoading}
            className="w-full py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {profileLoading ? '변경 중...' : '변경'}
          </button>
        </div>
      </form>

      {/* 비밀번호 변경 */}
      <form
        onSubmit={handleChangePassword}
        className="bg-white rounded-xl border border-gray-200 p-6 mb-6"
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">비밀번호 변경</h2>

        {pwMsg && (
          <div
            className={`text-sm px-4 py-3 rounded-lg border mb-4 ${
              pwMsg.type === 'ok'
                ? 'bg-green-50 text-green-600 border-green-200'
                : 'bg-red-50 text-red-600 border-red-200'
            }`}
          >
            {pwMsg.text}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">현재 비밀번호</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              autoComplete="current-password"
            />
          </div>
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
            disabled={pwLoading}
            className="w-full py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {pwLoading ? '변경 중...' : '비밀번호 변경'}
          </button>
        </div>
      </form>
      {/* 데이터 동기화 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">데이터 동기화</h2>
        <p className="text-sm text-gray-500 mb-4">
          이 브라우저의 로컬 데이터를 서버에 업로드합니다. 서버의 기존 데이터는 덮어씌워집니다.
        </p>

        {syncMsg && (
          <div
            className={`text-sm px-4 py-3 rounded-lg border mb-4 ${
              syncMsg.type === 'ok'
                ? 'bg-green-50 text-green-600 border-green-200'
                : 'bg-red-50 text-red-600 border-red-200'
            }`}
          >
            {syncMsg.text}
          </div>
        )}

        {!localPreview ? (
          <button
            type="button"
            onClick={() => {
              const ld = loadData();
              if (ld.wordBooks.length === 0) {
                setLocalPreview({ wordBooks: 0, totalWords: 0, testHistory: 0, statsCount: 0, conquered: 0, bookNames: [] });
              } else {
                setLocalPreview({
                  wordBooks: ld.wordBooks.length,
                  totalWords: ld.wordBooks.reduce((sum, wb) => sum + wb.words.length, 0),
                  testHistory: ld.testHistory.length,
                  statsCount: Object.keys(ld.wordStats).length,
                  conquered: ld.conqueredPresets.length,
                  bookNames: ld.wordBooks.map((wb) => `${wb.name} (${wb.words.length}단어)`),
                });
              }
            }}
            className="w-full py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
          >
            로컬 데이터 확인하기
          </button>
        ) : localPreview.wordBooks === 0 ? (
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 text-sm text-gray-500 text-center">
            이 브라우저에 동기화할 로컬 데이터가 없습니다.
          </div>
        ) : (
          <>
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 mb-3 text-sm">
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="text-gray-500">단어장 <span className="font-semibold text-gray-900">{localPreview.wordBooks}개</span></div>
                <div className="text-gray-500">총 단어 <span className="font-semibold text-gray-900">{localPreview.totalWords}개</span></div>
                <div className="text-gray-500">테스트 기록 <span className="font-semibold text-gray-900">{localPreview.testHistory}건</span></div>
                <div className="text-gray-500">정복 프리셋 <span className="font-semibold text-gray-900">{localPreview.conquered}개</span></div>
              </div>
              <div className="text-gray-500">
                <span className="font-medium text-gray-700">단어장 목록:</span>
                <ul className="mt-1 space-y-0.5 text-gray-600">
                  {localPreview.bookNames.map((name, i) => (
                    <li key={i} className="truncate">· {name}</li>
                  ))}
                </ul>
              </div>
            </div>

            <button
              type="button"
              disabled={syncLoading}
              onClick={async () => {
                const localData = loadData();
                if (!confirm(
                  `로컬 데이터(단어장 ${localData.wordBooks.length}개)를 서버에 업로드합니다.\n서버의 기존 데이터는 삭제됩니다. 계속하시겠습니까?`
                )) return;

                setSyncLoading(true);
                setSyncMsg(null);
                try {
                  const res = await fetch('/api/sync', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(localData),
                  });
                  if (res.ok) {
                    localStorage.removeItem('word-quiz-app');
                    setSyncMsg({ type: 'ok', text: '동기화 완료! 로컬 데이터를 삭제하고 새로고침합니다...' });
                    setTimeout(() => window.location.reload(), 1000);
                  } else {
                    const d = await res.json();
                    setSyncMsg({ type: 'err', text: d.error || '동기화에 실패했습니다.' });
                  }
                } catch {
                  setSyncMsg({ type: 'err', text: '서버 오류가 발생했습니다.' });
                }
                setSyncLoading(false);
              }}
              className="w-full py-2.5 bg-amber-500 text-white font-semibold rounded-lg hover:bg-amber-600 disabled:opacity-50 transition"
            >
              {syncLoading ? '동기화 중...' : '로컬 데이터 → 서버 동기화'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
