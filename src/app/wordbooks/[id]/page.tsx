'use client';

import { useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useApp } from '@/contexts/AppContext';
import type { Word } from '@/lib/types';

interface WordFormData {
  en: string;
  ko: string;
  example: string;
  mnemonic: string;
}

const emptyForm: WordFormData = { en: '', ko: '', example: '', mnemonic: '' };

export default function WordBookPage() {
  const { id } = useParams<{ id: string }>();
  const { data, dispatch } = useApp();
  const router = useRouter();

  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<WordFormData>(emptyForm);
  const [editingWordId, setEditingWordId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<WordFormData>(emptyForm);
  const [showStats, setShowStats] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const wordBook = data.wordBooks.find((wb) => wb.id === id);

  function speak(text: string) {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'en-US';
    utter.rate = 0.9;
    window.speechSynthesis.speak(utter);
  }

  if (!wordBook) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center text-gray-500">
        <p className="text-5xl mb-4">😕</p>
        <p className="text-lg">단어장을 찾을 수 없어요.</p>
        <button onClick={() => router.push('/')} className="mt-4 text-blue-600 hover:underline">
          홈으로 돌아가기
        </button>
      </div>
    );
  }

  function addWord() {
    const en = addForm.en.trim();
    const ko = addForm.ko.trim();
    if (!en || !ko) return;
    dispatch({
      type: 'ADD_WORD',
      wordBookId: id,
      word: { en, ko, example: addForm.example.trim() || undefined, mnemonic: addForm.mnemonic.trim() || undefined },
    });
    setAddForm(emptyForm);
    setShowAddForm(false);
  }

  function startEdit(word: Word) {
    setEditingWordId(word.id);
    setEditForm({ en: word.en, ko: word.ko, example: word.example ?? '', mnemonic: word.mnemonic ?? '' });
  }

  function saveEdit(wordId: string) {
    const en = editForm.en.trim();
    const ko = editForm.ko.trim();
    if (!en || !ko) return;
    dispatch({
      type: 'UPDATE_WORD',
      wordBookId: id,
      word: { id: wordId, en, ko, example: editForm.example.trim() || undefined, mnemonic: editForm.mnemonic.trim() || undefined },
    });
    setEditingWordId(null);
  }

  function deleteWord(wordId: string, en: string) {
    if (confirm(`"${en}" 단어를 삭제할까요?`)) {
      dispatch({ type: 'DELETE_WORD', wordBookId: id, wordId });
    }
  }

  function exportJSON() {
    if (!wordBook) return;
    const exportData = wordBook.words.map(({ en, ko, example, mnemonic }) => ({
      en,
      ko,
      ...(example ? { example } : {}),
      ...(mnemonic ? { mnemonic } : {}),
    }));
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${wordBook.name}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importJSON(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (!Array.isArray(parsed)) throw new Error('배열 형식이 아닙니다');
        const words: Omit<Word, 'id'>[] = parsed
          .filter((item) => item.en && item.ko)
          .map((item) => ({
            en: String(item.en).trim(),
            ko: String(item.ko).trim(),
            example: item.example ? String(item.example).trim() : undefined,
            mnemonic: item.mnemonic ? String(item.mnemonic).trim() : undefined,
          }));
        if (words.length === 0) throw new Error('유효한 단어가 없습니다');
        dispatch({ type: 'IMPORT_WORDS', wordBookId: id, words });
        alert(`${words.length}개 단어를 가져왔습니다!`);
      } catch (err) {
        alert(`가져오기 실패: ${err instanceof Error ? err.message : '잘못된 형식'}`);
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  }

  // 취약 단어: 2회 이상 테스트, 정답률 50% 미만
  const weakWords = wordBook.words.filter((w) => {
    const stat = data.wordStats[w.id];
    if (!stat) return false;
    const total = stat.correct + stat.wrong;
    return total >= 2 && stat.correct / total < 0.5;
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push('/')}
          className="text-gray-400 hover:text-gray-700 text-2xl leading-none"
          title="뒤로"
        >
          ←
        </button>
        <h1 className="text-2xl font-bold text-gray-900 flex-1">{wordBook.name}</h1>
      </div>

      {/* 툴바 */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => { setShowAddForm(!showAddForm); setAddForm(emptyForm); }}
          className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 font-medium"
        >
          {showAddForm ? '− 닫기' : '+ 단어 추가'}
        </button>
        <button
          onClick={exportJSON}
          disabled={wordBook.words.length === 0}
          className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
        >
          JSON 내보내기
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 font-medium"
        >
          JSON 가져오기
        </button>
        <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={importJSON} />
        {weakWords.length > 0 && (
          <button
            onClick={() => setShowStats(!showStats)}
            className="border border-orange-300 text-orange-600 px-4 py-2 rounded-lg text-sm hover:bg-orange-50 font-medium"
          >
            ⚠️ 취약 단어 {weakWords.length}개
          </button>
        )}
      </div>

      {/* 취약 단어 목록 */}
      {showStats && weakWords.length > 0 && (
        <div className="mb-6 bg-orange-50 border border-orange-200 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-orange-700 mb-3">취약 단어 (정답률 50% 미만)</h2>
          <div className="space-y-2">
            {weakWords.map((w) => {
              const stat = data.wordStats[w.id];
              const total = stat.correct + stat.wrong;
              const rate = Math.round((stat.correct / total) * 100);
              return (
                <div key={w.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-800">{w.en}</span>
                  <span className="text-gray-500">{w.ko}</span>
                  <span className="text-orange-500 font-medium">정답률 {rate}% ({stat.correct}/{total})</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 단어 추가 폼 */}
      {showAddForm && (
        <div className="mb-6 bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800 mb-4">새 단어 추가</h2>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">영어 단어 *</label>
              <input
                type="text"
                value={addForm.en}
                onChange={(e) => setAddForm({ ...addForm, en: e.target.value })}
                placeholder="identify"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">한국어 뜻 * (쉼표로 여러 뜻 구분)</label>
              <input
                type="text"
                value={addForm.ko}
                onChange={(e) => setAddForm({ ...addForm, ko: e.target.value })}
                placeholder="확인하다, 식별하다"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="mb-3">
            <label className="block text-xs text-gray-500 mb-1">예문 (선택)</label>
            <input
              type="text"
              value={addForm.example}
              onChange={(e) => setAddForm({ ...addForm, example: e.target.value })}
              placeholder="Passengers were asked to identify their luggage."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mb-4">
            <label className="block text-xs text-gray-500 mb-1">암기 팁 (선택)</label>
            <input
              type="text"
              value={addForm.mnemonic}
              onChange={(e) => setAddForm({ ...addForm, mnemonic: e.target.value })}
              placeholder="ID 카드를 떠올리세요..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={addWord}
              disabled={!addForm.en.trim() || !addForm.ko.trim()}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm hover:bg-blue-700 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
            >
              추가
            </button>
            <button
              onClick={() => { setShowAddForm(false); setAddForm(emptyForm); }}
              className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* 단어 목록 */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-700">
          단어 목록 <span className="text-gray-400 font-normal">({wordBook.words.length}개)</span>
        </h2>
      </div>

      {wordBook.words.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-gray-200">
          <div className="text-4xl mb-3">✏️</div>
          <p>단어가 없어요. 단어를 추가하거나 JSON을 가져오세요.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {wordBook.words.map((word) => {
            const stat = data.wordStats[word.id];
            const isEditing = editingWordId === word.id;
            const total = stat ? stat.correct + stat.wrong : 0;
            const isWeak = total >= 2 && stat.correct / total < 0.5;
            return (
              <div
                key={word.id}
                className={`border rounded-xl p-4 shadow-sm ${isWeak ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}
              >
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">영어 단어</label>
                        <input
                          type="text"
                          value={editForm.en}
                          onChange={(e) => setEditForm({ ...editForm, en: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">한국어 뜻</label>
                        <input
                          type="text"
                          value={editForm.ko}
                          onChange={(e) => setEditForm({ ...editForm, ko: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">예문</label>
                      <input
                        type="text"
                        value={editForm.example}
                        onChange={(e) => setEditForm({ ...editForm, example: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">암기 팁</label>
                      <input
                        type="text"
                        value={editForm.mnemonic}
                        onChange={(e) => setEditForm({ ...editForm, mnemonic: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveEdit(word.id)}
                          className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-blue-700 font-medium"
                        >
                          저장
                        </button>
                        <button
                          onClick={() => setEditingWordId(null)}
                          className="border border-gray-300 text-gray-600 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-50"
                        >
                          취소
                        </button>
                      </div>
                      {data.wordStats[word.id] && (
                        <button
                          onClick={() => {
                            if (confirm('이 단어의 통계를 초기화할까요?')) {
                              dispatch({ type: 'RESET_WORD_STAT', wordId: word.id });
                            }
                          }}
                          className="text-xs text-gray-400 hover:text-red-400 px-2 py-1.5 transition-colors"
                        >
                          통계 초기화
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-baseline gap-3 flex-wrap">
                          <span className="text-lg font-semibold text-gray-900">{word.en}</span>
                          <button
                            onClick={() => speak(word.en)}
                            className="text-gray-300 hover:text-blue-400 transition-colors text-base leading-none"
                            title="발음 듣기"
                            tabIndex={-1}
                          >
                            🔊
                          </button>
                          <span className="text-gray-600">{word.ko}</span>
                          {stat && (stat.correct > 0 || stat.wrong > 0) && (() => {
                            const total = stat.correct + stat.wrong;
                            const rate = Math.round((stat.correct / total) * 100);
                            return (
                              <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                                <span className="inline-flex items-center gap-0.5 bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full">
                                  ○ {stat.correct}
                                </span>
                                <span className="inline-flex items-center gap-0.5 bg-red-100 text-red-500 px-1.5 py-0.5 rounded-full">
                                  × {stat.wrong}
                                </span>
                                <span className={`px-1.5 py-0.5 rounded-full ${rate >= 50 ? 'bg-blue-50 text-blue-500' : 'bg-orange-50 text-orange-500'}`}>
                                  {rate}%
                                </span>
                              </span>
                            );
                          })()}
                        </div>
                        {word.example && (
                          <p className="text-xs text-gray-400 mt-1 italic">{word.example}</p>
                        )}
                        {word.mnemonic && (
                          <p className="text-xs text-blue-400 mt-0.5">💡 {word.mnemonic}</p>
                        )}
                      </div>
                      <div className="flex gap-1 ml-2">
                        <button
                          onClick={() => startEdit(word)}
                          className="text-gray-400 hover:text-blue-500 px-2 py-1 text-sm transition-colors"
                        >
                          편집
                        </button>
                        <button
                          onClick={() => deleteWord(word.id, word.en)}
                          className="text-gray-400 hover:text-red-400 px-2 py-1 text-sm transition-colors"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {wordBook.words.length > 0 && wordBook.words.some((w) => data.wordStats[w.id]) && (
        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <button
            onClick={() => {
              if (confirm('이 단어장의 모든 통계를 초기화할까요?')) {
                dispatch({ type: 'RESET_WORDBOOK_STATS', wordIds: wordBook.words.map((w) => w.id) });
              }
            }}
            className="text-sm text-gray-400 hover:text-red-400 transition-colors"
          >
            전체 통계 초기화
          </button>
        </div>
      )}
    </div>
  );
}
