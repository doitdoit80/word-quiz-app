# 📚 단어 테스트 애플리케이션 (Word Quiz App)

단어장을 관리하고, 주관식 퀴즈를 통해 영어 단어를 학습할 수 있는 웹 애플리케이션입니다.

## 1. 프로젝트 개요

사용자가 단어장을 만들고, 이를 바탕으로 주관식 퀴즈를 풀 수 있는 가벼운 웹 애플리케이션입니다.
영어 단어의 TTS(음성 합성) 자동 재생, 30초 타이머, 취약 단어 분석 등의 학습 보조 기능을 제공합니다.

## 2. 기술 스택

| 분류 | 기술 |
|------|------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript (Strict Mode) |
| **Styling** | Tailwind CSS v4 |
| **State Management** | React Context API + useReducer |
| **Storage** | LocalStorage (브라우저 저장) |
| **TTS** | Web Speech API (SpeechSynthesis) |

## 3. 프로젝트 구조

```
src/
├── app/
│   ├── layout.tsx                  # 루트 레이아웃 (AppProvider 래핑)
│   ├── page.tsx                    # 홈 페이지 (단어장 목록 + AI 프리셋)
│   ├── globals.css                 # Tailwind CSS 설정
│   ├── quiz/
│   │   └── [id]/
│   │       └── page.tsx            # 퀴즈 페이지 (동적 라우팅)
│   └── wordbooks/
│       └── [id]/
│           └── page.tsx            # 단어장 관리 페이지 (동적 라우팅)
├── contexts/
│   └── AppContext.tsx              # 전역 상태 관리 (useReducer + Context)
└── lib/
    ├── types.ts                    # TypeScript 타입 정의
    ├── storage.ts                  # localStorage 유틸리티
    └── utils.ts                    # 헬퍼 함수 (정답 체크, 셔플 등)

public/presets/                     # AI가 만든 프리셋 단어장 (75개 JSON)
data/                               # 단어장 JSON 샘플 데이터
```

## 4. 핵심 기능 목록

### 1단계: 단어장 관리
- [x] 내 단어장 생성 / 이름 변경 / 삭제
- [x] 단어장 드래그 앤 드롭 순서 변경
- [x] 단어 추가 / 수정 / 삭제 (단어, 뜻, 예문, 암기 팁, 단어장당 최대 100개 제한)
- [x] JSON 파일로 단어장 내보내기/불러오기
- [x] 개별 단어 발음 재생 (🔊 버튼)
- [x] 전체 단어 순차 재생 (영어 → 한국어, 딜레이 포함, 자동 스크롤, ~를 "무엇무엇"으로 읽기)
- [x] AI가 만든 프리셋 단어장 (중등 + 고등 총 3,000단어)
  - 중등 과정: 중1/중2/중3 × 10세트 × 25단어 = 750단어
  - 고등 과정: 고1/고2/고3 × 15세트 × 50단어 = 2,250단어
  - 중등/고등 그룹 분리 UI (📗 중등, 📕 고등)
  - 학년별 수평 스크롤 카루셀 UI
  - AI 단어장은 AI 배지 표시 + 이름 변경 불가 + 단어 편집/삭제 불가
  - 어근(prefix/root/suffix) 중심 암기팁 제공
  - 중복 추가 방지 (추가됨 ✓ 상태 표시)
  - 삭제 후 재추가 가능
  - 테스트 90% 이상 정답 시 👑 정복 표시 (단어장 삭제 후에도 유지)

### 2단계: 테스트 모드
- [x] **주관식 퀴즈:** 영어/한국어를 보고 뜻을 직접 입력
  - 쉼표(,)로 구분된 여러 뜻 중 하나만 입력해도 정답 인정
  - 괄호 안 내용 제거 후에도 매칭 시도
  - 띄어쓰기, 대소문자, 특수문자 유연하게 처리
- [x] **출제 방향 선택:** EN→KO (영어 보고 한국어 입력) 또는 KO→EN (한국어 보고 영어 입력)
  - 방향 설정은 localStorage에 저장되어 유지
- [x] **TTS 자동 재생:** EN→KO 모드에서 문제 출제 시 영어 단어 자동 발음
  - 🔊 버튼으로 다시 듣기 가능
  - 페이지 이탈 시 음성 자동 중단
- [x] **30초 타이머:** 문제당 30초 카운트다운, 시간 초과 시 자동 오답 처리
  - 남은 10초부터 빨간색 프로그레스 바
- [x] **오답 화면:** 정답, 예문, 암기 팁 표시 / 수동으로 다음 문제 이동 (Enter 키 지원)
- [x] **정답 화면:** 자동으로 0.7초 후 다음 문제로 이동
- [x] **결과 화면:** 점수 표시 (이모지 등급), 오답 리뷰, 재시작 가능

### 3단계: 학습 통계
- [x] 단어별 정답/오답 횟수 및 정답률 추적
- [x] 정답률 50% 미만 '취약 단어' 별도 표시 (2회 이상 테스트 시)
- [x] 취약 단어만 모아서 퀴즈 가능
- [x] 최근 테스트 날짜 및 점수 기록 (단어장 카드에 표시)
- [x] 단어별 / 단어장별 통계 초기화

## 5. 데이터 구조

### 단어 JSON 형식
```json
[
  {
    "en": "identify",
    "ko": "(신원을) 확인하다",
    "example": "Passengers were asked to identify their luggage.",
    "mnemonic": "ID 카드를 떠올리세요. '이게 그거 맞네'라고 확인해 주는 것."
  }
]
```

### 내부 타입 정의
```typescript
interface Word {
  id: string;
  en: string;
  ko: string;
  example?: string;
  mnemonic?: string;
}

interface WordBook {
  id: string;
  name: string;
  words: Word[];
  createdAt: string; // ISO 8601
  isPreset?: boolean; // AI가 만든 단어장 여부
}

interface WordStat {
  correct: number;
  wrong: number;
  lastTested?: string;
}

interface TestRecord {
  id: string;
  wordBookId: string;
  wordBookName: string;
  date: string;
  score: number;
  total: number;
  wrongWordIds: string[];
}
```

## 6. 상태 관리 (Actions)

| Action | 설명 |
|--------|------|
| LOAD | localStorage에서 데이터 초기 로드 |
| ADD_WORDBOOK | 단어장 생성 |
| DELETE_WORDBOOK | 단어장 삭제 |
| RENAME_WORDBOOK | 단어장 이름 변경 |
| REORDER_WORDBOOKS | 단어장 순서 변경 |
| ADD_WORD | 단어 추가 |
| UPDATE_WORD | 단어 수정 |
| DELETE_WORD | 단어 삭제 |
| IMPORT_WORDS | JSON 파일에서 단어 일괄 추가 |
| UPDATE_STATS | 단어별 통계 업데이트 |
| RESET_WORD_STAT | 개별 단어 통계 초기화 |
| RESET_WORDBOOK_STATS | 단어장 전체 통계 초기화 |
| RECORD_TEST | 테스트 결과 기록 + 통계 업데이트 (프리셋 90%↑ 시 정복 기록) |
| ADD_WORDBOOK_WITH_WORDS | AI 프리셋 단어장 추가 (단어 포함) |
