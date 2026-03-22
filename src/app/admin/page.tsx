'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

interface UserInfo {
  id: number;
  email: string;
  name: string;
  phone: string;
  role: string;
  gems: number;
  createdAt: string;
}

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [gemInputs, setGemInputs] = useState<Record<number, string>>({});

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) return;
    fetchUsers();
  }, [isLoading, user]);

  async function fetchUsers() {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      }
    } catch {}
    setLoading(false);
  }

  async function deleteUser(id: number, name: string) {
    if (!confirm(`"${name}" 사용자를 정말 삭제하시겠습니까?`)) return;
    const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } else {
      const data = await res.json();
      alert(data.error || '삭제 실패');
    }
  }

  async function adjustGems(id: number, amount: number) {
    const res = await fetch(`/api/admin/users/${id}/gems`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount }),
    });
    if (res.ok) {
      const data = await res.json();
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, gems: data.gems } : u)));
      setGemInputs((prev) => ({ ...prev, [id]: '' }));
    }
  }

  if (isLoading || loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">권한 없음</h1>
        <p className="text-gray-500 mb-6">관리자만 접근할 수 있습니다.</p>
        <Link href="/" className="text-blue-600 hover:underline">
          홈으로 돌아가기
        </Link>
      </div>
    );
  }

  const totalGems = users.reduce((sum, u) => sum + u.gems, 0);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">관리자 페이지</h1>
          <p className="text-gray-500 mt-1">사용자 및 보석 관리</p>
        </div>
        <Link
          href="/"
          className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
        >
          홈으로
        </Link>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">총 사용자</p>
          <p className="text-3xl font-bold text-gray-900">{users.length}명</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">총 보석</p>
          <p className="text-3xl font-bold text-blue-600">{totalGems.toLocaleString()}개</p>
        </div>
      </div>

      {/* 사용자 목록 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">이름</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">이메일</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">핸드폰</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">역할</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">보석</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">가입일</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">액션</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                <td className="px-4 py-3 text-gray-600">{u.email}</td>
                <td className="px-4 py-3 text-gray-600">{u.phone || '-'}</td>
                <td className="px-4 py-3 text-center">
                  {u.role === 'admin' ? (
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                      관리자
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                      사용자
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => adjustGems(u.id, -1)}
                      className="w-6 h-6 rounded bg-red-100 text-red-600 hover:bg-red-200 text-xs font-bold transition"
                    >
                      -
                    </button>
                    <span className="min-w-[3rem] text-center font-semibold text-blue-600">
                      {u.gems}
                    </span>
                    <button
                      onClick={() => adjustGems(u.id, 1)}
                      className="w-6 h-6 rounded bg-green-100 text-green-600 hover:bg-green-200 text-xs font-bold transition"
                    >
                      +
                    </button>
                    <div className="flex items-center gap-1 ml-2">
                      <input
                        type="number"
                        placeholder="수량"
                        value={gemInputs[u.id] || ''}
                        onChange={(e) =>
                          setGemInputs((prev) => ({ ...prev, [u.id]: e.target.value }))
                        }
                        className="w-16 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                      />
                      <button
                        onClick={() => {
                          const val = parseInt(gemInputs[u.id] || '0', 10);
                          if (val !== 0) adjustGems(u.id, val);
                        }}
                        className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                      >
                        적용
                      </button>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-center text-gray-500 text-xs">
                  {u.createdAt ? new Date(u.createdAt).toLocaleDateString('ko-KR') : '-'}
                </td>
                <td className="px-4 py-3 text-center">
                  {u.id !== user.id && (
                    <button
                      onClick={() => deleteUser(u.id, u.name)}
                      className="text-red-500 hover:text-red-700 text-xs font-medium transition"
                    >
                      삭제
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
