// src/App.tsx
import { useState } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import CustomerDashboard from './pages/CustomerDashboard';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import { Toaster } from 'react-hot-toast';

function App() {
  type Page = 'home' | 'login' | 'register' | 'forgot' | 'dashboard' | 'catalog';
  const [history, setHistory] = useState<Page[]>(['home']);

  // Khởi tạo trạng thái đăng nhập từ localStorage
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return !!localStorage.getItem('accessToken');
  });

  const page = history[history.length - 1] ?? 'home';

  const navigate = (next: Page) => {
    setHistory((prev) => (prev[prev.length - 1] === next ? prev : [...prev, next]));
  };

  const goBack = () => {
    setHistory((prev) => {
      if (prev.length <= 1) return prev;
      return prev.slice(0, -1);
    });
  };

  // Khi đăng nhập thành công
  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  // Đăng xuất
  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setHistory(['home']);
  };

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      {(() => {
        if (isLoggedIn) {
          const storedUser = localStorage.getItem('user');
          const user = storedUser ? JSON.parse(storedUser) : null;
          const role = user?.role;

          if (role === 'customer') {
            return <CustomerDashboard onLogout={handleLogout} />;
          }
          return <Dashboard onLogout={handleLogout} />;
        }

        switch (page) {
          case 'home':
            return (
              <Home
                onGoLogin={() => navigate('login')}
                onGoRegister={() => navigate('register')}
                onGoCatalog={() => navigate('catalog')}
              />
            );
          case 'register':
            return <Register onSwitchToLogin={() => navigate('login')} onBack={goBack} />;
          case 'forgot':
            return <ForgotPassword onBack={goBack} />;
          case 'catalog':
            return (
              <Catalog 
                onGoLogin={() => navigate('login')}
                onGoRegister={() => navigate('register')}
                onBack={goBack}
              />
            );
          default:
            return (
              <Login
                onLogin={handleLoginSuccess}
                onSwitchToRegister={() => navigate('register')}
                onSwitchToForgot={() => navigate('forgot')}
                onBack={goBack}
              />
            );
        }
      })()}
    </>
  );
}

export default App;