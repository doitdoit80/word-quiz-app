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
| **Database** | Turso (libSQL, Edge SQLite) |
| **ORM** | Drizzle ORM |
| **Auth** | JWT (jose) + bcryptjs + Google OAuth 2.0 + nodemailer |
| **Storage** | Server DB (인증 사용자) / LocalStorage (게스트 모드 fallback) |
| **TTS** | Web Speech API (SpeechSynthesis) |

## 3. 프로젝트 구조

```
src/
├── app/
│   ├── layout.tsx                  # 루트 레이아웃 (AuthProvider + AppProvider 래핑)
│   ├── page.tsx                    # 홈 페이지 (단어장 목록 + AI 프리셋)
│   ├── globals.css                 # Tailwind CSS 설정
│   ├── login/
│   │   └── page.tsx                # 로그인 페이지
│   ├── signup/
│   │   └── page.tsx                # 회원가입 페이지
│   ├── profile/
│   │   └── page.tsx                # 회원정보 페이지 (이름 변경, 비밀번호 변경)
│   ├── find-account/
│   │   └── page.tsx                # 아이디 찾기 / 비밀번호 초기화 페이지
│   ├── reset-password/
│   │   └── page.tsx                # 비밀번호 재설정 페이지 (이메일 링크)
│   ├── complete-signup/
│   │   └── page.tsx                # Google OAuth 가입 완료 (핸드폰 입력)
│   ├── admin/
│   │   └── page.tsx                # 관리자 페이지 (사용자/보석 관리)
│   ├── quiz/
│   │   └── [id]/
│   │       └── page.tsx            # 퀴즈 페이지 (동적 라우팅)
│   ├── wordbooks/
│   │   └── [id]/
│   │       └── page.tsx            # 단어장 관리 페이지 (동적 라우팅)
│   └── api/
│       ├── auth/
│       │   ├── signup/route.ts     # 회원가입 API
│       │   ├── login/route.ts      # 로그인 API
│       │   ├── logout/route.ts     # 로그아웃 API
│       │   ├── me/route.ts         # 현재 사용자 조회 API
│       │   ├── update-profile/route.ts  # 이름 변경 API
│       │   ├── change-password/route.ts # 비밀번호 변경 API
│       │   ├── complete-signup/route.ts # Google OAuth 가입 완료 API
│       │   ├── find-email/route.ts    # 아이디 찾기 API
│       │   ├── reset-password/
│       │   │   ├── route.ts           # 비밀번호 초기화 이메일 발송 API
│       │   │   └── verify/route.ts    # 비밀번호 초기화 토큰 검증 + 변경 API
│       │   └── google/
│       │       ├── route.ts        # Google OAuth 시작 (리다이렉트)
│       │       └── callback/route.ts # Google OAuth 콜백
│       ├── wordbooks/
│       │   ├── route.ts            # 단어장 목록 조회(GET) / 생성(POST)
│       │   ├── reorder/route.ts    # 단어장 순서 변경(POST)
│       │   └── [id]/
│       │       ├── route.ts        # 단어장 조회(GET) / 이름변경(PATCH) / 삭제(DELETE)
│       │       └── words/
│       │           ├── route.ts    # 단어 추가(POST)
│       │           └── [wordId]/route.ts # 단어 수정(PATCH) / 삭제(DELETE)
│       ├── stats/route.ts          # 통계 조회(GET) / 업서트(POST) / 삭제(DELETE)
│       ├── test-records/route.ts   # 테스트 기록 조회(GET) / 추가(POST)
│       ├── conquered-presets/route.ts # 정복 프리셋 조회(GET) / 추가(POST) / 삭제(DELETE)
│       ├── sync/route.ts           # 로컬→서버 전체 데이터 동기화(POST)
│       ├── wordbook-slots/
│       │   └── purchase/route.ts   # 단어장 슬롯 구매(POST) - UI 미적용, API만 존재
│       └── admin/
│           └── users/
│               ├── route.ts        # 사용자 목록 조회 API
│               └── [id]/
│                   ├── route.ts    # 사용자 삭제 API
│                   └── gems/route.ts # 보석 관리 API
├── contexts/
│   ├── AppContext.tsx              # 단어장 상태 관리 (useReducer + Context, 서버 동기화)
│   └── AuthContext.tsx             # 인증 상태 관리 (user, login, signup, logout)
├── lib/
│   ├── types.ts                    # TypeScript 타입 정의
│   ├── storage.ts                  # localStorage 유틸리티 + 서버 모드 캐시 (per-user)
│   ├── utils.ts                    # 헬퍼 함수 (정답 체크, 셔플 등)
│   ├── db.ts                       # Turso 클라이언트 + Drizzle 인스턴스
│   ├── db/schema.ts                # Drizzle 스키마 (users, wordbooks, words, word_stats, test_records, conquered_presets)
│   ├── auth.ts                     # JWT sign/verify, 쿠키 관리
│   ├── admin.ts                    # Admin 권한 체크 유틸리티
│   └── email.ts                    # 이메일 발송 유틸리티 (nodemailer)
└── middleware.ts                   # 라우트 보호 (비인증 → /login 리다이렉트)

public/presets/                     # AI가 만든 프리셋 단어장 (75개 JSON)
data/                               # 단어장 JSON 샘플 데이터
drizzle.config.ts                   # Drizzle Kit 설정
```

