# 내 이야기 — 세팅 가이드

## 전체 순서 요약
1. Supabase 프로젝트 생성
2. 카카오 개발자 앱 등록
3. Anthropic / OpenAI API 키 발급
4. 환경변수 설정
5. VS Code에서 실행
6. Vercel 배포

---

## 1. Supabase 설정

### 1-1. 프로젝트 생성
1. https://supabase.com 접속 → 로그인
2. "New project" 클릭
3. 프로젝트 이름: `nae-iyagi`, 비밀번호 설정, 리전: `Northeast Asia (Seoul)`

### 1-2. 데이터베이스 스키마 생성
1. Supabase 대시보드 → SQL Editor
2. `supabase-schema.sql` 파일 전체 내용 붙여넣기 → Run

### 1-3. 카카오 OAuth 설정
1. Supabase 대시보드 → Authentication → Providers
2. Kakao 찾아서 Enable
3. Kakao에서 발급받은 Client ID, Secret 입력 (아래 2단계 먼저 진행)

### 1-4. 키 확인
- Settings → API → `Project URL`, `anon public` 키 복사

---

## 2. 카카오 개발자 설정

1. https://developers.kakao.com 접속 → 로그인
2. 내 애플리케이션 → 애플리케이션 추가
3. 앱 이름: `내이야기`

### REST API 키 확인
- 앱 설정 → 앱 키 → **REST API 키** 복사

### 카카오 로그인 설정
1. 제품 설정 → 카카오 로그인 → 활성화
2. Redirect URI 추가:
   - 개발: `http://localhost:3000/auth/callback`
   - 운영: `https://your-domain.vercel.app/auth/callback`
   - Supabase 콜백: `https://your-project.supabase.co/auth/v1/callback`

### 동의 항목
- 제품 설정 → 카카오 로그인 → 동의항목
- **닉네임**: 필수 동의
- **프로필 사진**: 선택 동의

### 보안 (Client Secret)
- 앱 설정 → 보안 → Client Secret 코드 생성 → 복사

---

## 3. API 키 발급

### Anthropic (Claude)
1. https://console.anthropic.com 접속
2. API Keys → Create Key → 복사

### OpenAI (DALL-E 이미지 생성)
1. https://platform.openai.com 접속
2. API Keys → Create new secret key → 복사

---

## 4. 환경변수 설정

프로젝트 루트에 `.env.local` 파일 생성:

```bash
# .env.local.example 파일을 복사해서 시작하세요
cp .env.local.example .env.local
```

`.env.local` 파일을 열고 각 값 입력:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

ANTHROPIC_API_KEY=sk-ant-...

OPENAI_API_KEY=sk-...

KAKAO_CLIENT_ID=your_rest_api_key
KAKAO_CLIENT_SECRET=your_client_secret

NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=아무_랜덤_문자열_32자_이상
```

---

## 5. VS Code에서 실행

```bash
# 프로젝트 폴더 열기
cd nae-iyagi

# 패키지 설치
npm install

# 개발 서버 실행
npm run dev
```

브라우저에서 http://localhost:3000 접속

---

## 6. Vercel 배포

### 방법 A: Vercel 웹사이트 (추천)
1. https://vercel.com 로그인
2. "Add New Project" → GitHub 연결 → 레포 선택
3. Environment Variables에 `.env.local` 내용 전부 입력
4. Deploy

### 방법 B: CLI
```bash
npm install -g vercel
vercel login
vercel --prod
```

### 배포 후 해야 할 것
1. Vercel에서 발급된 도메인 확인 (예: `https://nae-iyagi.vercel.app`)
2. 카카오 개발자 → Redirect URI에 Vercel 도메인 추가
3. Supabase → Authentication → URL Configuration → Site URL을 Vercel 도메인으로 변경

---

## 파일 구조

```
nae-iyagi/
├── app/
│   ├── page.tsx              # 랜딩/로그인 페이지
│   ├── layout.tsx            # 루트 레이아웃
│   ├── globals.css           # 전역 스타일
│   ├── auth/callback/        # 카카오 로그인 콜백
│   ├── onboarding/           # 첫 카테고리 선택
│   ├── home/                 # 홈 (오늘의 질문)
│   ├── chat/                 # AI 대화 화면
│   ├── book/                 # 이야기 책
│   ├── gallery/              # 기억 갤러리
│   └── api/
│       ├── chat/             # Claude API 연동
│       └── image-generate/   # DALL-E 이미지 생성
├── lib/
│   ├── supabase.ts           # 클라이언트 Supabase
│   └── supabase-server.ts    # 서버 Supabase
├── supabase-schema.sql       # DB 스키마 (Supabase에 실행)
└── .env.local.example        # 환경변수 템플릿
```

---

## 주요 기능 흐름

```
카카오 로그인
    → 신규: 온보딩 (카테고리 선택 1개)
    → 기존: 홈 화면

홈 화면
    → 오늘의 질문 (카테고리 기반, 매일 바뀜)
    → 질문 바꾸기 (같은 주제 쉽게 → 다른 주제)
    → 내가 먼저 이야기하기 (자유 모드)
    → 이어가기 (최근 세션)

대화 화면
    → Claude AI가 공감 + 질문으로 응답
    → 4번 이상 대화 후 이미지 생성 제안
    → DALL-E로 수채화 스타일 기억 이미지 생성
    → 다른 이야기 버튼으로 언제든 전환

이야기 책
    → 카테고리별 세션 목록
    → 진행도 바 (계속 채우고 싶은 동기)

갤러리
    → 생성된 이미지 모음
    → 이미지 → 해당 이야기로 연결
```

---

## 문제 해결

**카카오 로그인이 안 될 때**
- Redirect URI가 정확히 일치하는지 확인 (슬래시 하나도 중요)
- Supabase의 Kakao Client ID/Secret 재확인

**이미지가 생성 안 될 때**
- OpenAI 계정에 크레딧이 있는지 확인
- DALL-E 3는 유료 API (이미지 1개 약 $0.04)

**대화가 저장 안 될 때**
- Supabase RLS 정책이 적용됐는지 확인
- supabase-schema.sql을 완전히 실행했는지 확인
