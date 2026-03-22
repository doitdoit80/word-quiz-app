# Word Quiz App

영어 단어장을 관리하고 주관식 퀴즈로 학습할 수 있는 웹 애플리케이션입니다.

## 주요 기능

- **인증 시스템** - 이메일+비밀번호 로그인, Google OAuth 연동 (신규 시 핸드폰 필수), 게스트 모드, 자동 로그인
- **계정 찾기** - 아이디 찾기 (이름+핸드폰), 비밀번호 초기화 (이메일 링크, 5분 유효, 1회용, 5분 요청 제한)
- **회원정보 관리** - 이름/핸드폰 변경, 비밀번호 변경, 데이터 동기화
- **보석(Gems) 시스템** - 가입 시 10개 지급, 관리자 페이지에서 관리
- **관리자 페이지** - 사용자 목록, 보석 관리, 사용자 삭제
- **서버 데이터 저장** - 인증 사용자는 서버 DB에 저장 + 로컬 캐시(SWR)로 즉시 로딩, 게스트는 localStorage fallback
- **데이터 동기화** - 최초 로그인 시 자동 마이그레이션, 프로필 페이지에서 수동 동기화 (트랜잭션 보장), 실패 시 토스트 알림
- **단어장 관리** - 생성, 수정, 삭제, 드래그 앤 드롭 정렬, JSON 가져오기/내보내기 (샘플 다운로드 제공, 기본 10개/최대 30개 제한)
- **AI가 만든 단어장** - 중등~고등 필수 영단어 3,000개 (중1~중3 × 10세트 + 고1~고3 × 15세트), AI 배지 표시, 90%↑ 정복 시스템, 어근 중심 암기팁
- **주관식 퀴즈** - EN→KO / KO→EN 방향 선택, 유연한 정답 매칭
- **TTS 음성 재생** - 단어 자동 발음, 전체 순차 재생 (영어→한국어), 예문 포함 재생
- **30초 타이머** - 문제당 카운트다운, 시간 초과 시 자동 오답 처리
- **학습 통계** - 단어별 정답률 추적, 취약 단어 분석 및 집중 학습

## 기술 스택

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4
- Turso (libSQL) + Drizzle ORM
- JWT (jose) + bcryptjs + Google OAuth 2.0 + nodemailer
- React Context API + useReducer
- Web Speech API (TTS)
- Server DB (인증 사용자) / LocalStorage (게스트 fallback)

## 시작하기

```bash
npm install
```

### 환경 변수 설정

`.env.local` 파일을 생성하고 아래 값을 입력합니다:

```
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-token
JWT_SECRET=your-random-secret-32chars
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXT_PUBLIC_BASE_URL=http://localhost:3000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
```

### DB 테이블 생성

```bash
npx drizzle-kit push
```

### 개발 서버 실행

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000)에서 확인할 수 있습니다.

## 단어장 데이터 형식

`data/` 폴더에 샘플 JSON 파일이 포함되어 있습니다. 아래 형식으로 단어장을 가져올 수 있습니다.

```json
[
  {
    "en": "identify",
    "ko": "(신원을) 확인하다",
    "example": "Passengers were asked to identify their luggage.",
    "mnemonic": "ID 카드를 떠올리세요."
  }
]
```

`en`, `ko` 필드는 필수이며, `example`, `mnemonic`은 선택 사항입니다.

## 스크립트

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 개발 서버 실행 |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 프로덕션 서버 실행 |
| `npm run lint` | ESLint 실행 |
| `npx drizzle-kit push` | DB 스키마 적용 |

## 상세 문서

프로젝트의 상세 설계 및 기능 명세는 [word-test-app.md](./word-test-app.md)를 참고하세요.
