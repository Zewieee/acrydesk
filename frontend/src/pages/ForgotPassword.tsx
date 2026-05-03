import { useState } from 'react';
import { forgotPasswordAPI, resetPasswordAPI } from '../api/auth';
import { Mail, Key, ShieldCheck, ArrowRight, ArrowLeft, Loader2, Phone, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ForgotPassword({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState<'identity' | 'reset'>('identity');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 10) setPhone(value);
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !phone) {
      toast.error('Vui lòng nhập Email và Số điện thoại');
      return;
    }
    setLoading(true);
    try {
      const data = await forgotPasswordAPI(email, phone);
      toast.success(data.message);
      // Giả lập nhận mã: Trong lúc dev mã reset được trả về trong response
      if (data.resetToken) setToken(data.resetToken);
      setStep('reset');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }
    if (newPassword.length < 6 || newPassword.length > 20) {
      toast.error('Mật khẩu phải từ 6 đến 20 ký tự');
      return;
    }

    setLoading(true);
    try {
      await resetPasswordAPI({ token, newPassword });
      toast.success('Đổi mật khẩu thành công!');
      onBack();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Đổi mật khẩu thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-6 lg:p-12 bg-slate-50 font-sans overflow-hidden">
      {/* Premium Light Background Elements */}
      <div className="absolute inset-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[60vw] h-[60vw] lg:w-[40vw] lg:h-[40vw] bg-purple-300/30 blur-[120px] rounded-full mix-blend-multiply opacity-60 animate-pulse" style={{ animationDuration: '9s' }} />
        <div className="absolute bottom-[-10%] left-[-10%] w-[60vw] h-[60vw] lg:w-[40vw] lg:h-[40vw] bg-pink-300/30 blur-[130px] rounded-full mix-blend-multiply opacity-60" />
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
          Quay lại đăng nhập
        </button>

        <div className="bg-white/70 backdrop-blur-2xl rounded-[2rem] p-8 lg:p-10 border border-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] relative overflow-hidden">
          <div className="flex items-center justify-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-purple-400 blur-xl opacity-30 rounded-full" />
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center relative border border-white/20 shadow-xl shadow-purple-500/20">
                <Key className="text-white w-8 h-8" />
              </div>
            </div>
          </div>

          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-slate-900 mb-3 tracking-tight">Quên Mật Khẩu</h1>
            <p className="text-slate-500 text-sm font-medium">
              {step === 'identity' 
                ? 'Nhập thông tin tài khoản để nhận mã xác thực' 
                : 'Đặt mật khẩu mới cho tài khoản của bạn'}
            </p>
          </div>

          {step === 'identity' ? (
            <form onSubmit={handleRequestReset} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 ml-1 uppercase tracking-wider">Email tài khoản</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-600 transition-colors">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@acrydesk.com"
                    className="w-full bg-white border border-slate-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 rounded-2xl py-3.5 pl-12 pr-4 text-slate-900 placeholder-slate-400 transition-all outline-none font-medium text-sm shadow-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 ml-1 uppercase tracking-wider">Số điện thoại</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-600 transition-colors">
                    <Phone className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={phone}
                    onChange={handlePhoneChange}
                    maxLength={10}
                    placeholder="0xxxxxxxxx"
                    className="w-full bg-white border border-slate-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 rounded-2xl py-3.5 pl-12 pr-4 text-slate-900 placeholder-slate-400 transition-all outline-none font-medium text-sm shadow-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 disabled:opacity-50 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-lg shadow-purple-500/25 flex items-center justify-center gap-3 mt-8 group outline-none"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    <span className="tracking-wide">Nhận Mã Xác Nhận</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-5">
               <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 ml-1 uppercase tracking-wider">Mã xác thực (OTP)</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-600 transition-colors">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Nhập mã xác thực"
                    className="w-full bg-white border border-slate-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 rounded-2xl py-3.5 pl-12 pr-4 text-slate-900 placeholder-slate-400 transition-all outline-none font-medium text-sm text-center tracking-[0.5em] shadow-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 ml-1 uppercase tracking-wider">Mật khẩu mới</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-600 transition-colors">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white border border-slate-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 rounded-2xl py-3.5 pl-12 pr-4 text-slate-900 placeholder-slate-400 transition-all outline-none font-medium text-sm shadow-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 ml-1 uppercase tracking-wider">Xác nhận mật khẩu</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-600 transition-colors">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white border border-slate-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 rounded-2xl py-3.5 pl-12 pr-4 text-slate-900 placeholder-slate-400 transition-all outline-none font-medium text-sm shadow-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-3 mt-8 group outline-none"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    <span className="tracking-wide">Lưu Mật Khẩu</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep('identity')}
                className="w-full text-slate-500 hover:text-slate-900 text-xs font-medium mt-4 transition-colors outline-none"
              >
                Gửi lại mã hoặc dùng tài khoản khác
              </button>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-slate-400 text-[10px] leading-relaxed px-4 uppercase tracking-widest font-bold">
              Bảo mật đa tầng bởi AcryDesk Secure. Mã OTP hiệu lực trong 30 phút.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}