'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/contexts/AppContext';
import { formatDate } from '@/lib/utils';

export default function HomePage() {
  const { data, dispatch } = useApp();
  const router = useRouter();
  const [newBookName, setNewBookName] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

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
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 font-medium"
          >
            + 새 단어장 추가
          </button>
        )}
      </div>

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
                        className="text-xl font-semibold text-gray-900 leading-tight truncate cursor-pointer hover:text-blue-600 transition-colors"
                        title="클릭하여 이름 수정"
                        onClick={() => startEditName(wb)}
                      >
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
