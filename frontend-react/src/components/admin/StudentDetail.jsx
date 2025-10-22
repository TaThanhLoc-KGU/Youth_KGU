import { Edit, Mail, Phone, Calendar, User } from 'lucide-react';
import Button from '../common/Button';
import Badge from '../common/Badge';

const StudentDetail = ({ student, onEdit, onClose }) => {
  if (!student) return null;

  const InfoRow = ({ icon: Icon, label, value }) => (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1">
        <div className="text-sm text-gray-500">{label}</div>
        <div className="text-base font-medium text-gray-900">{value || '-'}</div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Avatar & Basic Info */}
      <div className="flex items-center gap-6">
        <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center">
          {student.hinhAnh ? (
            <img
              src={student.hinhAnh}
              alt={student.hoTen}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <span className="text-4xl font-bold text-primary">
              {student.hoTen?.charAt(0)}
            </span>
          )}
        </div>
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-gray-900">{student.hoTen}</h3>
          <p className="text-gray-600">{student.maSv}</p>
          <div className="mt-2">
            <Badge variant={student.isActive ? 'success' : 'danger'} dot>
              {student.isActive ? 'Đang hoạt động' : 'Ngừng hoạt động'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Detailed Info */}
      <div className="space-y-1">
        <InfoRow icon={Mail} label="Email" value={student.email} />
        <InfoRow icon={Phone} label="Số điện thoại" value={student.sdt} />
        <InfoRow icon={User} label="Lớp" value={student.tenLop} />
        <InfoRow
          icon={Calendar}
          label="Ngày tạo"
          value={student.createdAt ? new Date(student.createdAt).toLocaleDateString('vi-VN') : '-'}
        />
      </div>

      {/* Face Recognition Info */}
      {student.embedding && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-800">
            <div className="w-2 h-2 bg-green-600 rounded-full"></div>
            <span className="font-medium">Đã trích xuất đặc trưng khuôn mặt</span>
          </div>
          <p className="text-sm text-green-700 mt-1">
            Sinh viên này có thể sử dụng tính năng nhận diện khuôn mặt
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onClose}>
          Đóng
        </Button>
        <Button icon={Edit} onClick={onEdit}>
          Chỉnh sửa
        </Button>
      </div>
    </div>
  );
};

export default StudentDetail;
