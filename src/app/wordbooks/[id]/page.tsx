'use client';

import { useState, useRef, useEffect } from 'react';
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingIndex, setPlayingIndex] = useState<number>(-1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const wordRefs = useRef<(HTMLDivElement | null)[]>([]);
  const playingRef = useRef(false);
  const koVoiceRef = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    function pickKoVoice() {
      const voices = window.speechSynthesis.getVoices();
      const koVoices = voices.filter((v) => v.lang.startsWith('ko'));
      // 선호 순서: Google > Microsoft > 기타, 그 안에서 여성 음성 우선
      const priority = ['Google', 'Microsoft'];
      for (const brand of priority) {
        const match = koVoices.find((v) => v.name.includes(brand));
        if (match) { koVoiceRef.current = match; return; }
      }
      if (koVoices.length > 0) koVoiceRef.current = koVoices[0];
    }
    pickKoVoice();
    // Chrome은 voiceschanged 이후에 목록이 채워짐
    window.speechSynthesis.addEventListener('voiceschanged', pickKoVoice);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', pickKoVoice);
  }, []);

  useEffect(() => {
    if (playingIndex >= 0 && wordRefs.current[playingIndex]) {
      wordRefs.current[playingIndex]!.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [playingIndex]);

  const wordBook = data.wordBooks.find((wb) => wb.id === id);

  function speak(text: string) {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'en-US';
    utter.rate = 0.9;
    window.speechSynthesis.speak(utter);
  }

  function stopPlayAll() {
    playingRef.current = false;
    setIsPlaying(false);
    setPlayingIndex(-1);
    window.speechSynthesis?.cancel();
  }

  function playAll(withExample = false) {
    if (!wordBook || wordBook.words.length === 0) return;
    if (isPlaying) { stopPlayAll(); return; }

    playingRef.current = true;
    setIsPlaying(true);

    const words = wordBook.words;

    function playWord(index: number) {
      if (!playingRef.current || index >= words.length) {
        playingRef.current = false;
        setIsPlaying(false);
        setPlayingIndex(-1);
        return;
      }

      setPlayingIndex(index);
      const word = words[index];

      const enUtter = new SpeechSynthesisUtterance(word.en);
      enUtter.lang = 'en-US';
      enUtter.rate = 0.85;

      const koUtter = new SpeechSynthesisUtterance(word.ko.replace(/~/g, '무엇무엇'));
      koUtter.lang = 'ko-KR';
      koUtter.rate = 0.9;
      if (koVoiceRef.current) koUtter.voice = koVoiceRef.current;

      const goNext = () => {
        if (!playingRef.current) return;
        setTimeout(() => playWord(index + 1), 500);
      };

      if (withExample && word.example) {
        const exUtter = new SpeechSynthesisUtterance(word.example);
        exUtter.lang = 'en-US';
        exUtter.rate = 0.85;
        exUtter.onend = goNext;

        koUtter.onend = () => {
          if (!playingRef.current) return;
          setTimeout(() => window.speechSynthesis.speak(exUtter), 300);
        };
      } else {
        koUtter.onend = goNext;
      }

      enUtter.onend = () => {
        if (!playingRef.current) return;
        setTimeout(() => window.speechSynthesis.speak(koUtter), 300);
      };

      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(enUtter);
    }

    playWord(0);
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
    if (wordBook && wordBook.words.length >= 100) {
      alert('단어장에는 최대 100개까지만 추가할 수 있어요.');
      return;
    }
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
        const currentCount = wordBook?.words.length ?? 0;
        const remaining = 100 - currentCount;
        if (remaining <= 0) {
          alert('단어장이 이미 100개로 가득 찼어요.');
          return;
        }
        const toImport = words.slice(0, remaining);
        dispatch({ type: 'IMPORT_WORDS', wordBookId: id, words: toImport });
        if (toImport.length < words.length) {
          alert(`100개 제한으로 ${toImport.length}개만 가져왔습니다. (${words.length - toImport.length}개 초과)`);
        } else {
          alert(`${toImport.length}개 단어를 가져왔습니다!`);
        }
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
        {!wordBook.isPreset && (
          <button
            onClick={() => { setShowAddForm(!showAddForm); setAddForm(emptyForm); }}
            className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 font-medium"
          >
            {showAddForm ? '− 닫기' : '+ 단어 추가'}
          </button>
        )}
        <button
          onClick={exportJSON}
          disabled={wordBook.words.length === 0}
          className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
        >
          JSON 내보내기
        </button>
        {!wordBook.isPreset && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 font-medium"
          >
            JSON 가져오기
          </button>
        )}
        <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={importJSON} />
        <button
          onClick={() => playAll(false)}
          disabled={wordBook.words.length === 0}
          className={`border px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors ${
            isPlaying
              ? 'border-red-300 text-red-600 bg-red-50 hover:bg-red-100'
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          {isPlaying ? '⏹ 중지' : '▶ 전체 듣기'}
        </button>
        {!isPlaying && (
          <button
            onClick={() => playAll(true)}
            disabled={wordBook.words.length === 0}
            className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ▶ 예문 포함 듣기
          </button>
        )}
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
        <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-gray-200 px-6">
          <div className="text-4xl mb-3">✏️</div>
          <p className="mb-4">단어가 없어요. 단어를 추가하거나 JSON을 가져오세요.</p>
          <div className="text-left max-w-xs mx-auto bg-gray-50 rounded-lg p-3 text-xs text-gray-500 border border-gray-200">
            <div className="flex items-center justify-between mb-1.5">
              <p className="font-medium text-gray-600">JSON 형식 예시</p>
              <button
                type="button"
                onClick={() => {
                  const example = JSON.stringify([
                    { en: 'apple', ko: '사과', example: 'I ate an apple.', mnemonic: '애플 로고를 떠올려보세요.' },
                    { en: 'identify', ko: '확인하다', example: 'Identify the problem.', mnemonic: 'ID로 확인!' },
                    { en: 'sustain', ko: '유지하다', example: 'Sustain your effort.', mnemonic: 'sus(아래서) + tain(잡다) = 아래서 받쳐 유지하다' },
                  ], null, 2);
                  const blob = new Blob([example], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'wordbook-example.json';
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="text-blue-500 hover:text-blue-700 hover:underline"
              >
                샘플 다운로드
              </button>
            </div>
            <pre className="whitespace-pre-wrap leading-relaxed">{`[
  {
    "en": "identify",
    "ko": "확인하다",
    "example": "Identify the problem.",
    "mnemonic": "ID로 확인!"
  }
]`}</pre>
            <p className="mt-1.5 text-gray-400">en, ko 필수 / example, mnemonic 선택</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {wordBook.words.map((word, idx) => {
            const stat = data.wordStats[word.id];
            const isEditing = editingWordId === word.id;
            const total = stat ? stat.correct + stat.wrong : 0;
            const isWeak = total >= 2 && stat.correct / total < 0.5;
            const isCurrentlyPlaying = playingIndex === idx;
            return (
              <div
                key={word.id}
                ref={(el) => { wordRefs.current[idx] = el; }}
                className={`border rounded-xl p-4 shadow-sm transition-colors ${
                  isCurrentlyPlaying
                    ? 'bg-blue-50 border-blue-300'
                    : isWeak
                    ? 'bg-red-50 border-red-200'
                    : 'bg-white border-gray-200'
                }`}
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
                      {!wordBook.isPreset && (
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
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {(wordBook.words.some((w) => data.wordStats[w.id]) ||
        (wordBook.isPreset && data.conqueredPresets.includes(wordBook.name))) && (
        <div className="mt-8 pt-6 border-t border-gray-200 flex flex-col items-center gap-3">
          {wordBook.words.some((w) => data.wordStats[w.id]) && (
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
          )}
          {wordBook.isPreset && data.conqueredPresets.includes(wordBook.name) && (
            <button
              onClick={() => {
                if (confirm('이 단어장의 정복 기록을 초기화할까요?')) {
                  dispatch({ type: 'RESET_CONQUERED_PRESET', name: wordBook.name });
                }
              }}
              className="text-sm text-gray-400 hover:text-red-400 transition-colors"
            >
              👑 정복 초기화
            </button>
          )}
        </div>
      )}
    </div>
  );
}
