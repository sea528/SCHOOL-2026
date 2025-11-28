import React, { useState } from 'react';
import { Button } from './Button';
import { AlertCircle, Loader2 } from 'lucide-react';
import { UserType } from '../types';

interface RegisterScreenProps {
  userType: UserType;
  onRegisterSuccess: (userData: any) => void;
  onSwitchToLogin: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ 
  userType, 
  onRegisterSuccess, 
  onSwitchToLogin 
}) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    // 학생 전용
    grade: '',
    studentNumber: '',
    // 교사 전용
    subject: '',
    department: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 비밀번호 확인
    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (formData.password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    setLoading(true);

    try {
      const requestBody = {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        userType: userType,
        ...(userType === 'STUDENT' && {
          grade: formData.grade,
          studentNumber: formData.studentNumber,
        }),
        ...(userType === 'TEACHER' && {
          subject: formData.subject,
          department: formData.department,
        }),
      };

      const response = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '회원가입에 실패했습니다.');
      }

      // 토큰 저장
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user_data', JSON.stringify(data.user));

      onRegisterSuccess(data.user);
    } catch (err: any) {
      setError(err.message || '회원가입 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-6 bg-white overflow-y-auto">
      <div className="flex-1">
        <h1 className="text-[28px] font-bold text-text-main leading-[36px] mb-2">
          {userType === 'STUDENT' ? '학생' : '교사'} 회원가입
        </h1>
        <p className="text-[15px] text-text-main leading-[22px] mb-6">
          갓생스쿨과 함께 성장을 시작하세요
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* 공통 필드 */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-text-main mb-2">
              이름 *
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="홍길동"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-main focus:border-transparent outline-none"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-text-main mb-2">
              이메일 *
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="example@email.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-main focus:border-transparent outline-none"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-text-main mb-2">
              비밀번호 *
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="최소 6자 이상"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-main focus:border-transparent outline-none"
              required
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-main mb-2">
              비밀번호 확인 *
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="비밀번호를 다시 입력하세요"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-main focus:border-transparent outline-none"
              required
            />
          </div>

          {/* 학생 전용 필드 */}
          {userType === 'STUDENT' && (
            <>
              <div>
                <label htmlFor="grade" className="block text-sm font-medium text-text-main mb-2">
                  학년
                </label>
                <input
                  id="grade"
                  name="grade"
                  type="text"
                  value={formData.grade}
                  onChange={handleChange}
                  placeholder="예: 2학년"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-main focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label htmlFor="studentNumber" className="block text-sm font-medium text-text-main mb-2">
                  학번
                </label>
                <input
                  id="studentNumber"
                  name="studentNumber"
                  type="text"
                  value={formData.studentNumber}
                  onChange={handleChange}
                  placeholder="예: 20231"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-main focus:border-transparent outline-none"
                />
              </div>
            </>
          )}

          {/* 교사 전용 필드 */}
          {userType === 'TEACHER' && (
            <>
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-text-main mb-2">
                  담당 과목
                </label>
                <input
                  id="subject"
                  name="subject"
                  type="text"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="예: 수학"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-main focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label htmlFor="department" className="block text-sm font-medium text-text-main mb-2">
                  소속 학과
                </label>
                <input
                  id="department"
                  name="department"
                  type="text"
                  value={formData.department}
                  onChange={handleChange}
                  placeholder="예: 수학과"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-main focus:border-transparent outline-none"
                />
              </div>
            </>
          )}

          <div className="pt-4">
            <Button 
              type="submit" 
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  회원가입 중...
                </span>
              ) : (
                '회원가입'
              )}
            </Button>
          </div>
        </form>

        <div className="mt-6 text-center mb-8">
          <p className="text-sm text-muted-text mb-2">
            이미 계정이 있으신가요?
          </p>
          <Button variant="link" onClick={onSwitchToLogin}>
            로그인하기
          </Button>
        </div>
      </div>
    </div>
  );
};
