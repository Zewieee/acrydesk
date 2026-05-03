import { useState } from 'react';
import { registerAPI } from '../api/auth';
import { User, Mail, Lock, Phone, ArrowRight, ArrowLeft, Loader2, Rocket } from 'lucide-react';
import toast from 'react-hot-toast';

const VN_PHONE_REGEX = /^(03|05|07|08|09)\d{8}$/;

export default function Register({
  onSwitchToLogin,
  onBack,
}: {
  onSwitchToLogin: () => void;
  onBack: () => void;
}) {
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '', phone: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.email || !form.password) {
      toast.error('Vui lòng điền các trường bắt buộc');
      return;
    }

    if (!form.email.endsWith('@acrydesk.com')) {
      toast.error('Email phải có định dạng @acrydesk.com');
      return;
    }

    if (form.phone && !VN_PHONE_REGEX.test(form.phone)) {
      toast.error('Số điện thoại không đúng định dạng VN (10 số, đầu 03,05,07,08,09)');
      return;
    }

    if (form.password.length < 6 || form.password.length > 20) {
      toast.error('Mật khẩu phải từ 6 đến 20 ký tự');
      return;
    }

    if (form.password !== form.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }

    setLoading(true);
    try {
      await registerAPI({
        name: form.fullName,
        email: form.email,
        password: form.password,
        phone: form.phone
      });
      toast.success('Đăng ký thành công! Hãy đăng nhập để tiếp tục.');
      onSwitchToLogin();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Chỉ giữ lại số
    if (value.length <= 10) {
      setForm({ ...form, phone: value });
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-6 lg:p-12 bg-slate-50 font-sans overflow-hidden">
      {/* Premium Light Background Elements */}
      <div className="absolute inset-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[60vw] h-[60vw] lg:w-[40vw] lg:h-[40vw] bg-emerald-300/30 blur-[120px] rounded-full mix-blend-multiply opacity-60 animate-pulse" style={{ animationDuration: '10s' }} />
        <div className="absolute bottom-[-10%] left-[-10%] w-[60vw] h-[60vw] lg:w-[40vw] lg:h-[40vw] bg-teal-300/30 blur-[130px] rounded-full mix-blend-multiply opacity-60" />
        <div className="absolute inset-0 bg-white/40" />
      </div>

      <div className="w-full max-w-[540px] relative z-10 mt-8 mb-8">
        <button
          onClick={onBack}
          className="group flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6 transition-colors text-sm font-semibold w-fit outline-none"
        >
          <div className="p-2 rounded-xl bg-white border border-slate-200 group-hover:border-slate-300 shadow-sm transition-colors">
            <ArrowLeft size={16} />
          </div>
          Quay lại trang chủ
        </button>

        <div className="bg-white/70 backdrop-blur-2xl rounded-[2rem] p-8 lg:p-10 border border-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] relative overflow-hidden">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-400 blur-xl opacity-30 rounded-full" />
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center relative border border-white/20 shadow-xl shadow-emerald-500/20">
                <Rocket className="text-white w-8 h-8" />
              </div>
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-3 tracking-tight">Tạo Tài Khoản</h1>
            <p className="text-slate-500 text-sm font-medium">Đăng ký để sử dụng đầy đủ các tiện ích</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 ml-1 tracking-wider uppercase">Họ và tên *</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    placeholder="Nguyễn Văn A"
                    className="w-full bg-white border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-2xl py-3.5 pl-11 pr-4 text-slate-900 placeholder-slate-400 transition-all outline-none font-medium text-sm shadow-sm"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 ml-1 tracking-wider uppercase">Email *</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="name@acrydesk.com"
                    className="w-full bg-white border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-2xl py-3.5 pl-11 pr-4 text-slate-900 placeholder-slate-400 transition-all outline-none font-medium text-sm shadow-sm"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 ml-1 tracking-wider uppercase">Số điện thoại</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.phone}
                  onChange={handlePhoneChange}
                  placeholder="0xxxxxxxxx"
                  maxLength={10}
                  className="w-full bg-white border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-2xl py-3.5 pl-11 pr-4 text-slate-900 placeholder-slate-400 transition-all outline-none font-medium text-sm shadow-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 ml-1 tracking-wider uppercase">Mật khẩu *</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full bg-white border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-2xl py-3.5 pl-11 pr-4 text-slate-900 placeholder-slate-400 transition-all outline-none font-medium text-sm shadow-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 ml-1 tracking-wider uppercase">Xác nhận MK *</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    placeholder="••••••••"
                    className="w-full bg-white border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-2xl py-3.5 pl-11 pr-4 text-slate-900 placeholder-slate-400 transition-all outline-none font-medium text-sm shadow-sm"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-3 mt-6 group outline-none"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span className="tracking-wide">Đăng Ký Tài Khoản</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col gap-4 text-center">
            <p className="text-slate-500 text-sm font-medium">
              Bạn đã có tài khoản?{' '}
              <button
                onClick={onSwitchToLogin}
                className="text-emerald-600 hover:text-emerald-700 font-bold transition-colors ml-1 outline-none"
              >
                Đăng nhập
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}