## 4. 핵심 기능 목록

### 0단계: 인증 및 사용자 관리
- [x] **이메일+비밀번호 로그인/회원가입**
  - bcrypt 비밀번호 해싱 (cost 10)
  - JWT httpOnly 쿠키 세션 (7일 만료)
  - 자동 로그인 체크박스 (체크 시 7일 유지, 미체크 시 세션 쿠키)
  - 이메일 형식 검증, 비밀번호 8자 이상
  - 핸드폰 번호 필수 (010 시작, 11자리)
- [x] **Google OAuth 2.0 로그인**
  - Google 계정으로 로그인/회원가입
  - 신규 가입 시 핸드폰 번호 입력 필수 (/complete-signup)
  - 동일 이메일 기존 계정 자동 연동
- [x] **게스트 모드:** 로그인 없이 앱 사용 가능 (1일 유효, admin 접근 불가)
- [x] **아이디 찾기 / 비밀번호 초기화 (/find-account)**
  - 아이디 찾기: 이름 + 핸드폰 번호로 이메일 조회 (뒤 4자리 마스킹)
  - 비밀번호 초기화: 이메일 + 핸드폰 번호 입력 → 이메일 링크 발송 (5분 유효, 1회용)
  - 초기화 링크 클릭 → /reset-password 페이지에서 새 비밀번호 설정
  - 요청 속도 제한: 동일 계정 5분에 1회만 발송 가능 (남은 시간 안내)
- [x] **회원정보 페이지 (/profile)**
  - 기본 정보 표시 (이메일, 핸드폰, 보석, 계정 유형)
  - 이름 + 핸드폰 번호 변경
  - 비밀번호 변경 (현재 비밀번호 확인 필요)
  - 데이터 동기화: 로컬 데이터 확인 → 서버에 업로드 (기존 서버 데이터 덮어쓰기)
- [x] **보석(Gems) 시스템**
  - 회원가입 시 보석 10개 자동 지급
  - 홈페이지에 💎 보석 개수 표시
- [x] **관리자 시스템 (/admin)**
  - 고정 이메일(`doitdoit80@gmail.com`) 가입 시 자동 admin
  - 사용자 목록 조회 (이름, 이메일, 역할, 보석, 가입일)
  - 보석 추가/차감 (+1, -1 버튼 또는 수량 직접 입력)
  - 사용자 삭제 (자기 자신 삭제 불가)
  - 통계 카드: 총 사용자 수, 총 보석 수
