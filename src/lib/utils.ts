export function checkAnswer(input: string, koMeaning: string): boolean {
  const normalize = (s: string) => s.trim().replace(/[\s\p{P}\p{S}]/gu, '').toLowerCase();
  const trimmed = normalize(input);
  if (!trimmed) return false;
  // 괄호 안의 쉼표는 구분자로 사용하지 않음
  const splitMeanings = (s: string): string[] => {
    const results: string[] = [];
    let depth = 0;
    let current = '';
    for (const char of s) {
      if (char === '(') depth++;
      else if (char === ')') depth--;
      else if (char === ',' && depth === 0) {
        if (current.trim()) results.push(current.trim());
        current = '';
        continue;
      }
      current += char;
    }
    if (current.trim()) results.push(current.trim());
    return results;
  };
  const meanings = splitMeanings(koMeaning);
  return meanings.some((m) => {
    if (normalize(m) === trimmed) return true;
    // 괄호 안 내용을 제거한 버전과도 비교
    const withoutParens = normalize(m.replace(/\([^)]*\)/g, ''));
    return withoutParens === trimmed;
  });
}

export function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
