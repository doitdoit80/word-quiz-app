'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useApp } from '@/contexts/AppContext';
import type { Word } from '@/lib/types';
import { checkAnswer, shuffle } from '@/lib/utils';

type Phase = 'select' | 'question' | 'correct' | 'wrong' | 'result';
type Direction = 'en-to-ko' | 'ko-to-en';

interface QuizResult {
  word: Word;
  isCorrect: boolean;
  userAnswer: string;
}

export default function QuizPage() {
  const { id } = useParams<{ id: string }>();
  const { data, dispatch } = useApp();
  const router = useRouter();

  const wordBook = data.wordBooks.find((wb) => wb.id === id);

  const [words, setWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('select');
  const [isWeakMode, setIsWeakMode] = useState(false);
  const [direction, setDirection] = useState<Direction>(() => {
    if (typeof window === 'undefined') return 'en-to-ko';
    return (localStorage.getItem(`quiz-direction-${id}`) as Direction) ?? 'en-to-ko';
  });

  function changeDirection(dir: Direction) {
    setDirection(dir);
    localStorage.setItem(`quiz-direction-${id}`, dir);
  }
  const [userAnswer, setUserAnswer] = useState('');
  const [results, setResults] = useState<QuizResult[]>([]);
  const [timeLeft, setTimeLeft] = useState(30);

  const inputRef = useRef<HTMLInputElement>(null);
  const nextBtnRef = useRef<HTMLButtonElement>(null);

  function speak(text: string) {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'en-US';
    utter.rate = 0.9;
    window.speechSynthesis.speak(utter);
  }

  useEffect(() => {
    return () => { window.speechSynthesis?.cancel(); };
  }, []);

  function startQuiz(weak: boolean, dir: Direction) {
    if (!wordBook) return;
    const pool = weak
      ? wordBook.words.filter((w) => {
          const stat = data.wordStats[w.id];
          if (!stat) return false;
          const total = stat.correct + stat.wrong;
          return total >= 2 && stat.correct / total < 0.5;
        })
      : wordBook.words;
    setIsWeakMode(weak);
    setDirection(dir);
    setWords(shuffle(pool));
    setCurrentIndex(0);
    setUserAnswer('');
    setResults([]);
    setPhase('question');
  }

  const goNext = useCallback(() => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= words.length) {
      setPhase('result');
      const statsMap: Record<string, { correct: number; wrong: number }> = {};
      for (const r of results) {
        statsMap[r.word.id] = statsMap[r.word.id] ?? { correct: 0, wrong: 0 };
        if (r.isCorrect) statsMap[r.word.id].correct++;
        else statsMap[r.word.id].wrong++;
      }
      const correct = results.filter((r) => r.isCorrect).length;
      dispatch({
        type: 'RECORD_TEST',
        record: {
          wordBookId: id,
          wordBookName: wordBook?.name ?? '',
          date: new Date().toISOString(),
          score: correct,
          total: results.length,
          wrongWordIds: results.filter((r) => !r.isCorrect).map((r) => r.word.id),
        },
        stats: statsMap,
      });
    } else {
      setCurrentIndex(nextIndex);
      setUserAnswer('');
      setPhase('question');
    }
  }, [currentIndex, words.length, results, id, wordBook, dispatch]);

  // 포커스 관리
  useEffect(() => {
    if (phase === 'question') {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else if (phase === 'wrong') {
      setTimeout(() => nextBtnRef.current?.focus(), 100);
    }
  }, [phase, currentIndex]);

  // 30초 카운트다운 타이머
  useEffect(() => {
    if (phase !== 'question') return;
    setTimeLeft(30);
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, currentIndex]);

  // 시간 초과 처리
  useEffect(() => {
    if (phase === 'question' && timeLeft === 0) {
      submitAnswer('');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  // 단어 음성 재생 (영어→한글 모드에서만)
  useEffect(() => {
    if (phase === 'question' && words.length > 0 && direction === 'en-to-ko') {
      speak(words[currentIndex].en);
    }
  }, [currentIndex, phase, words, direction]);

  // 오답 시 예문 자동 재생
  useEffect(() => {
    if (phase === 'wrong' && words.length > 0) {
      const example = words[currentIndex].example;
      if (example) setTimeout(() => speak(example), 400);
    }
  }, [phase, currentIndex, words]);

  // 정답 화면 자동 진행
  useEffect(() => {
    if (phase !== 'correct') return;
    const timer = setTimeout(goNext, 700);
    return () => clearTimeout(timer);
  }, [phase, goNext]);

  function submitAnswer(answer?: string) {
    const ans = answer ?? userAnswer;
    if (!ans.trim() && answer === undefined) return;
    const word = words[currentIndex];
    const correct = ans.trim()
      ? direction === 'en-to-ko'
        ? checkAnswer(ans, word.ko)
        : checkAnswer(ans, word.en)
      : false;
    const result: QuizResult = { word, isCorrect: correct, userAnswer: ans };
    setResults((prev) => [...prev, result]);
    setPhase(correct ? 'correct' : 'wrong');
  }

  if (!wordBook) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center text-gray-500">
        <p className="text-5xl mb-4">😕</p>
        <p>단어장을 찾을 수 없어요.</p>
        <button onClick={() => router.push('/')} className="mt-4 text-blue-600 hover:underline">
          홈으로
        </button>
      </div>
    );
  }

  // 모드 선택 화면
  if (phase === 'select') {
    const weakWords = wordBook.words.filter((w) => {
      const stat = data.wordStats[w.id];
      if (!stat) return false;
      const total = stat.correct + stat.wrong;
      return total >= 2 && stat.correct / total < 0.5;
    });

    return (
      <div className="max-w-xl mx-auto px-4 py-12">
        <button
          onClick={() => router.push('/')}
          className="text-gray-400 hover:text-gray-700 text-2xl leading-none mb-8 block"
          title="뒤로"
        >
          ←
        </button>

        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold text-gray-900">{wordBook.name}</h1>
          <p className="text-gray-400 mt-1 text-sm">테스트 방식을 선택하세요</p>
        </div>

        {/* 방향 선택 */}
        <div className="mb-5">
          <p className="text-xs text-gray-400 mb-2 font-medium text-center">문제 방향</p>
          <div className="flex rounded-xl border border-gray-200 overflow-hidden">
            <button
              onClick={() => changeDirection('en-to-ko')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                direction === 'en-to-ko'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              영어 → 한글
            </button>
            <button
              onClick={() => changeDirection('ko-to-en')}
              className={`flex-1 py-3 text-sm font-medium transition-colors border-l border-gray-200 ${
                direction === 'ko-to-en'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              한글 → 영어
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => startQuiz(false, direction)}
            className="w-full bg-blue-600 text-white rounded-2xl p-5 hover:bg-blue-700 text-left transition-colors"
          >
            <div className="font-semibold text-lg mb-0.5">모든 단어 테스트</div>
            <div className="text-blue-200 text-sm">전체 {wordBook.words.length}개 단어</div>
          </button>

          <button
            onClick={() => weakWords.length > 0 && startQuiz(true, direction)}
            disabled={weakWords.length === 0}
            className="w-full bg-white border-2 border-orange-300 text-left rounded-2xl p-5 hover:bg-orange-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <div className="font-semibold text-lg text-orange-600 mb-0.5">취약 단어 테스트</div>
            {weakWords.length > 0 ? (
              <div className="text-orange-400 text-sm">{weakWords.length}개 단어 (오답률 50% 이상)</div>
            ) : (
              <div className="text-gray-400 text-sm">취약 단어 없음 — 2회 이상 테스트 후 오답률이 높은 단어가 표시돼요</div>
            )}
          </button>
        </div>
      </div>
    );
  }

  // 결과 화면
  if (phase === 'result') {
    const correctCount = results.filter((r) => r.isCorrect).length;
    const wrongResults = results.filter((r) => !r.isCorrect);
    const score = Math.round((correctCount / results.length) * 100);

    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">
            {score >= 90 ? '🏆' : score >= 70 ? '🎉' : score >= 50 ? '💪' : '📚'}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">테스트 완료!</h1>
          <div className="flex justify-center gap-2 mt-1">
            {isWeakMode && (
              <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">취약 단어 모드</span>
            )}
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
              {direction === 'en-to-ko' ? '영어 → 한글' : '한글 → 영어'}
            </span>
          </div>
          <div className="text-4xl font-bold text-blue-600 mb-1 mt-2">
            {correctCount} / {results.length}
          </div>
          <p className="text-gray-500">정답률 {score}%</p>
        </div>

        {wrongResults.length > 0 && (
          <div className="mb-8">
            <h2 className="text-base font-semibold text-gray-700 mb-3">
              오답 노트 ({wrongResults.length}개)
            </h2>
            <div className="space-y-3">
              {wrongResults.map((r, i) => (
                <div key={i} className="bg-red-50 border border-red-100 rounded-xl p-4">
                  <div className="flex items-baseline gap-3 mb-2 flex-wrap">
                    <span className="text-lg font-semibold text-gray-900">
                      {direction === 'en-to-ko' ? r.word.en : r.word.ko}
                    </span>
                    <span className="text-red-500 line-through text-sm">{r.userAnswer || '(시간 초과)'}</span>
                    <span className="text-green-600 font-medium text-sm">
                      → {direction === 'en-to-ko' ? r.word.ko : r.word.en}
                    </span>
                  </div>
                  {r.word.example && (
                    <p className="text-xs text-gray-500 italic mb-1">{r.word.example}</p>
                  )}
                  {r.word.mnemonic && (
                    <p className="text-xs text-blue-500">💡 {r.word.mnemonic}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {wrongResults.length === 0 && (
          <div className="text-center text-green-600 bg-green-50 rounded-xl p-4 mb-8 font-medium">
            🎊 모든 단어를 맞혔어요!
          </div>
        )}

        <div className="flex gap-3 justify-center">
          <button
            onClick={() => setPhase('select')}
            className="border border-gray-300 text-gray-700 px-6 py-2.5 rounded-lg hover:bg-gray-50 font-medium"
          >
            다시 테스트
          </button>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 font-medium"
          >
            홈으로
          </button>
        </div>
      </div>
    );
  }

  const word = words[currentIndex];
  const progress = (currentIndex / words.length) * 100;

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      {/* 진행 표시 */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-500 mb-1.5">
          <span className="flex items-center gap-1.5">
            {wordBook.name}
            {isWeakMode && (
              <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">취약 단어</span>
            )}
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
              {direction === 'en-to-ko' ? 'EN→KO' : 'KO→EN'}
            </span>
          </span>
          <span>{currentIndex + 1} / {words.length}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 질문 카드 */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 mb-4">
        <div className="text-center mb-8">
          <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide">
            {direction === 'en-to-ko' ? '영어 단어' : '한국어 뜻'}
          </p>
          <div className="flex items-center justify-center gap-3">
            <h2 className="text-4xl font-bold text-gray-900">
              {direction === 'en-to-ko' ? word.en : word.ko}
            </h2>
            {direction === 'en-to-ko' && (
              <button
                onClick={() => speak(word.en)}
                className="text-gray-300 hover:text-blue-400 transition-colors text-2xl"
                title="다시 듣기"
                tabIndex={-1}
              >
                🔊
              </button>
            )}
          </div>
        </div>

        {/* 정답 화면 */}
        {phase === 'correct' && (
          <div className="text-center py-4">
            <div className="text-3xl mb-2">✅</div>
            <p className="text-lg font-semibold text-green-600">정답!</p>
            <p className="text-gray-500 mt-1">
              {direction === 'en-to-ko' ? word.ko : word.en}
            </p>
          </div>
        )}

        {/* 오답 화면 */}
        {phase === 'wrong' && (
          <div>
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-red-500 font-medium text-sm">내 답:</span>
                <span className="text-red-400 line-through">{results[results.length - 1]?.userAnswer || '(시간 초과)'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600 font-medium text-sm">정답:</span>
                <span className="text-gray-800 font-semibold text-lg">
                  {direction === 'en-to-ko' ? word.ko : word.en}
                </span>
              </div>
            </div>

            {word.example && (
              <div className="bg-gray-50 rounded-xl p-4 mb-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-400 font-medium">예문</p>
                  <button
                    onClick={() => speak(word.example!)}
                    className="text-gray-300 hover:text-blue-400 transition-colors text-lg leading-none"
                    title="예문 듣기"
                    tabIndex={-1}
                  >
                    🔊
                  </button>
                </div>
                <p className="text-base text-gray-700 italic">{word.example}</p>
              </div>
            )}

            {word.mnemonic && (
              <div className="bg-blue-50 rounded-xl p-4 mb-4">
                <p className="text-xs text-blue-400 mb-2 font-medium">암기 팁 💡</p>
                <p className="text-base text-blue-700">{word.mnemonic}</p>
              </div>
            )}

            <button
              ref={nextBtnRef}
              onClick={goNext}
              className="w-full bg-gray-800 text-white py-3 rounded-xl hover:bg-gray-700 font-medium text-base"
            >
              다음 (Enter)
            </button>
          </div>
        )}

        {/* 질문 입력 */}
        {phase === 'question' && (
          <div>
            {/* 타이머 */}
            <div className="mb-4">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">
                  {direction === 'en-to-ko' ? '한국어 뜻을 입력하세요' : '영어 단어를 입력하세요'}
                </span>
                <span className={`font-semibold tabular-nums ${timeLeft <= 10 ? 'text-red-500' : 'text-gray-400'}`}>
                  {timeLeft}초
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all duration-1000 ${timeLeft <= 10 ? 'bg-red-400' : 'bg-blue-400'}`}
                  style={{ width: `${(timeLeft / 30) * 100}%` }}
                />
              </div>
            </div>
            <input
              ref={inputRef}
              type="text"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submitAnswer(); }}
              placeholder={direction === 'en-to-ko' ? '뜻 입력...' : '영어 입력...'}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-center text-lg focus:outline-none focus:border-blue-400"
            />
            <button
              onClick={() => submitAnswer()}
              disabled={!userAnswer.trim()}
              className="w-full mt-3 bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 font-medium text-base disabled:opacity-40 disabled:cursor-not-allowed"
            >
              확인 (Enter)
            </button>
          </div>
        )}
      </div>

      {(phase === 'question' || phase === 'wrong') && (
        <button
          onClick={() => {
            if (confirm('테스트를 중단하고 나가시겠어요?')) {
              if (results.length > 0) {
                const statsMap: Record<string, { correct: number; wrong: number }> = {};
                for (const r of results) {
                  statsMap[r.word.id] = statsMap[r.word.id] ?? { correct: 0, wrong: 0 };
                  if (r.isCorrect) statsMap[r.word.id].correct++;
                  else statsMap[r.word.id].wrong++;
                }
                dispatch({ type: 'UPDATE_STATS', stats: statsMap });
              }
              setPhase('select');
            }
          }}
          className="w-full text-gray-400 text-sm hover:text-gray-600 py-2"
        >
          테스트 중단
        </button>
      )}
    </div>
  );
}
