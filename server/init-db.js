import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

const db = new Database('godsaeng.db');

// 데이터베이스 초기화
db.exec(`
  -- 사용자 테이블
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    user_type TEXT NOT NULL CHECK(user_type IN ('STUDENT', 'TEACHER')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 학생 프로필 테이블
  CREATE TABLE IF NOT EXISTS student_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    grade TEXT,
    student_number TEXT,
    points INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- 교사 프로필 테이블
  CREATE TABLE IF NOT EXISTS teacher_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    subject TEXT,
    department TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- 반 테이블
  CREATE TABLE IF NOT EXISTS classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    teacher_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- 반-학생 연결 테이블
  CREATE TABLE IF NOT EXISTS class_students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    class_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(class_id, student_id)
  );

  -- 챌린지 테이블
  CREATE TABLE IF NOT EXISTS challenges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    reward TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'active', 'completed')),
    class_id INTEGER,
    teacher_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- 인덱스 생성
  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  CREATE INDEX IF NOT EXISTS idx_classes_code ON classes(code);
  CREATE INDEX IF NOT EXISTS idx_classes_teacher ON classes(teacher_id);
  CREATE INDEX IF NOT EXISTS idx_class_students_class ON class_students(class_id);
  CREATE INDEX IF NOT EXISTS idx_class_students_student ON class_students(student_id);
`);

console.log('✅ 데이터베이스 테이블이 생성되었습니다.');

// 샘플 데이터 추가
const hashedPassword = bcrypt.hashSync('password123', 10);

try {
  // 샘플 교사 추가
  const insertTeacher = db.prepare(`
    INSERT INTO users (email, password, name, user_type) 
    VALUES (?, ?, ?, ?)
  `);
  
  const teacherResult = insertTeacher.run('teacher@example.com', hashedPassword, '김선생', 'TEACHER');
  const teacherId = teacherResult.lastInsertRowid;
  
  db.prepare(`
    INSERT INTO teacher_profiles (user_id, subject, department) 
    VALUES (?, ?, ?)
  `).run(teacherId, '수학', '수학과');

  // 샘플 학생 추가
  const insertStudent = db.prepare(`
    INSERT INTO users (email, password, name, user_type) 
    VALUES (?, ?, ?, ?)
  `);
  
  const student1Result = insertStudent.run('student1@example.com', hashedPassword, '이학생', 'STUDENT');
  const student1Id = student1Result.lastInsertRowid;
  
  db.prepare(`
    INSERT INTO student_profiles (user_id, grade, student_number, points) 
    VALUES (?, ?, ?, ?)
  `).run(student1Id, '2학년', '20231', 100);

  const student2Result = insertStudent.run('student2@example.com', hashedPassword, '박학생', 'STUDENT');
  const student2Id = student2Result.lastInsertRowid;
  
  db.prepare(`
    INSERT INTO student_profiles (user_id, grade, student_number, points) 
    VALUES (?, ?, ?, ?)
  `).run(student2Id, '2학년', '20232', 150);

  // 샘플 반 추가
  const classResult = db.prepare(`
    INSERT INTO classes (name, subject, code, teacher_id) 
    VALUES (?, ?, ?, ?)
  `).run('2학년 1반', '수학', 'MATH2024', teacherId);
  
  const classId = classResult.lastInsertRowid;

  // 학생을 반에 등록
  const joinClass = db.prepare(`
    INSERT INTO class_students (class_id, student_id) 
    VALUES (?, ?)
  `);
  
  joinClass.run(classId, student1Id);
  joinClass.run(classId, student2Id);

  console.log('\n✅ 샘플 데이터가 추가되었습니다:');
  console.log('\n📚 교사 계정:');
  console.log('  이메일: teacher@example.com');
  console.log('  비밀번호: password123');
  console.log('\n👨‍🎓 학생 계정:');
  console.log('  이메일: student1@example.com');
  console.log('  비밀번호: password123');
  console.log('  이메일: student2@example.com');
  console.log('  비밀번호: password123');
  console.log('\n🎓 반 코드: MATH2024');
  
} catch (error) {
  if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    console.log('\n⚠️  샘플 데이터가 이미 존재합니다.');
  } else {
    console.error('에러:', error.message);
  }
}

db.close();
console.log('\n✅ 데이터베이스 초기화 완료!');
