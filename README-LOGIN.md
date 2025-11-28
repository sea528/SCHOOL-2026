# 갓생스쿨 로그인 시스템

교사와 학생 계정을 데이터베이스에 저장하고 로그인/회원가입 기능을 제공하는 완전한 인증 시스템입니다.

## ✨ 주요 기능

- ✅ **회원가입**: 교사/학생 계정 분리 가입
- ✅ **로그인**: 이메일/비밀번호 인증
- ✅ **JWT 토큰**: 안전한 인증 토큰 시스템
- ✅ **데이터베이스**: SQLite로 계정 정보 영구 저장
- ✅ **프로필 관리**: 사용자 타입별 프로필 정보
- ✅ **반 관리**: 반 생성, 참여, 조회 기능
- ✅ **세션 유지**: 로그인 상태 자동 복원

## 🚀 빠른 시작

### 1단계: 백엔드 서버 시작

```bash
cd server
npm install
npm run init-db  # 데이터베이스 초기화 (최초 1회)
npm run dev      # 서버 실행
```

서버가 http://localhost:3001에서 실행됩니다.

### 2단계: 프론트엔드 실행

```bash
# 새 터미널에서
npm install
npm run dev
```

프론트엔드가 http://localhost:5173에서 실행됩니다.

### 3단계: 로그인 테스트

다음 테스트 계정으로 바로 로그인할 수 있습니다:

**교사 계정:**
- 이메일: `teacher@example.com`
- 비밀번호: `password123`

**학생 계정:**
- 이메일: `student1@example.com`
- 비밀번호: `password123`

**반 코드:** `MATH2024`

## 📱 사용자 흐름

### 학생 사용자
1. 회원가입 (이메일, 비밀번호, 이름, 학년, 학번)
2. 로그인
3. 반 코드로 반 참여
4. 챌린지 참여 및 학습 활동

### 교사 사용자
1. 회원가입 (이메일, 비밀번호, 이름, 과목, 학과)
2. 로그인
3. 반 생성 (고유 코드 자동 생성)
4. 학생 관리 및 챌린지 생성

## 🗂️ 프로젝트 구조

```
galdsaeng-school/
├── server/                      # 백엔드 서버
│   ├── server.js               # Express API 서버
│   ├── init-db.js              # DB 초기화 스크립트
│   ├── package.json            # 서버 의존성
│   ├── .env                    # 환경 변수
│   └── godsaeng.db            # SQLite 데이터베이스
│
├── components/                  # React 컴포넌트
│   ├── LoginScreen.tsx         # 로그인 화면
│   ├── RegisterScreen.tsx      # 회원가입 화면
│   ├── Button.tsx
│   ├── Toast.tsx
│   └── BottomNav.tsx
│
├── App.tsx                     # 메인 앱
├── types.ts                    # 타입 정의
└── README-LOGIN.md             # 이 파일
```

## 🔧 기술 스택

### 백엔드
- **Node.js** + **Express**: REST API 서버
- **SQLite** (better-sqlite3): 경량 데이터베이스
- **JWT** (jsonwebtoken): 토큰 기반 인증
- **bcryptjs**: 비밀번호 암호화
- **CORS**: 크로스 오리진 요청 처리

### 프론트엔드
- **React 19** + **TypeScript**: UI 프레임워크
- **Vite**: 빌드 도구
- **Lucide React**: 아이콘

## 📊 데이터베이스 스키마

### users (사용자)
```sql
- id: INTEGER PRIMARY KEY
- email: TEXT UNIQUE NOT NULL
- password: TEXT NOT NULL (해싱됨)
- name: TEXT NOT NULL
- user_type: TEXT ('STUDENT' | 'TEACHER')
- created_at: DATETIME
```

### student_profiles (학생 프로필)
```sql
- id: INTEGER PRIMARY KEY
- user_id: INTEGER (외래키)
- grade: TEXT
- student_number: TEXT
- points: INTEGER DEFAULT 0
```

### teacher_profiles (교사 프로필)
```sql
- id: INTEGER PRIMARY KEY
- user_id: INTEGER (외래키)
- subject: TEXT
- department: TEXT
```

### classes (반)
```sql
- id: INTEGER PRIMARY KEY
- name: TEXT NOT NULL
- subject: TEXT NOT NULL
- code: TEXT UNIQUE NOT NULL
- teacher_id: INTEGER (외래키)
- created_at: DATETIME
```

### class_students (반-학생 연결)
```sql
- id: INTEGER PRIMARY KEY
- class_id: INTEGER (외래키)
- student_id: INTEGER (외래키)
- joined_at: DATETIME
```

## 🔌 API 엔드포인트

### 인증 API

#### POST `/api/auth/register`
회원가입

**요청:**
```json
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
  "token": "eyJhbGc...",
  "user": {
    "id": 1,
    "email": "student@example.com",
    "name": "홍길동",
    "userType": "STUDENT"
  }
}
```

#### POST `/api/auth/login`
로그인

**요청:**
```json
{
  "email": "student@example.com",
  "password": "password123"
}
```

#### GET `/api/auth/me`
현재 사용자 정보 조회 (인증 필요)

