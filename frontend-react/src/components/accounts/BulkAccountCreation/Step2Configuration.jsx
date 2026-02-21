import { useState } from 'react';
import { Info } from 'lucide-react';
import Button from '../../common/Button';
import Input from '../../common/Input';
import Alert from '../../common/Alert';

const Step2Configuration = ({
  onNext,
  onPrevious,
  isLoading = false,
  initialConfig = {},
  hasChucVu = false,
}) => {
  const [assignRoleFromBCH, setAssignRoleFromBCH] = useState(
    initialConfig.assignRoleFromBCH || false
  );
  const [sendWelcomeEmail, setSendWelcomeEmail] = useState(
    initialConfig.sendWelcomeEmail ?? true
  );
  const [defaultPassword, setDefaultPassword] = useState(
    initialConfig.defaultPassword || ''
  );

  const handleContinue = () => {
    const config = {
      assignRoleFromBCH: assignRoleFromBCH && hasChucVu,
      sendWelcomeEmail,
      defaultPassword: defaultPassword || null,
    };
    onNext?.(config);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Cấu hình tùy chọn tạo tài khoản
        </h3>
      </div>

      {/* Role Assignment Option */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <label className="flex items-start gap-4 cursor-pointer">
          <input
            type="checkbox"
            checked={assignRoleFromBCH && hasChucVu}
            onChange={(e) => setAssignRoleFromBCH(e.target.checked)}
            disabled={!hasChucVu || isLoading}
            className="mt-1"
          />
          <div className="flex-1">
            <p className="font-semibold text-gray-900">
              Phân role tự động từ Ban Chấp Hành
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Hệ thống sẽ tự động xác định vai trò dựa vào chức vụ trong Ban Chấp Hành.
              Nếu không có chức vụ, sẽ gán role mặc định (Sinh viên).
            </p>
            {hasChucVu && (
              <div className="mt-2 bg-blue-50 border border-blue-200 rounded p-3 flex gap-2">
                <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-900">
                  Đã phát hiện thông tin chức vụ trong dữ liệu. Bạn có thể bật tùy chọn này.
                </p>
              </div>
            )}
            {!hasChucVu && assignRoleFromBCH && (
              <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded p-3 flex gap-2">
                <Info className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-900">
                  Tùy chọn này sẽ không có hiệu lực do dữ liệu không chứa thông tin chức vụ.
                </p>
              </div>
            )}
          </div>
        </label>
      </div>

      {/* Email Notification Option */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <label className="flex items-start gap-4 cursor-pointer">
          <input
            type="checkbox"
            checked={sendWelcomeEmail}
            onChange={(e) => setSendWelcomeEmail(e.target.checked)}
            disabled={isLoading}
            className="mt-1"
          />
          <div className="flex-1">
            <p className="font-semibold text-gray-900">
              Gửi email thông báo
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Gửi tên đăng nhập và mật khẩu tạm thời về email của mỗi người dùng.
            </p>
          </div>
        </label>
      </div>

      {/* Default Password Option */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <label className="block">
          <p className="font-semibold text-gray-900 mb-2">
            Mật khẩu mặc định (tùy chọn)
          </p>
          <p className="text-sm text-gray-600 mb-3">
            Nếu không nhập, hệ thống sẽ tự động sinh mật khẩu ngẫu nhiên.
            Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ cái, số và ký tự đặc biệt.
          </p>
          <Input
            type="password"
            value={defaultPassword}
            onChange={(e) => setDefaultPassword(e.target.value)}
            placeholder="VD: TempPass@2025"
            disabled={isLoading}
          />
          {defaultPassword && !isValidPassword(defaultPassword) && (
            <Alert variant="warning" className="mt-2 text-sm">
              Mật khẩu không đáp ứng yêu cầu bảo mật.
            </Alert>
          )}
        </label>
      </div>

      {/* Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="space-y-2 text-sm text-blue-900">
          <p className="font-semibold">Tóm tắt cấu hình:</p>
          <ul className="space-y-1 ml-4">
            <li>• Phân role tự động: <span className="font-medium">{assignRoleFromBCH && hasChucVu ? 'Có' : 'Không'}</span></li>
            <li>• Gửi email: <span className="font-medium">{sendWelcomeEmail ? 'Có' : 'Không'}</span></li>
            <li>• Mật khẩu: <span className="font-medium">{defaultPassword ? 'Tự định' : 'Tự động sinh'}</span></li>
          </ul>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-6 border-t">
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={isLoading}
        >
          ← Quay lại
        </Button>
        <Button
          onClick={handleContinue}
          disabled={isLoading}
          isLoading={isLoading}
        >
          Tiếp tục →
        </Button>
      </div>
    </div>
  );
};

// Validate password strength
const isValidPassword = (password) => {
  if (!password || password.length < 8) return false;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*]/.test(password);
  return hasLetter && hasNumber && hasSpecial;
};

export default Step2Configuration;
