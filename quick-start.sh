#!/bin/bash

echo "🚀 갓생스쿨 로그인 시스템 설정 시작..."
echo ""

# 백엔드 설정
echo "📦 백엔드 패키지 설치 중..."
cd server
npm install

if [ $? -eq 0 ]; then
    echo "✅ 백엔드 패키지 설치 완료"
else
    echo "❌ 백엔드 패키지 설치 실패"
    exit 1
fi

echo ""
echo "🗄️ 데이터베이스 초기화 중..."
npm run init-db

if [ $? -eq 0 ]; then
    echo "✅ 데이터베이스 초기화 완료"
else
    echo "❌ 데이터베이스 초기화 실패"
    exit 1
fi

echo ""
echo "=====================================";
echo "✨ 설정이 완료되었습니다!"
echo "=====================================";
echo ""
echo "서버를 시작하려면:"
echo "  cd server && npm run dev"
echo ""
echo "테스트 계정:"
echo "  교사: teacher@example.com / password123"
echo "  학생: student1@example.com / password123"
echo ""
echo "API 서버: http://localhost:3001"
echo "=====================================";
