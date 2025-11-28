import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Database from 'better-sqlite3';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const db = new Database('godsaeng.db');
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// 미들웨어
app.use(cors());
app.use(express.json());

// JWT 인증 미들웨어
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '인증 토큰이 필요합니다.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: '유효하지 않은 토큰입니다.' });
    }
    req.user = user;
    next();
  });
};

// ==================== 인증 API ====================

// 회원가입
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, userType, grade, studentNumber, subject, department } = req.body;

    // 유효성 검사
    if (!email || !password || !name || !userType) {
      return res.status(400).json({ error: '필수 정보를 입력해주세요.' });
    }

    if (userType !== 'STUDENT' && userType !== 'TEACHER') {
      return res.status(400).json({ error: '유효하지 않은 사용자 유형입니다.' });
    }

    // 이메일 중복 확인
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(409).json({ error: '이미 사용 중인 이메일입니다.' });
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10);

    // 사용자 생성
    const insertUser = db.prepare(`
      INSERT INTO users (email, password, name, user_type) 
      VALUES (?, ?, ?, ?)
    `);
    
    const result = insertUser.run(email, hashedPassword, name, userType);
    const userId = result.lastInsertRowid;

    // 프로필 생성
    if (userType === 'STUDENT') {
      db.prepare(`
        INSERT INTO student_profiles (user_id, grade, student_number, points) 
        VALUES (?, ?, ?, 0)
      `).run(userId, grade || null, studentNumber || null);
    } else if (userType === 'TEACHER') {
      db.prepare(`
        INSERT INTO teacher_profiles (user_id, subject, department) 
        VALUES (?, ?, ?)
      `).run(userId, subject || null, department || null);
    }

    // JWT 토큰 생성
    const token = jwt.sign(
      { userId, email, userType },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: '회원가입이 완료되었습니다.',
      token,
      user: {
        id: userId,
        email,
        name,
        userType
      }
    });
  } catch (error) {
    console.error('회원가입 에러:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 로그인
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 유효성 검사
    if (!email || !password) {
      return res.status(400).json({ error: '이메일과 비밀번호를 입력해주세요.' });
    }

    // 사용자 조회
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    
    if (!user) {
      return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }

    // 비밀번호 확인
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }

    // 프로필 정보 가져오기
    let profile = null;
    if (user.user_type === 'STUDENT') {
      profile = db.prepare('SELECT * FROM student_profiles WHERE user_id = ?').get(user.id);
    } else if (user.user_type === 'TEACHER') {
      profile = db.prepare('SELECT * FROM teacher_profiles WHERE user_id = ?').get(user.id);
    }

    // JWT 토큰 생성
    const token = jwt.sign(
      { userId: user.id, email: user.email, userType: user.user_type },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: '로그인 성공',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        userType: user.user_type,
        profile
      }
    });
  } catch (error) {
    console.error('로그인 에러:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 현재 사용자 정보 조회
app.get('/api/auth/me', authenticateToken, (req, res) => {
  try {
    const user = db.prepare(`
      SELECT id, email, name, user_type, created_at 
      FROM users 
      WHERE id = ?
    `).get(req.user.userId);

    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    // 프로필 정보 가져오기
    let profile = null;
    if (user.user_type === 'STUDENT') {
      profile = db.prepare('SELECT * FROM student_profiles WHERE user_id = ?').get(user.id);
    } else if (user.user_type === 'TEACHER') {
      profile = db.prepare('SELECT * FROM teacher_profiles WHERE user_id = ?').get(user.id);
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        userType: user.user_type,
        createdAt: user.created_at,
        profile
      }
    });
  } catch (error) {
    console.error('사용자 정보 조회 에러:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// ==================== 반 관리 API ====================

// 반 생성 (교사용)
app.post('/api/classes', authenticateToken, (req, res) => {
  try {
    if (req.user.userType !== 'TEACHER') {
      return res.status(403).json({ error: '교사만 반을 생성할 수 있습니다.' });
    }

    const { name, subject } = req.body;
    
    if (!name || !subject) {
      return res.status(400).json({ error: '반 이름과 과목을 입력해주세요.' });
    }

    // 고유한 반 코드 생성
    const code = `${subject.substring(0, 3).toUpperCase()}${Date.now().toString().slice(-6)}`;

    const result = db.prepare(`
      INSERT INTO classes (name, subject, code, teacher_id) 
      VALUES (?, ?, ?, ?)
    `).run(name, subject, code, req.user.userId);

    res.status(201).json({
      message: '반이 생성되었습니다.',
      class: {
        id: result.lastInsertRowid,
        name,
        subject,
        code
      }
    });
  } catch (error) {
    console.error('반 생성 에러:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 반 참여 (학생용)
app.post('/api/classes/join', authenticateToken, (req, res) => {
  try {
    if (req.user.userType !== 'STUDENT') {
      return res.status(403).json({ error: '학생만 반에 참여할 수 있습니다.' });
    }

    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: '반 코드를 입력해주세요.' });
    }

    // 반 존재 확인
    const classInfo = db.prepare('SELECT * FROM classes WHERE code = ?').get(code);
    
    if (!classInfo) {
      return res.status(404).json({ error: '존재하지 않는 반 코드입니다.' });
    }

    // 이미 참여 중인지 확인
    const existing = db.prepare(`
      SELECT * FROM class_students 
      WHERE class_id = ? AND student_id = ?
    `).get(classInfo.id, req.user.userId);

    if (existing) {
      return res.status(409).json({ error: '이미 참여 중인 반입니다.' });
    }

    // 반에 참여
    db.prepare(`
      INSERT INTO class_students (class_id, student_id) 
      VALUES (?, ?)
    `).run(classInfo.id, req.user.userId);

    res.json({
      message: '반 참여가 완료되었습니다.',
      class: {
        id: classInfo.id,
        name: classInfo.name,
        subject: classInfo.subject
      }
    });
  } catch (error) {
    console.error('반 참여 에러:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 내 반 목록 조회
app.get('/api/classes/my', authenticateToken, (req, res) => {
  try {
    let classes;

    if (req.user.userType === 'TEACHER') {
      classes = db.prepare(`
        SELECT c.*, 
               (SELECT COUNT(*) FROM class_students WHERE class_id = c.id) as student_count
        FROM classes c
        WHERE c.teacher_id = ?
        ORDER BY c.created_at DESC
      `).all(req.user.userId);
    } else if (req.user.userType === 'STUDENT') {
      classes = db.prepare(`
        SELECT c.*, u.name as teacher_name,
               cs.joined_at
        FROM classes c
        JOIN class_students cs ON c.id = cs.class_id
        JOIN users u ON c.teacher_id = u.id
        WHERE cs.student_id = ?
        ORDER BY cs.joined_at DESC
      `).all(req.user.userId);
    }

    res.json({ classes });
  } catch (error) {
    console.error('반 목록 조회 에러:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// ==================== 서버 시작 ====================

app.listen(PORT, () => {
  console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`📍 API 주소: http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close();
  process.exit(0);
});
