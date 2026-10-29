# 제주 IP 아카이브

Vite + React + Supabase Auth + Pixabay API, Vercel 배포용 프로젝트.

## 1. 환경변수 준비

| 변수 | 위치 | 얻는 곳 |
|---|---|---|
| `VITE_SUPABASE_URL` | 브라우저 | Supabase → Project Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | 브라우저 | 같은 화면의 `anon` `public` 키 |
| `PIXABAY_API_KEY` | 서버 전용 | https://pixabay.com/api/docs/ 로그인 후 표시되는 키 |

> `service_role` 키는 절대 사용/등록하지 마세요. `PIXABAY_API_KEY`에는 `VITE_` 접두사를 붙이지 않습니다(브라우저 노출 방지).

## 2. Supabase 설정

1. Authentication → Providers → Email 활성화 확인
2. Authentication → URL Configuration
   - Site URL: 배포 주소 (예: `https://내프로젝트.vercel.app`)
   - Redirect URLs: `http://localhost:5173/**`, `https://내프로젝트.vercel.app/**`
3. (수업/테스트용) 이메일 인증을 생략하려면 Providers → Email → "Confirm email" 끄기

### 장바구니 테이블 생성 (필수)

1. Supabase 대시보드 → SQL Editor → New query
2. `supabase/cart.sql` 내용을 붙여넣고 Run
3. Table Editor에서 `cart_items` 테이블과 RLS(Row Level Security) 활성화 여부 확인

## 3. 로컬 실행

```bash
npm install
copy .env.example .env   # 값 채우기
npm run dev
```

## 4. Vercel 배포

1. GitHub에 push
2. vercel.com → Add New Project → 저장소 Import (Framework: Vite 자동 인식)
3. Environment Variables에 위 3개 등록 (Production/Preview/Development 모두)
4. Deploy → 발급된 도메인을 Supabase Site URL/Redirect URLs에 추가
