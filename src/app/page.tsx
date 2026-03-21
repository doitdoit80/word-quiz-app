'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/contexts/AppContext';
import { formatDate } from '@/lib/utils';

interface Preset {
  id: string;
  name: string;
  description: string;
  fileName: string;
  wordCount: number;
  tags: string[];
}

export default function HomePage() {
  const { data, dispatch } = useApp();
  const router = useRouter();
  const [newBookName, setNewBookName] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [loadingPreset, setLoadingPreset] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  useEffect(() => {
    if (showPresets && presets.length === 0) {
      fetch('/presets/index.json')
        .then((res) => res.json())
        .then((data) => setPresets(data))
        .catch(() => {});
    }
  }, [showPresets, presets.length]);

  async function addPreset(preset: Preset) {
    if (data.wordBooks.some((wb) => wb.name === preset.name)) return;
    setLoadingPreset(preset.id);
    try {
      const res = await fetch(`/presets/${preset.fileName}`);
      const words = await res.json();
      dispatch({ type: 'ADD_WORDBOOK_WITH_WORDS', name: preset.name, words, isPreset: true });
    } catch {
      alert('단어장을 불러오는데 실패했습니다.');
    } finally {
      setLoadingPreset(null);
    }
  }

  function addWordBook() {
    const name = newBookName.trim();
    if (!name) return;
    dispatch({ type: 'ADD_WORDBOOK', name });
    setNewBookName('');
    setShowForm(false);
  }

  function getLastTest(wordBookId: string) {
    return data.testHistory.find((r) => r.wordBookId === wordBookId);
  }

  function startEditName(wb: { id: string; name: string }) {
    setEditingNameId(wb.id);
    setEditingName(wb.name);
  }

  function saveEditName(id: string) {
    const name = editingName.trim();
    if (name) dispatch({ type: 'RENAME_WORDBOOK', id, name });
    setEditingNameId(null);
  }

  function handleDragStart(id: string) {
    setDraggedId(id);
  }

  function handleDragOver(e: React.DragEvent, id: string) {
    e.preventDefault();
    if (id !== draggedId) setDragOverId(id);
  }

  function handleDrop(targetId: string) {
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }
    const ids = data.wordBooks.map((wb) => wb.id);
    const fromIdx = ids.indexOf(draggedId);
    const toIdx = ids.indexOf(targetId);
    const newIds = [...ids];
    newIds.splice(fromIdx, 1);
    newIds.splice(toIdx, 0, draggedId);
    dispatch({ type: 'REORDER_WORDBOOKS', ids: newIds });
    setDraggedId(null);
    setDragOverId(null);
  }

  function handleDragEnd() {
    setDraggedId(null);
    setDragOverId(null);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">📚 단어 테스트 앱</h1>
        <p className="text-gray-500 mt-1">단어장을 만들고 테스트해보세요</p>
      </header>

      {/* 단어장 추가 */}
      <div className="mb-6">
        {showForm ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={newBookName}
              onChange={(e) => setNewBookName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addWordBook();
                if (e.key === 'Escape') { setShowForm(false); setNewBookName(''); }
              }}
              placeholder="단어장 이름을 입력하세요"
              autoFocus
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
            <button
              onClick={addWordBook}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 font-medium"
            >
              추가
            </button>
            <button
              onClick={() => { setShowForm(false); setNewBookName(''); }}
              className="border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-600"
            >
              취소
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 font-medium"
            >
              + 내 단어장 추가
            </button>
            <button
              onClick={() => setShowPresets(!showPresets)}
              className={`px-5 py-2.5 rounded-lg font-medium border transition-colors ${
                showPresets
                  ? 'bg-purple-50 border-purple-300 text-purple-700'
                  : 'border-purple-300 text-purple-600 hover:bg-purple-50'
              }`}
            >
              AI가 만든 단어장
            </button>
          </div>
        )}
      </div>

      {/* AI 프리셋 단어장 */}
      {showPresets && (
        <div className="mb-8 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-lg">🤖</span>
                <h2 className="text-lg font-bold text-purple-800">AI가 만든 단어장</h2>
              </div>
              <p className="text-xs text-purple-500">좌우로 스크롤하여 세트를 선택하세요</p>
            </div>
            <span className="text-xs text-purple-400">총 {presets.reduce((sum, p) => sum + p.wordCount, 0).toLocaleString()}개</span>
          </div>

          {[
            {
              group: '중등',
              groupIcon: '📗',
              grades: [
                { grade: '중1', level: '기초', badgeCls: 'bg-green-100 text-green-700', setsCount: 10 },
                { grade: '중2', level: '중급', badgeCls: 'bg-blue-100 text-blue-700', setsCount: 10 },
                { grade: '중3', level: '심화', badgeCls: 'bg-purple-100 text-purple-700', setsCount: 10 },
              ],
            },
            {
              group: '고등',
              groupIcon: '📕',
              grades: [
                { grade: '고1', level: '고급 기초', badgeCls: 'bg-teal-100 text-teal-700', setsCount: 15 },
                { grade: '고2', level: '수능', badgeCls: 'bg-orange-100 text-orange-700', setsCount: 15 },
                { grade: '고3', level: '수능 고난도', badgeCls: 'bg-red-100 text-red-700', setsCount: 15 },
              ],
            },
          ].map(({ group, groupIcon, grades }) => (
            <div key={group} className="mb-5 last:mb-0">
              <div className="flex items-center gap-1.5 mb-3">
                <span className="text-sm">{groupIcon}</span>
                <span className="text-sm font-bold text-gray-700">{group} 과정</span>
              </div>
              {grades.map(({ grade, level, badgeCls, setsCount }) => {
                const gradePresets = presets.filter((p) => p.tags[0] === grade);
                const conqueredCount = gradePresets.filter((p) => data.conqueredPresets.includes(p.name)).length;
                return (
                  <div key={grade} className="mb-4 last:mb-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badgeCls}`}>
                        {grade}
                      </span>
                      <span className="text-sm font-medium text-gray-700">{level}</span>
                      {conqueredCount > 0 && (
                        <span className="text-xs text-green-600 font-medium">👑 {conqueredCount}/{setsCount} 정복</span>
                      )}
                    </div>
                    <div
                      className="flex gap-2 overflow-x-auto pb-2"
                      style={{ scrollbarWidth: 'thin' }}
                    >
                      {gradePresets.map((preset, idx) => {
                        const isAdded = data.wordBooks.some((wb) => wb.name === preset.name);
                        const isConquered = data.conqueredPresets.includes(preset.name);
                        const isLoading = loadingPreset === preset.id;
                        return (
                          <button
                            key={preset.id}
                            onClick={() => addPreset(preset)}
                            disabled={isAdded || isLoading}
                            className={`flex-shrink-0 w-28 rounded-xl p-3 text-left transition-all relative ${
                              isAdded
                                ? 'bg-gray-100 border border-gray-200 opacity-60'
                                : isConquered
                                ? 'bg-green-50 border border-green-300 hover:border-green-400 hover:shadow-md active:scale-95'
                                : isLoading
                                ? 'bg-purple-100 border border-purple-300 animate-pulse'
                                : 'bg-white border border-purple-200 hover:border-purple-400 hover:shadow-md active:scale-95'
                            }`}
                          >
                            {isConquered && (
                              <span className="absolute top-1.5 right-1.5 text-sm" title="정복 완료!">👑</span>
                            )}
                            <div className={`text-2xl font-bold mb-1 ${
                              isAdded ? 'text-gray-400' : isConquered ? 'text-green-600' : 'text-purple-600'
                            }`}>
                              {String(idx + 1).padStart(2, '0')}
                            </div>
                            <div className="text-xs text-gray-500 leading-tight">
                              {preset.wordCount}개
                            </div>
                            <div className={`text-xs mt-1.5 font-medium ${
                              isAdded ? 'text-green-500' : isLoading ? 'text-purple-500' : 'text-purple-600'
                            }`}>
                              {isAdded ? '추가됨 ✓' : isLoading ? '추가 중...' : '+ 추가'}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* 단어장 목록 */}
      {data.wordBooks.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-6xl mb-4">📖</div>
          <p className="text-lg font-medium">아직 단어장이 없어요</p>
          <p className="text-sm mt-1">새 단어장을 추가해보세요!</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {data.wordBooks.map((wb) => {
            const lastTest = getLastTest(wb.id);
            const isDragging = draggedId === wb.id;
            const isDragOver = dragOverId === wb.id;
            return (
              <div
                key={wb.id}
                draggable
                onDragStart={() => handleDragStart(wb.id)}
                onDragOver={(e) => handleDragOver(e, wb.id)}
                onDrop={() => handleDrop(wb.id)}
                onDragEnd={handleDragEnd}
                className={`bg-white rounded-xl border p-5 shadow-sm transition-all ${
                  isDragging
                    ? 'opacity-40 shadow-none'
                    : isDragOver
                    ? 'border-blue-400 shadow-md scale-[1.01]'
                    : 'border-gray-200 hover:shadow-md'
                }`}
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span
                      className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing text-lg select-none flex-shrink-0"
                      title="드래그하여 순서 변경"
                    >
                      ⠿
                    </span>
                    {editingNameId === wb.id ? (
                      <input
                        autoFocus
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEditName(wb.id);
                          if (e.key === 'Escape') setEditingNameId(null);
                        }}
                        onBlur={() => saveEditName(wb.id)}
                        className="flex-1 min-w-0 text-xl font-semibold text-gray-900 border-b-2 border-blue-500 outline-none bg-transparent"
                      />
                    ) : (
                      <h2
                        className={`text-xl font-semibold text-gray-900 leading-tight truncate transition-colors ${
                          wb.isPreset ? '' : 'cursor-pointer hover:text-blue-600'
                        }`}
                        title={wb.isPreset ? undefined : '클릭하여 이름 수정'}
                        onClick={() => !wb.isPreset && startEditName(wb)}
                      >
                        {wb.isPreset && (
                          <span className="inline-flex items-center text-xs font-bold text-purple-600 bg-purple-100 rounded-full px-1.5 py-0.5 mr-1.5 align-middle" title="AI가 만든 단어장">
                            AI
                          </span>
                        )}
                        {wb.name}
                      </h2>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      if (confirm(`"${wb.name}" 단어장을 삭제할까요?`)) {
                        dispatch({ type: 'DELETE_WORDBOOK', id: wb.id });
                      }
                    }}
                    className="text-gray-300 hover:text-red-400 text-2xl leading-none ml-2 transition-colors flex-shrink-0"
                    title="삭제"
                  >
                    ×
                  </button>
                </div>
                <div className="text-sm text-gray-500 mb-3">
                  단어 {wb.words.length}개 · {formatDate(wb.createdAt)} 생성
                </div>

                {lastTest && (
                  <div className="text-xs bg-blue-50 text-blue-600 rounded-lg px-3 py-1.5 mb-3 inline-block">
                    최근 테스트: {lastTest.score}/{lastTest.total}점 ({formatDate(lastTest.date)})
                  </div>
                )}

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => router.push(`/wordbooks/${wb.id}`)}
                    className="flex-1 border border-gray-300 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 font-medium"
                  >
                    단어 관리
                  </button>
                  <button
                    onClick={() => {
                      if (wb.words.length === 0) {
                        alert('단어장에 단어가 없어요.\n먼저 단어를 추가해주세요.');
                        return;
                      }
                      router.push(`/quiz/${wb.id}`);
                    }}
                    className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700 font-medium"
                  >
                    테스트 시작
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