**헤더:**
```
Authorization: Bearer {token}
```

### 반 관리 API

#### POST `/api/classes`
반 생성 (교사 전용, 인증 필요)

**요청:**
```json
{
  "name": "2학년 1반",
  "subject": "수학"
}
```

#### POST `/api/classes/join`
반 참여 (학생 전용, 인증 필요)

**요청:**
```json
{
  "code": "MATH2024"
}
```

#### GET `/api/classes/my`
내 반 목록 조회 (인증 필요)

## 🔐 보안 기능

1. **비밀번호 해싱**: bcrypt로 안전하게 저장
2. **JWT 토큰**: 7일 유효기간
3. **CORS 설정**: 허용된 도메인만 접근
4. **SQL Injection 방지**: Prepared statements 사용
5. **인증 미들웨어**: 보호된 라우트 접근 제어

## 📝 코드 통합 가이드

기존 App.tsx에 로그인 기능을 추가하려면:

### 1. types.ts 업데이트
```typescript
export enum Screen {
  // 기존 화면들...
  LOGIN = 'LOGIN',
  REGISTER = 'REGISTER',
}
```

### 2. 컴포넌트 import 추가
```typescript
import { LoginScreen } from './components/LoginScreen';
import { RegisterScreen } from './components/RegisterScreen';
```

### 3. 상태 관리 추가
```typescript
const [isAuthenticated, setIsAuthenticated] = useState(false);
const [userData, setUserData] = useState(null);

// 로그인 상태 확인
useEffect(() => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    // 토큰으로 사용자 정보 복원
  }
}, []);
```

자세한 내용은 `App-Updated.tsx` 파일을 참고하세요.

## 🎯 주요 기능 설명

### 회원가입 프로세스
1. 사용자 타입 선택 (교사/학생)
2. 이메일, 비밀번호, 이름 입력
3. 추가 정보 입력 (학생: 학년/학번, 교사: 과목/학과)
4. 자동 로그인 및 JWT 토큰 발급

### 로그인 프로세스
1. 이메일, 비밀번호 입력
2. 서버에서 인증 확인
3. JWT 토큰 발급 및 localStorage 저장
4. 사용자 타입에 따라 적절한 화면으로 이동

### 인증 유지
- JWT 토큰을 localStorage에 저장
- 페이지 새로고침 시 자동 로그인
- 7일 후 토큰 만료 (재로그인 필요)

## 🐛 문제 해결

### "EADDRINUSE: address already in use"
포트 3001이 이미 사용 중입니다. 다른 프로세스를 종료하거나 .env에서 포트를 변경하세요.

```bash
# 포트 사용 프로세스 확인
lsof -i :3001

# 프로세스 종료
kill -9 <PID>
```

### CORS 오류
백엔드 서버가 실행 중인지 확인하고, server.js의 CORS 설정을 확인하세요.

### 로그인 후 화면이 표시되지 않음
브라우저 콘솔에서 에러 메시지를 확인하고, localStorage에 토큰이 저장되었는지 확인하세요.

```javascript
// 개발자 도구 콘솔에서
localStorage.getItem('auth_token')
```

### 데이터베이스 초기화
데이터베이스를 처음부터 다시 만들려면:

```bash
cd server
rm godsaeng.db
npm run init-db
```

## 🚀 프로덕션 배포

### 환경 변수 설정
```env
# server/.env
NODE_ENV=production
PORT=3001
JWT_SECRET=your-super-secret-32-character-key-here
```

### 보안 체크리스트
- [ ] JWT_SECRET을 강력한 값으로 변경
- [ ] HTTPS 사용
- [ ] CORS origin을 특정 도메인으로 제한
- [ ] 비밀번호 정책 강화 (최소 8자, 특수문자 포함)
- [ ] Rate limiting 추가
- [ ] 데이터베이스 백업 설정
- [ ] 로그 모니터링 설정

## 📚 다음 단계

### 추가 기능 아이디어
- [ ] 비밀번호 재설정 (이메일 인증)
- [ ] OAuth 로그인 (Google, 카카오)
- [ ] 프로필 사진 업로드
- [ ] 이메일 인증 (회원가입 시)
- [ ] 2단계 인증 (2FA)
- [ ] 관리자 대시보드
- [ ] 활동 로그 기록

### 개선 사항
- [ ] PostgreSQL로 데이터베이스 전환
- [ ] Redis로 세션 관리
- [ ] API 응답 캐싱
- [ ] 입력 유효성 검사 강화
- [ ] 단위 테스트 추가
- [ ] API 문서 자동 생성 (Swagger)

## 📞 지원

문제가 있으시면 다음을 확인하세요:

1. **서버 로그**: 백엔드 터미널의 에러 메시지
2. **브라우저 콘솔**: 프론트엔드 에러
3. **네트워크 탭**: API 요청/응답 확인
4. **데이터베이스**: godsaeng.db 파일 존재 여부

자세한 설정 가이드는 `SETUP_GUIDE.md`를 참고하세요.

---

**버전**: 1.0.0  
**작성일**: 2024  
**라이선스**: MIT
