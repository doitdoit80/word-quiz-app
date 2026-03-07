export function checkAnswer(input: string, koMeaning: string): boolean {
  const normalize = (s: string) => s.trim().replace(/[\s\p{P}\p{S}]/gu, '').toLowerCase();
  const trimmed = normalize(input);
  if (!trimmed) return false;
  const meanings = koMeaning.split(',').map((m) => m.trim()).filter(Boolean);
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
