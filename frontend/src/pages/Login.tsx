import { useState } from 'react';
import { loginAPI } from '../api/auth';
import { Mail, Lock, ArrowRight, ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login({
  onLogin,
  onSwitchToRegister,
  onSwitchToForgot,
  onBack,
}: {
  onLogin: () => void;
  onSwitchToRegister: () => void;
  onSwitchToForgot: () => void;
  onBack: () => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    setLoading(true);
    try {
      const data = await loginAPI(email, password);
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      toast.success('Chào mừng bạn quay trở lại!');
      onLogin();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-6 lg:p-12 bg-slate-50 font-sans overflow-hidden">
      {/* Premium Light Background Elements */}
      <div className="absolute inset-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] lg:w-[40vw] lg:h-[40vw] bg-blue-300/30 blur-[120px] rounded-full mix-blend-multiply opacity-60 animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] lg:w-[40vw] lg:h-[40vw] bg-indigo-300/30 blur-[130px] rounded-full mix-blend-multiply opacity-60" />
        <div className="absolute inset-0 bg-white/40" />
      </div>

      <div className="w-full max-w-[480px] relative z-10">
        <button
          onClick={onBack}
          className="group flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-8 transition-colors text-sm font-semibold w-fit outline-none"
        >
          <div className="p-2 rounded-xl bg-white border border-slate-200 group-hover:border-slate-300 shadow-sm transition-colors">
            <ArrowLeft size={16} />
          </div>
          Quay lại trang chủ
        </button>

        <div className="bg-white/70 backdrop-blur-2xl rounded-[2rem] p-8 lg:p-10 border border-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] relative overflow-hidden">
          <div className="flex items-center justify-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-400 blur-xl opacity-30 rounded-full" />
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center relative border border-white/20 shadow-xl shadow-blue-500/20">
                <Sparkles className="text-white w-8 h-8" />
              </div>
            </div>
          </div>

          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-slate-900 mb-3 tracking-tight">Chào Mừng Trở Lại</h1>
            <p className="text-slate-500 text-sm font-medium">Đăng nhập vào hệ thống quản lý AcryDesk</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Địa chỉ Email</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@acrydesk.com"
                  className="w-full bg-white border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl py-4 pl-12 pr-4 text-slate-900 placeholder-slate-400 transition-all outline-none font-medium text-sm shadow-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-sm font-bold text-slate-700">Mật khẩu</label>
                <button
                  type="button"
                  onClick={onSwitchToForgot}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors outline-none"
                >
                  Quên mật khẩu?
                </button>
              </div>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl py-4 pl-12 pr-4 text-slate-900 placeholder-slate-400 transition-all outline-none font-medium text-sm shadow-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-3 mt-8 group outline-none"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span className="tracking-wide">Đăng Nhập Ngay</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-slate-100 flex flex-col gap-4 text-center">
            <p className="text-slate-500 text-sm font-medium">
              Chưa có tài khoản?{' '}
              <button
                onClick={onSwitchToRegister}
                className="text-blue-600 hover:text-blue-700 font-bold transition-colors ml-1 outline-none"
              >
                Đăng ký ngay
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}