- [x] **Next.js 미들웨어 라우트 보호**
  - 비인증 사용자 → /login 리다이렉트
  - 공개 경로: /login, /signup, /find-account, /reset-password, /complete-signup, /api/auth/*, /presets/*

### 0.5단계: 데이터 저장 및 동기화
- [x] **서버 DB 저장** (인증 사용자)
  - 단어장, 단어, 통계, 테스트 기록, 정복 프리셋 모두 서버 DB에 저장
  - 모든 dispatch 액션이 서버 API에 자동 동기화 (optimistic update 패턴)
  - 동기화 실패 시 화면 상단 토스트 알림 (5초 후 자동 사라짐)
  - 로컬 캐시(Stale-While-Revalidate): 캐시 즉시 표시 → 백그라운드 서버 갱신
  - 캐시 키: `word-quiz-cache-{userId}` (게스트 모드 `word-quiz-app`과 분리)
  - 최초 로그인 시 localStorage에 데이터가 있고 서버가 비어있으면 자동 마이그레이션
- [x] **게스트 모드 fallback** (비인증 사용자)
  - 로그인하지 않은 경우 기존대로 localStorage에 저장
- [x] **수동 데이터 동기화** (/profile)
  - 로컬 데이터 확인 → 미리보기 (단어장 수, 총 단어 수, 테스트 기록 등) → 서버 동기화
  - 서버의 기존 데이터를 완전히 덮어씌움 (확인 다이얼로그)
  - 트랜잭션으로 원자적 처리 (중간 실패 시 롤백)
- [x] **단어장 개수 제한**
  - 기본 10개, 최대 30개까지 확장 가능
  - 홈페이지 버튼에 현재/최대 표시: `+ 내 단어장 추가 (3/10)`
  - 보석으로 슬롯 구매 API 존재 (5보석 = +1슬롯, UI는 추후 적용 예정)

### 1단계: 단어장 관리
- [x] 내 단어장 생성 / 이름 변경 / 삭제
- [x] 단어장 드래그 앤 드롭 순서 변경
- [x] 단어 추가 / 수정 / 삭제 (단어, 뜻, 예문, 암기 팁, 단어장당 최대 100개 제한)
- [x] JSON 파일로 단어장 내보내기/불러오기 (빈 단어장에 JSON 형식 안내 + 샘플 다운로드)
- [x] 개별 단어 발음 재생 (🔊 버튼)
- [x] 전체 단어 순차 재생 (영어 → 한국어, 딜레이 포함, 자동 스크롤, ~를 "무엇무엇"으로 읽기)
- [x] 예문 포함 순차 재생 (영어 단어 → 한국어 뜻 → 영어 예문, 자동 스크롤, ~를 "무엇무엇"으로 읽기)
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

### DB 스키마 (Turso/SQLite)
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'user',          -- 'user' | 'admin'
  gems INTEGER NOT NULL DEFAULT 10,
  wordbook_limit INTEGER NOT NULL DEFAULT 10, -- 단어장 최대 개수 (최대 30)
  password_reset_at TEXT,                     -- 마지막 비밀번호 초기화 요청 시각 (5분 제한)
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE wordbooks (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  is_preset INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE words (
  id TEXT PRIMARY KEY,
  wordbook_id TEXT NOT NULL,
  en TEXT NOT NULL,
  ko TEXT NOT NULL,
  example TEXT,
  mnemonic TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE word_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  word_id TEXT NOT NULL,
  correct INTEGER NOT NULL DEFAULT 0,
  wrong INTEGER NOT NULL DEFAULT 0,
  last_tested TEXT,
  UNIQUE(user_id, word_id)
);

CREATE TABLE test_records (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  wordbook_id TEXT NOT NULL,
  wordbook_name TEXT NOT NULL,
  date TEXT NOT NULL,
  score INTEGER NOT NULL,
  total INTEGER NOT NULL,
  wrong_word_ids TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE conquered_presets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  preset_name TEXT NOT NULL,
  UNIQUE(user_id, preset_name)
);
```

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

AppContext는 듀얼 모드로 동작합니다:
- **인증 사용자**: 서버 API에서 데이터 로드 → dispatch 시 서버에 자동 동기화
- **게스트 모드**: localStorage에서 데이터 로드/저장

| Action | 설명 |
|--------|------|
| LOAD | 서버 API 또는 localStorage에서 데이터 초기 로드 |
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
| RESET_CONQUERED_PRESET | 프리셋 정복 기록 초기화 |

## 7. 인증 플로우

### 이메일+비밀번호
1. `/signup`에서 이름, 이메일, 비밀번호 입력 → 계정 생성 + 보석 10개 지급
2. `/login`에서 이메일, 비밀번호 입력 → JWT 쿠키 발급
3. 자동 로그인 체크 시 7일 유지, 미체크 시 브라우저 닫으면 만료

### Google OAuth
1. 로그인/회원가입 페이지에서 "Google로 로그인" 클릭
2. Google 인증 화면 → 승인
3. 콜백에서 이메일로 기존 계정 확인
   - 있으면 → 기존 계정으로 로그인, JWT 쿠키 설정 후 홈으로 이동
   - 없으면 → `/complete-signup` 페이지로 리다이렉트 (임시 토큰, 10분 유효)
4. 핸드폰 번호 입력 후 가입 완료 → JWT 쿠키 설정 후 홈으로 이동

### 아이디 찾기 / 비밀번호 초기화
1. 로그인 페이지 하단 "아이디 찾기" 또는 "비밀번호 초기화" 클릭
2. **아이디 찾기:** 이름 + 핸드폰 번호 입력 → 마스킹된 이메일 표시 (뒤 4자리 `****`)
3. **비밀번호 초기화:** 이메일 + 핸드폰 번호 입력 → 초기화 이메일 발송 (nodemailer)
4. 이메일의 링크 클릭 → `/reset-password?token=...` 페이지에서 새 비밀번호 설정
5. 리셋 토큰: JWT 기반, 5분 만료, 1회용 (비밀번호 변경 후 재사용 불가)
6. 요청 속도 제한: 동일 계정당 5분에 1회만 가능 (남은 시간 안내)

### 게스트 모드
1. 로그인 페이지에서 "게스트로 시작하기" 클릭
2. 게스트 쿠키 설정 (1일 유효) → 로그인 없이 앱 사용
3. admin 페이지 접근 불가

## 8. 환경 변수

| 변수 | 설명 |
|------|------|
| `TURSO_DATABASE_URL` | Turso DB URL |
| `TURSO_AUTH_TOKEN` | Turso 인증 토큰 |
| `JWT_SECRET` | JWT 서명 비밀키 (32자 이상) |
| `GOOGLE_CLIENT_ID` | Google OAuth 클라이언트 ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth 클라이언트 시크릿 |
| `NEXT_PUBLIC_BASE_URL` | 앱 기본 URL (예: http://localhost:3000) |
| `SMTP_HOST` | SMTP 서버 호스트 (기본: smtp.gmail.com) |
| `SMTP_PORT` | SMTP 서버 포트 (기본: 587) |
| `SMTP_USER` | SMTP 발신 이메일 주소 |
| `SMTP_PASS` | SMTP 비밀번호 (Gmail 앱 비밀번호) |
