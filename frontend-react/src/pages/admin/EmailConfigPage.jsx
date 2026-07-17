import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
  Mail, Server, Key, User, Send, CheckCircle, XCircle,
  Info, Eye, EyeOff, Loader2, Settings, RefreshCw, Shield,
  AlertCircle, Globe, Lock, Wifi, WifiOff, FlaskConical,
} from 'lucide-react';
import emailConfigService from '../../services/emailConfigService';

// ─── Status badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ kichHoat, updatedAt, updatedBy }) => (
  <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
    kichHoat
      ? 'bg-green-50 border-green-200 text-green-800'
      : 'bg-gray-50 border-gray-200 text-gray-600'
  }`}>
    {kichHoat
      ? <Wifi className="w-5 h-5 text-green-600 shrink-0" />
      : <WifiOff className="w-5 h-5 text-gray-400 shrink-0" />}
    <div className="min-w-0">
      <p className="font-semibold text-sm">
        {kichHoat ? 'Email đang hoạt động — gửi thật qua SMTP' : 'Email đang tắt — chỉ log console'}
      </p>
      {updatedAt && (
        <p className="text-xs opacity-70 truncate">
          Cập nhật {new Date(updatedAt).toLocaleString('vi-VN')}
          {updatedBy ? ` · ${updatedBy}` : ''}
        </p>
      )}
    </div>
  </div>
);

export default function EmailConfigPage() {
  const qc = useQueryClient();
  const [showPass, setShowPass] = useState(false);
  const [smtpResult, setSmtpResult] = useState(null); // null | 'ok' | 'fail'
  const [testEmailTo, setTestEmailTo] = useState('');
  const [form, setForm] = useState({
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    username: '',
    matKhau: '',
    fromAddress: '',
    fromName: 'Đoàn Trường ĐH Kiên Giang',
    tlsEnabled: true,
    sslEnabled: false,
    kichHoat: false,
    ghiChu: '',
  });

  const { data: config, isLoading } = useQuery({
    queryKey: ['cau-hinh-email'],
    queryFn: emailConfigService.getCauHinh,
  });

  useEffect(() => {
    if (config) {
      setForm({
        smtpHost:    config.smtpHost    || 'smtp.gmail.com',
        smtpPort:    config.smtpPort    || 587,
        username:    config.username    || '',
        matKhau:     '',               // không pre-fill password
        fromAddress: config.fromAddress || '',
        fromName:    config.fromName    || 'Đoàn Trường ĐH Kiên Giang',
        tlsEnabled:  config.tlsEnabled  ?? true,
        sslEnabled:  config.sslEnabled  ?? false,
        kichHoat:    config.kichHoat    ?? false,
        ghiChu:      config.ghiChu      || '',
      });
      setSmtpResult(null); // reset kết quả test khi load config mới
    }
  }, [config]);

  // Reset kết quả test khi user thay đổi form (config có thể không khớp)
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : (name === 'smtpPort' ? Number(value) : value) }));
    setSmtpResult(null);
  };

  const saveMutation = useMutation({
    mutationFn: (data) => emailConfigService.saveCauHinh(data),
    onSuccess: () => {
      toast.success('Lưu cấu hình email thành công!');
      qc.invalidateQueries({ queryKey: ['cau-hinh-email'] });
    },
    onError: (err) => toast.error('Lỗi: ' + (err.response?.data?.message || err.message)),
  });

  const testSmtpMutation = useMutation({
    mutationFn: () => emailConfigService.testConnection(),
    onSuccess: (res) => {
      if (res?.data?.connected) {
        setSmtpResult('ok');
        toast.success('Kết nối SMTP thành công!');
      } else {
        setSmtpResult('fail');
        toast.error('Không kết nối được: ' + (res?.message || 'Lỗi không xác định'));
      }
    },
    onError: (err) => {
      setSmtpResult('fail');
      toast.error('Lỗi: ' + (err.response?.data?.message || err.message));
    },
  });

  const sendTestEmailMutation = useMutation({
    mutationFn: (to) => emailConfigService.sendTestEmail(to),
    onSuccess: (res) => {
      if (res?.data?.sent) {
        toast.success(`Đã gửi email thử đến ${res.data.to}! Kiểm tra hộp thư.`);
      } else {
        toast.error(res?.message || 'Gửi thất bại');
      }
    },
    onError: (err) => toast.error('Gửi thất bại: ' + (err.response?.data?.message || err.message)),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.fromAddress.trim()) {
      toast.error('Vui lòng điền địa chỉ email gửi (From)');
      return;
    }
    saveMutation.mutate(form);
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">

      {/* ─── Header ────────────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Mail className="w-6 h-6 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Cấu hình Email</h1>
        </div>
        <p className="text-gray-500 ml-11 text-sm">
          Thiết lập SMTP để hệ thống gửi email thông báo tự động cho sinh viên và cán bộ.
        </p>
      </div>

      {/* ─── Status bar ────────────────────────────────────────────────────── */}
      {config && (
        <StatusBadge
          kichHoat={config.kichHoat}
          updatedAt={config.updatedAt}
          updatedBy={config.updatedBy}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ─── LEFT: Form ──────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Toggle kích hoạt */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${form.kichHoat ? 'bg-green-100' : 'bg-gray-100'}`}>
                    <Send className={`w-5 h-5 ${form.kichHoat ? 'text-green-600' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Kích hoạt gửi email</p>
                    <p className="text-sm text-gray-500">
                      {form.kichHoat
                        ? 'Hệ thống sẽ gửi email thật qua SMTP'
                        : 'Tắt — email chỉ được ghi log, không gửi thật'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setForm(f => ({ ...f, kichHoat: !f.kichHoat })); setSmtpResult(null); }}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${form.kichHoat ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                  <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${form.kichHoat ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              {!form.kichHoat && (
                <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-700">
                    Email đang tắt. Bật và lưu để hệ thống gửi thông báo tự động.
                  </p>
                </div>
              )}
            </div>

            {/* SMTP Settings */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-sm uppercase tracking-wide text-gray-500">
                <Server className="w-4 h-4" /> Máy chủ SMTP
              </h3>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Host <span className="text-red-500">*</span></label>
                  <input
                    type="text" name="smtpHost" value={form.smtpHost} onChange={handleChange}
                    placeholder="smtp.gmail.com" required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Port <span className="text-red-500">*</span></label>
                  <input
                    type="number" name="smtpPort" value={form.smtpPort} onChange={handleChange}
                    placeholder="587" required min={1} max={65535}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* TLS/SSL quick presets */}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, smtpPort: 587, tlsEnabled: true, sslEnabled: false }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    form.smtpPort === 587 && form.tlsEnabled && !form.sslEnabled
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Port 587 · STARTTLS
                </button>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, smtpPort: 465, tlsEnabled: false, sslEnabled: true }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    form.smtpPort === 465 && !form.tlsEnabled && form.sslEnabled
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Port 465 · SSL/TLS
                </button>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, smtpPort: 25, tlsEnabled: false, sslEnabled: false }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    form.smtpPort === 25
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Port 25 · Plain
                </button>
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="tlsEnabled" checked={form.tlsEnabled} onChange={handleChange} className="rounded text-blue-600" />
                  <span className="text-sm text-gray-700">STARTTLS</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="sslEnabled" checked={form.sslEnabled} onChange={handleChange} className="rounded text-blue-600" />
                  <span className="text-sm text-gray-700">SSL/TLS</span>
                </label>
              </div>
            </div>

            {/* Auth */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <h3 className="font-semibold text-sm uppercase tracking-wide text-gray-500 flex items-center gap-2">
                <Shield className="w-4 h-4" /> Xác thực
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <User className="inline w-3.5 h-3.5 mr-1" />Username / Email
                </label>
                <input
                  type="email" name="username" value={form.username} onChange={handleChange}
                  placeholder="your-email@gmail.com"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Key className="inline w-3.5 h-3.5 mr-1" />Mật khẩu
                  <span className="ml-2 text-xs text-blue-600 font-normal">(Gmail: dùng App Password 16 ký tự)</span>
                </label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    name="matKhau" value={form.matKhau} onChange={handleChange}
                    placeholder="Để trống = giữ mật khẩu hiện tại"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Sender */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <h3 className="font-semibold text-sm uppercase tracking-wide text-gray-500 flex items-center gap-2">
                <Mail className="w-4 h-4" /> Người gửi (From)
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Địa chỉ email gửi <span className="text-red-500">*</span>
                </label>
                <input
                  type="email" name="fromAddress" value={form.fromAddress} onChange={handleChange}
                  placeholder="noreply@kgu.edu.vn" required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên hiển thị người gửi</label>
                <input
                  type="text" name="fromName" value={form.fromName} onChange={handleChange}
                  placeholder="Đoàn Trường ĐH Kiên Giang"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Ghi chú */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
              <textarea
                name="ghiChu" value={form.ghiChu} onChange={handleChange}
                rows={2} placeholder="Ghi chú về cấu hình này..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Actions */}
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-3 rounded-xl transition-colors text-sm font-semibold"
            >
              {saveMutation.isPending
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang lưu…</>
                : <><Settings className="w-4 h-4" /> Lưu cấu hình</>}
            </button>
          </form>

          {/* ─── Test zone (ngoài form) ─────────────────────────────────── */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-purple-500" /> Kiểm tra
              <span className="text-xs font-normal text-gray-400 ml-1">(dùng config đã lưu)</span>
            </h3>

            {/* Test SMTP kết nối */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">Test kết nối SMTP</p>
                <p className="text-xs text-gray-500">Kiểm tra TCP handshake với máy chủ SMTP</p>
              </div>
              <button
                type="button"
                onClick={() => testSmtpMutation.mutate()}
                disabled={testSmtpMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 border border-blue-400 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium disabled:opacity-50 shrink-0"
              >
                {testSmtpMutation.isPending
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : smtpResult === 'ok'
                    ? <CheckCircle className="w-4 h-4 text-green-500" />
                    : smtpResult === 'fail'
                      ? <XCircle className="w-4 h-4 text-red-500" />
                      : <RefreshCw className="w-4 h-4" />}
                {smtpResult === 'ok' ? 'Thành công' : smtpResult === 'fail' ? 'Thất bại' : 'Kiểm tra'}
              </button>
            </div>

            {/* Gửi email thử nghiệm */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Gửi email thử nghiệm</p>
              <p className="text-xs text-gray-500">Gửi email thật đến hộp thư để xác nhận hoạt động end-to-end</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={testEmailTo}
                  onChange={e => setTestEmailTo(e.target.value)}
                  placeholder="email@example.com"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!testEmailTo.trim()) { toast.warning('Nhập email nhận thử nghiệm'); return; }
                    sendTestEmailMutation.mutate(testEmailTo.trim());
                  }}
                  disabled={sendTestEmailMutation.isPending || !config?.kichHoat}
                  title={!config?.kichHoat ? 'Bật kích hoạt email và lưu trước' : ''}
                  className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors shrink-0"
                >
                  {sendTestEmailMutation.isPending
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Send className="w-4 h-4" />}
                  Gửi thử
                </button>
              </div>
              {!config?.kichHoat && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Cần bật "Kích hoạt gửi email" và lưu trước khi gửi thử
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ─── RIGHT: Guide ─────────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Gmail */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2 text-sm">
              <Globe className="w-4 h-4 text-red-500" /> Gmail
            </h3>
            <ol className="space-y-2.5 text-sm text-gray-600">
              <li className="flex gap-2">
                <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-700 rounded-full text-xs flex items-center justify-center font-bold">1</span>
                Bật xác minh 2 bước trong tài khoản Google
              </li>
              <li className="flex gap-2">
                <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-700 rounded-full text-xs flex items-center justify-center font-bold">2</span>
                Vào <strong>myaccount.google.com</strong> → Bảo mật → Mật khẩu ứng dụng
              </li>
              <li className="flex gap-2">
                <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-700 rounded-full text-xs flex items-center justify-center font-bold">3</span>
                Tạo App Password → dán 16 ký tự vào ô Mật khẩu
              </li>
            </ol>
            <div className="mt-3 p-3 bg-gray-50 rounded-lg text-xs text-gray-500 font-mono leading-5">
              Host: smtp.gmail.com<br />
              Port: 587 · STARTTLS ✓
            </div>
          </div>

          {/* Outlook */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2 text-sm">
              <Lock className="w-4 h-4 text-blue-600" /> Microsoft 365
            </h3>
            <p className="text-sm text-gray-600 mb-2">Dùng thông tin đăng nhập Microsoft 365:</p>
            <div className="p-3 bg-gray-50 rounded-lg text-xs text-gray-500 font-mono leading-5">
              Host: smtp.office365.com<br />
              Port: 587 · STARTTLS ✓
            </div>
            <p className="text-xs text-gray-400 mt-2">Cần bật SMTP AUTH trong Microsoft 365 Admin Center.</p>
          </div>

          {/* Tips */}
          <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
            <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2 text-sm">
              <Info className="w-4 h-4" /> Lưu ý
            </h3>
            <ul className="text-xs text-blue-700 space-y-1.5">
              <li>• Lưu config trước, rồi mới test kết nối.</li>
              <li>• "Test SMTP" chỉ kiểm tra TCP — không xác nhận email thật sự gửi được.</li>
              <li>• "Gửi thử" mới là kiểm tra end-to-end thật sự.</li>
              <li>• Mật khẩu lưu trong DB — đảm bảo DB được bảo mật.</li>
              <li>• Thay đổi có hiệu lực ngay, không cần restart server.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
