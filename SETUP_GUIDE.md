# 갓생스쿨 로그인 시스템 설치 가이드

## 📋 개요

교사와 학생 계정을 데이터베이스에 저장하고 로그인 기능을 제공하는 시스템입니다.

### 주요 기능
- ✅ 교사/학생 회원가입 및 로그인
- ✅ JWT 토큰 기반 인증
- ✅ SQLite 데이터베이스로 계정 정보 저장
- ✅ 프로필 관리 (학생: 학년/학번, 교사: 과목/학과)
- ✅ 반 생성 및 참여 기능
- ✅ 로그인 상태 유지

## 🛠️ 기술 스택

**백엔드:**
- Node.js + Express
- SQLite (better-sqlite3)
- JWT (jsonwebtoken)
- bcryptjs (비밀번호 해싱)

**프론트엔드:**
- React + TypeScript
- Vite

## 📦 설치 방법

### 1. 백엔드 서버 설정

```bash
# 서버 디렉토리로 이동
cd server

# 패키지 설치
npm install

# 데이터베이스 초기화 (테이블 생성 + 샘플 데이터)
npm run init-db

# 서버 실행
npm run dev
```

서버가 `http://localhost:3001`에서 실행됩니다.

### 2. 프론트엔드 설정

```bash
# 프로젝트 루트 디렉토리에서
npm install

# 개발 서버 실행
npm run dev
```

## 📁 파일 구조

```
project/
├── server/                    # 백엔드 서버
│   ├── server.js             # Express 서버 (API 엔드포인트)
│   ├── init-db.js            # 데이터베이스 초기화 스크립트
│   ├── package.json          # 서버 의존성
│   ├── .env                  # 환경 변수
│   └── godsaeng.db          # SQLite 데이터베이스 (자동 생성)
│
├── components/               # React 컴포넌트
│   ├── LoginScreen.tsx      # 로그인 화면
│   ├── RegisterScreen.tsx   # 회원가입 화면
│   ├── Button.tsx
│   ├── Toast.tsx
│   └── BottomNav.tsx
│
├── App.tsx                  # 메인 앱 컴포넌트
├── App-Updated.tsx          # 로그인 통합된 앱 컴포넌트
├── types.ts                 # 기존 타입 정의
├── types-updated.ts         # 업데이트된 타입 정의
└── package.json
```

## 🗄️ 데이터베이스 스키마

### users (사용자 테이블)
- `id`: 사용자 ID (Primary Key)
- `email`: 이메일 (Unique)
- `password`: 해싱된 비밀번호
- `name`: 이름
- `user_type`: 'STUDENT' 또는 'TEACHER'
- `created_at`: 생성 시간
- `updated_at`: 수정 시간

### student_profiles (학생 프로필)
- `id`: 프로필 ID
- `user_id`: 사용자 ID (Foreign Key)
- `grade`: 학년
- `student_number`: 학번
- `points`: 포인트

### teacher_profiles (교사 프로필)
- `id`: 프로필 ID
- `user_id`: 사용자 ID (Foreign Key)
- `subject`: 담당 과목
- `department`: 소속 학과

### classes (반 정보)
- `id`: 반 ID
- `name`: 반 이름
- `subject`: 과목
- `code`: 고유 반 코드
- `teacher_id`: 담당 교사 ID
- `created_at`: 생성 시간

### class_students (반-학생 연결)
- `id`: 연결 ID
- `class_id`: 반 ID
- `student_id`: 학생 ID
- `joined_at`: 참여 시간

## 🔌 API 엔드포인트

### 인증 API

#### 1. 회원가입
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "student@example.com",
  "password": "password123",
  "name": "홍길동",
  "userType": "STUDENT",
  "grade": "2학년",
  "studentNumber": "20231"
}
```

**응답:**
```json
{
  "message": "회원가입이 완료되었습니다.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "student@example.com",
    "name": "홍길동",
    "userType": "STUDENT"
  }
}
```

#### 2. 로그인
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "student@example.com",
  "password": "password123"
}
```

**응답:**
```json
{
  "message": "로그인 성공",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "student@example.com",
    "name": "홍길동",
    "userType": "STUDENT",
    "profile": {
      "grade": "2학년",
      "student_number": "20231",
      "points": 100
    }
  }
}
```

#### 3. 현재 사용자 정보
```http
GET /api/auth/me
Authorization: Bearer {token}
```

### 반 관리 API

#### 1. 반 생성 (교사용)
```http
POST /api/classes
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "2학년 1반",
  "subject": "수학"
}
```

