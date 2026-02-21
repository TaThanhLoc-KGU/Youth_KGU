import Card from '../../components/common/Card';

const AdminDashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Tổng quan hệ thống quản lý hoạt động</p>
      </div>

      <Card>
        <div className="p-12 text-center">
          <img
            src="https://upload.wikimedia.org/wikipedia/vi/0/09/Huy_Hi%E1%BB%87u_%C4%90o%C3%A0n.png"
            alt="Logo Đoàn Thanh Niên"
            className="w-24 h-24 mx-auto mb-4 object-contain"
          />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Xin chào, Quản trị viên!
          </h2>
          <p className="text-gray-600">
            Chào mừng bạn quay trở lại hệ thống Youth KGU.
            <br />
            Chọn các chức năng từ menu bên trái để bắt đầu làm việc.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default AdminDashboard;
