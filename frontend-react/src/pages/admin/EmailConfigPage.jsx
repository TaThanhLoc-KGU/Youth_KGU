import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
  Mail, Server, Key, User, Send, CheckCircle, XCircle,
  Info, Eye, EyeOff, Loader2, Settings, RefreshCw, Shield,
  AlertCircle, Globe, Lock
} from 'lucide-react';
import emailConfigService from '../../services/emailConfigService';

export default function EmailConfigPage() {
  const qc = useQueryClient();
  const [showPass, setShowPass] = useState(false);
  const [testResult, setTestResult] = useState(null); // null | 'ok' | 'fail'
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
        smtpHost: config.smtpHost || 'smtp.gmail.com',
        smtpPort: config.smtpPort || 587,
        username: config.username || '',
        matKhau: '',  // don't pre-fill password
        fromAddress: config.fromAddress || '',
        fromName: config.fromName || 'Đoàn Trường ĐH Kiên Giang',
        tlsEnabled: config.tlsEnabled ?? true,
        sslEnabled: config.sslEnabled ?? false,
        kichHoat: config.kichHoat ?? false,
        ghiChu: config.ghiChu || '',
      });
    }
  }, [config]);

  const saveMutation = useMutation({
    mutationFn: (data) => emailConfigService.saveCauHinh(data),
    onSuccess: () => {
      toast.success('Lưu cấu hình email thành công!');
      qc.invalidateQueries({ queryKey: ['cau-hinh-email'] });
    },
    onError: (err) => toast.error('Lỗi: ' + (err.response?.data?.message || err.message)),
  });

  const testMutation = useMutation({
    mutationFn: () => emailConfigService.testConnection(),
    onSuccess: (res) => {
      if (res?.data?.connected) {
        setTestResult('ok');
        toast.success('Kết nối SMTP thành công!');
      } else {
        setTestResult('fail');
        toast.error('Không thể kết nối SMTP: ' + (res?.message || 'Lỗi không xác định'));
      }
    },
    onError: (err) => {
      setTestResult('fail');
      toast.error('Lỗi kết nối: ' + (err.response?.data?.message || err.message));
    },
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : (name === 'smtpPort' ? Number(value) : value) }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(form);
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Mail className="w-6 h-6 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Cấu hình Email</h1>
        </div>
        <p className="text-gray-500 ml-11">
          Thiết lập SMTP để hệ thống gửi email thông báo tự động cho sinh viên và cán bộ.
        </p>
        {config?.updatedAt && (
          <p className="text-xs text-gray-400 ml-11 mt-1">
            Cập nhật lần cuối: {new Date(config.updatedAt).toLocaleString('vi-VN')}
            {config.updatedBy && ` bởi ${config.updatedBy}`}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Kích hoạt toggle */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${form.kichHoat ? 'bg-green-100' : 'bg-gray-100'}`}>
                    <Send className={`w-5 h-5 ${form.kichHoat ? 'text-green-600' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Kích hoạt gửi email</p>
                    <p className="text-sm text-gray-500">
                      {form.kichHoat ? 'Đang gửi email thật qua SMTP' : 'Chỉ log ra console (an toàn khi test)'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, kichHoat: !f.kichHoat }))}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${form.kichHoat ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                  <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${form.kichHoat ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              {!form.kichHoat && (
                <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-yellow-700">Email đang tắt. Bật để hệ thống gửi email thông báo thật sự.</p>
                </div>
              )}
            </div>

            {/* SMTP Settings */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Server className="w-4 h-4 text-gray-500" /> Cài đặt SMTP
              </h3>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Host</label>
                  <input
                    type="text" name="smtpHost" value={form.smtpHost} onChange={handleChange}
                    placeholder="smtp.gmail.com"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Port</label>
                  <input
                    type="number" name="smtpPort" value={form.smtpPort} onChange={handleChange}
                    placeholder="587"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="tlsEnabled" checked={form.tlsEnabled} onChange={handleChange} className="rounded" />
                  <span className="text-sm text-gray-700">STARTTLS (port 587)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="sslEnabled" checked={form.sslEnabled} onChange={handleChange} className="rounded" />
                  <span className="text-sm text-gray-700">SSL/TLS (port 465)</span>
                </label>
              </div>

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
                  <span className="ml-2 text-xs text-blue-600 font-normal">
                    (Gmail: dùng App Password)
                  </span>
                </label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    name="matKhau" value={form.matKhau} onChange={handleChange}
                    placeholder="Nhập mật khẩu mới (để trống = giữ nguyên)"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Sender Info */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-500" /> Thông tin người gửi
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ email gửi (From)</label>
                <input
                  type="email" name="fromAddress" value={form.fromAddress} onChange={handleChange}
                  placeholder="noreply@kgu.edu.vn"
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
                rows={3} placeholder="Ghi chú về cấu hình này..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => testMutation.mutate()}
                disabled={testMutation.isPending}
                className="flex items-center gap-2 px-4 py-2.5 border border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium disabled:opacity-50"
              >
                {testMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Test kết nối
                {testResult === 'ok' && <CheckCircle className="w-4 h-4 text-green-500" />}
                {testResult === 'fail' && <XCircle className="w-4 h-4 text-red-500" />}
              </button>

              <button
                type="submit"
                disabled={saveMutation.isPending}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg transition-colors text-sm font-semibold disabled:opacity-50"
              >
                {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Settings className="w-4 h-4" />}
                Lưu cấu hình
              </button>
            </div>
          </form>
        </div>

        {/* Right: Guide */}
        <div className="space-y-4">
          {/* Gmail guide */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Globe className="w-4 h-4 text-red-500" /> Cấu hình Gmail
            </h3>
            <ol className="space-y-2 text-sm text-gray-600">
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
                Chọn <em>Ứng dụng khác</em> → đặt tên → Tạo
              </li>
              <li className="flex gap-2">
                <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-700 rounded-full text-xs flex items-center justify-center font-bold">4</span>
                Dán mật khẩu 16 ký tự vào trường <strong>Mật khẩu</strong> ở đây
              </li>
            </ol>
            <div className="mt-3 p-3 bg-gray-50 rounded-lg text-xs text-gray-500 font-mono">
              Host: smtp.gmail.com<br />
              Port: 587 | STARTTLS: ✓
            </div>
          </div>

          {/* Outlook/365 guide */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Lock className="w-4 h-4 text-blue-600" /> Microsoft 365 / Outlook
            </h3>
            <div className="text-sm text-gray-600 space-y-2">
              <p>Dùng thông tin đăng nhập Microsoft 365:</p>
              <div className="p-3 bg-gray-50 rounded-lg text-xs text-gray-500 font-mono">
                Host: smtp.office365.com<br />
                Port: 587 | STARTTLS: ✓
              </div>
              <p className="text-xs text-gray-400">Lưu ý: Cần bật SMTP AUTH trong admin center của Microsoft 365.</p>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
            <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2 text-sm">
              <Info className="w-4 h-4" /> Lưu ý quan trọng
            </h3>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Mật khẩu được lưu trữ trong database. Đảm bảo DB được bảo mật.</li>
              <li>• Bấm "Test kết nối" trước khi bật để kiểm tra cài đặt.</li>
              <li>• Thay đổi có hiệu lực ngay, không cần khởi động lại server.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