#### 2. 반 참여 (학생용)
```http
POST /api/classes/join
Authorization: Bearer {token}
Content-Type: application/json

{
  "code": "MATH2024"
}
```

#### 3. 내 반 목록 조회
```http
GET /api/classes/my
Authorization: Bearer {token}
```

## 🧪 테스트 계정

데이터베이스 초기화 시 자동으로 생성되는 테스트 계정:

### 교사 계정
- 이메일: `teacher@example.com`
- 비밀번호: `password123`
- 이름: 김선생
- 과목: 수학

### 학생 계정 1
- 이메일: `student1@example.com`
- 비밀번호: `password123`
- 이름: 이학생
- 학년: 2학년
- 학번: 20231

### 학생 계정 2
- 이메일: `student2@example.com`
- 비밀번호: `password123`
- 이름: 박학생
- 학년: 2학년
- 학번: 20232

### 샘플 반
- 반 이름: 2학년 1반
- 과목: 수학
- 반 코드: `MATH2024`

## 🔄 코드 적용 방법

### 1. types.ts 업데이트
기존 `types.ts` 파일을 `types-updated.ts` 내용으로 교체하거나, LOGIN, REGISTER Screen을 추가합니다.

```typescript
export enum Screen {
  WELCOME = 'WELCOME',
  LOGIN = 'LOGIN',           // 추가
  REGISTER = 'REGISTER',     // 추가
  ACCOUNT_SELECTION = 'ACCOUNT_SELECTION',
  // ... 나머지 화면들
}
```

### 2. App.tsx 업데이트
`App-Updated.tsx`의 내용을 참고하여 기존 `App.tsx`를 수정합니다.

주요 변경사항:
- LoginScreen, RegisterScreen 컴포넌트 import
- 로그인 상태 관리 (isAuthenticated, userData)
- localStorage를 통한 로그인 상태 유지
- 로그인/회원가입 화면 렌더링 로직 추가
- 로그아웃 기능

### 3. 새 컴포넌트 확인
다음 파일들이 올바르게 생성되었는지 확인:
- `components/LoginScreen.tsx`
- `components/RegisterScreen.tsx`

## 🔒 보안 고려사항

### 프로덕션 배포 시 반드시 변경해야 할 사항:

1. **JWT Secret 변경**
   ```env
   # server/.env
   JWT_SECRET=your-very-strong-secret-key-here-at-least-32-characters
   ```

2. **CORS 설정**
   ```javascript
   // server/server.js
   app.use(cors({
     origin: 'https://your-domain.com',
     credentials: true
   }));
   ```

3. **HTTPS 사용**
   - 프로덕션에서는 반드시 HTTPS를 사용하세요

4. **환경 변수 관리**
   - `.env` 파일을 `.gitignore`에 추가
   - 민감한 정보는 환경 변수로 관리

5. **비밀번호 정책**
   - 비밀번호 최소 길이: 6자 (더 길게 설정 권장)
   - 복잡도 요구사항 추가 권장

## 🐛 문제 해결

### 데이터베이스 초기화 오류
```bash
# 기존 데이터베이스 삭제 후 재생성
cd server
rm godsaeng.db
npm run init-db
```

### CORS 오류
프론트엔드와 백엔드 포트가 다른 경우 발생합니다. server.js에서 CORS 설정을 확인하세요.

### 로그인 토큰 만료
JWT 토큰은 7일 후 만료됩니다. 만료 시간을 변경하려면:
```javascript
// server/server.js
const token = jwt.sign(
  { userId, email, userType },
  JWT_SECRET,
  { expiresIn: '30d' } // 30일로 변경
);
```

## 📚 추가 기능 개발 가이드

### 비밀번호 재설정 추가
1. `forgot_password` 테이블 생성
2. 이메일 전송 기능 구현
3. 재설정 토큰 생성 및 검증

### OAuth 로그인 추가 (Google, 카카오)
1. passport.js 설치
2. OAuth 전략 설정
3. 소셜 로그인 버튼 추가

### 프로필 사진 업로드
1. multer 설치 (파일 업로드)
2. 이미지 저장 경로 설정
3. 프로필 사진 API 추가

## 📞 지원

문제가 발생하면 다음을 확인하세요:
1. Node.js 버전 (v16 이상 권장)
2. 포트 충돌 (3001, 5173 포트 사용 중인지 확인)
3. 패키지 설치 완료 여부
4. 데이터베이스 파일 생성 여부

---

**버전:** 1.0.0  
**최종 업데이트:** 2024
