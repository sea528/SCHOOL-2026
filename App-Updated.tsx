// App.tsx 시작 부분에 추가할 import 및 Screen enum 업데이트

import { LoginScreen } from './components/LoginScreen';
import { RegisterScreen } from './components/RegisterScreen';

// types.ts에 추가할 Screen enum 값:
// LOGIN = 'LOGIN',
// REGISTER = 'REGISTER',

// App 컴포넌트의 시작 부분에 추가
function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.WELCOME);
  const [userType, setUserType] = useState<UserType>(UserType.GUEST);
  const [userData, setUserData] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 컴포넌트 마운트 시 로그인 상태 확인
  React.useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('user_data');
    
    if (token && storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setUserData(user);
        setUserType(user.userType as UserType);
        setIsAuthenticated(true);
        
        // 사용자 타입에 따라 적절한 화면으로 이동
        if (user.userType === 'TEACHER') {
          setCurrentScreen(Screen.TEACHER_DASHBOARD);
        } else if (user.userType === 'STUDENT') {
          setCurrentScreen(Screen.CLASS_JOIN);
        }
      } catch (error) {
        console.error('사용자 데이터 파싱 오류:', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
      }
    }
  }, []);

  const handleLoginSuccess = (user: any) => {
    setUserData(user);
    setUserType(user.userType as UserType);
    setIsAuthenticated(true);
    
    // 사용자 타입에 따라 적절한 화면으로 이동
    if (user.userType === 'TEACHER') {
      setCurrentScreen(Screen.TEACHER_DASHBOARD);
    } else if (user.userType === 'STUDENT') {
      setCurrentScreen(Screen.CLASS_JOIN);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    setUserData(null);
    setIsAuthenticated(false);
    setCurrentScreen(Screen.WELCOME);
  };

  // WelcomeScreen 수정
  const renderWelcomeScreen = () => (
    <div className="flex flex-col h-full p-6 bg-white">
      <div className="flex-1 flex flex-col justify-center">
        <h1 className="text-[28px] font-bold text-text-main leading-[36px] mb-4">
          갓생스쿨에 오신 것을<br />환영합니다
        </h1>
        <p className="text-[15px] text-text-main leading-[22px] mb-8">
          작은 습관이 큰 성장을 만듭니다.<br />
          3분 갓생클래스와 챌린지로 오늘의<br />
          한 걸음을 시작하세요.
        </p>
      </div>
      <div className="flex flex-col gap-3 mb-8">
        <Button onClick={() => setCurrentScreen(Screen.LOGIN)}>로그인</Button>
        <Button 
          variant="secondary" 
          onClick={() => setCurrentScreen(Screen.ACCOUNT_SELECTION)}
        >
          회원가입
        </Button>
        <div className="text-center mt-4">
          <Button 
            variant="link" 
            onClick={() => {
              setUserType(UserType.GUEST);
              setCurrentScreen(Screen.DEMO_VIDEO);
            }}
          >
            게스트로 둘러보기
          </Button>
        </div>
      </div>
    </div>
  );

  // AccountSelectionScreen 수정 - 회원가입 화면으로 연결
  const renderAccountSelectionScreen = () => (
    <div className="flex flex-col h-full p-6 bg-white">
      <h1 className="text-[28px] font-bold text-text-main leading-[36px] mb-8">
        계정 유형을<br />선택하세요
      </h1>
      
      <div className="flex flex-col gap-4">
        <button
          onClick={() => {
            setUserType(UserType.STUDENT);
            setCurrentScreen(Screen.REGISTER);
          }}
          className="w-full p-5 text-left rounded-[12px] border-2 transition-all border-card-border bg-white text-text-main hover:border-primary/50"
        >
          학생으로 가입하기
        </button>
        <button
          onClick={() => {
            setUserType(UserType.TEACHER);
            setCurrentScreen(Screen.REGISTER);
          }}
          className="w-full p-5 text-left rounded-[12px] border-2 transition-all border-card-border bg-white text-text-main hover:border-primary/50"
        >
          교사로 가입하기
        </button>
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm text-muted-text mb-2">
          이미 계정이 있으신가요?
        </p>
        <Button variant="link" onClick={() => setCurrentScreen(Screen.LOGIN)}>
          로그인하기
        </Button>
      </div>
    </div>
  );

  // Screen 렌더링 switch문에 추가
  const renderScreen = () => {
    switch (currentScreen) {
      case Screen.WELCOME:
        return renderWelcomeScreen();
      
      case Screen.LOGIN:
        return (
          <LoginScreen
            onLoginSuccess={handleLoginSuccess}
            onSwitchToRegister={() => setCurrentScreen(Screen.ACCOUNT_SELECTION)}
          />
        );
      
      case Screen.REGISTER:
        return (
          <RegisterScreen
            userType={userType}
            onRegisterSuccess={handleLoginSuccess}
            onSwitchToLogin={() => setCurrentScreen(Screen.LOGIN)}
          />
        );
      
      case Screen.ACCOUNT_SELECTION:
        return renderAccountSelectionScreen();
      
      // 나머지 기존 화면들...
      default:
        return renderWelcomeScreen();
    }
  };

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* 상단 헤더 - 로그인된 경우 표시 */}
      {isAuthenticated && userData && (
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <p className="text-sm text-muted-text">
              {userData.userType === 'TEACHER' ? '교사' : '학생'}
            </p>
            <p className="font-semibold">{userData.name}님</p>
          </div>
          <Button variant="link" onClick={handleLogout}>
            로그아웃
          </Button>
        </div>
      )}

      <div className="flex-1 overflow-auto">
        {renderScreen()}
      </div>

      {/* 하단 네비게이션 */}
      {isAuthenticated && (
        <BottomNav
          currentScreen={currentScreen}
          userType={userType}
          onNavigate={setCurrentScreen}
        />
      )}
    </div>
  );
}

export default App;
