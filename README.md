# Word Quiz App

영어 단어장을 관리하고 주관식 퀴즈로 학습할 수 있는 웹 애플리케이션입니다.

## 주요 기능

- **단어장 관리** - 생성, 수정, 삭제, 드래그 앤 드롭 정렬, JSON 가져오기/내보내기
- **AI가 만든 단어장** - 중등~고등 필수 영단어 3,000개 (중1~중3 × 10세트 + 고1~고3 × 15세트), AI 배지 표시, 90%↑ 정복 시스템, 어근 중심 암기팁
- **주관식 퀴즈** - EN→KO / KO→EN 방향 선택, 유연한 정답 매칭
- **TTS 음성 재생** - 단어 자동 발음, 전체 순차 재생 (영어→한국어)
- **30초 타이머** - 문제당 카운트다운, 시간 초과 시 자동 오답 처리
- **학습 통계** - 단어별 정답률 추적, 취약 단어 분석 및 집중 학습

## 기술 스택

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4
- React Context API + useReducer
- Web Speech API (TTS)
- LocalStorage (데이터 저장)

## 시작하기

```bash
npm install
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

## 상세 문서

프로젝트의 상세 설계 및 기능 명세는 [word-test-app.md](./word-test-app.md)를 참고하세요.
