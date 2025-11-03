import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { ChevronRight, ChevronLeft, Plus, Trash2 } from 'lucide-react';
import bchService from '../../services/bchService';
import chucVuService from '../../services/chucVuService';
import studentService from '../../services/studentService';
import chuyenVienService from '../../services/chuyenVienService';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Card from '../../components/common/Card';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';

const BCH_TYPES = {
  SINH_VIEN: 'SINH_VIEN',
  GIANG_VIEN: 'GIANG_VIEN',
  CHUYEN_VIEN: 'CHUYEN_VIEN',
};

const BCHCreateForm = ({ isOpen, onClose, onSuccess }) => {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [loaiThanhVien, setLoaiThanhVien] = useState('');
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [selectedPositions, setSelectedPositions] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [formData, setFormData] = useState({
    nhiemKy: '',
    ngayBatDau: '',
    ngayKetThuc: '',
    hinhAnh: '',
  });
  const [errors, setErrors] = useState({});

  // Fetch chuc vu
  const { data: chucVuList = [] } = useQuery('chuc-vu-for-bch-create', chucVuService.getAll);

  // Fetch all students for search
  const { data: allStudents = [] } = useQuery('students-for-bch-search', studentService.getAll);

  // Fetch all teachers
  const { data: allTeachers = [] } = useQuery('teachers-for-bch-search', async () => {
    // Placeholder - adjust if giangVienService exists
    return [];
  });

  // Fetch all chuyen vien
  const { data: allChuyenVien = [] } = useQuery('chuyenvien-for-bch-search', chuyenVienService.getAll);

  // Create BCH mutation
  const createMutation = useMutation(
    (data) => bchService.create(data),
    {
      onSuccess: () => {
        toast.success('Tạo BCH thành công!');
        queryClient.invalidateQueries('bch');
        queryClient.invalidateQueries('bch-statistics');
        onSuccess?.();
        resetForm();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Tạo BCH thất bại!');
      },
    }
  );

  const resetForm = () => {
    setStep(1);
    setLoaiThanhVien('');
    setSelectedPerson(null);
    setSelectedPositions([]);
    setSearchInput('');
    setSearchResults([]);
    setFormData({
      nhiemKy: '',
      ngayBatDau: '',
      ngayKetThuc: '',
      hinhAnh: '',
    });
    setErrors({});
  };

  // Search function
  const handleSearch = async (value) => {
    setSearchInput(value);
    if (value.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      let results = [];
      if (loaiThanhVien === BCH_TYPES.SINH_VIEN) {
        results = allStudents.filter(
          (s) =>
            s.hoTen?.toLowerCase().includes(value.toLowerCase()) ||
            s.maSv?.toLowerCase().includes(value.toLowerCase()) ||
            s.email?.toLowerCase().includes(value.toLowerCase())
        );
      } else if (loaiThanhVien === BCH_TYPES.GIANG_VIEN) {
        results = allTeachers.filter(
          (t) =>
            t.hoTen?.toLowerCase().includes(value.toLowerCase()) ||
            t.email?.toLowerCase().includes(value.toLowerCase())
        );
      } else if (loaiThanhVien === BCH_TYPES.CHUYEN_VIEN) {
        results = allChuyenVien.filter(
          (c) =>
            c.hoTen?.toLowerCase().includes(value.toLowerCase()) ||
            c.email?.toLowerCase().includes(value.toLowerCase())
        );
      }
      setSearchResults(Array.isArray(results) ? results : []);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectPerson = (person) => {
    setSelectedPerson(person);
    setSearchInput('');
    setSearchResults([]);
  };

  const validateStep1 = () => {
    if (!loaiThanhVien) {
      toast.warning('Vui lòng chọn loại thành viên');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!selectedPerson) {
      toast.warning('Vui lòng chọn thành viên');
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    const newErrors = {};
    if (!formData.nhiemKy) newErrors.nhiemKy = 'Vui lòng nhập nhiệm kỳ';
    if (!formData.ngayBatDau) newErrors.ngayBatDau = 'Vui lòng chọn ngày bắt đầu';
    if (!formData.ngayKetThuc) newErrors.ngayKetThuc = 'Vui lòng chọn ngày kết thúc';
    if (
      formData.ngayBatDau &&
      formData.ngayKetThuc &&
      formData.ngayBatDau >= formData.ngayKetThuc
    ) {
      newErrors.ngayKetThuc = 'Ngày kết thúc phải sau ngày bắt đầu';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    if (step === 3 && !validateStep3()) return;
    if (step < 4) setStep(step + 1);
  };

  const handlePreviousStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleAddPosition = (maChucVu) => {
    const chucVu = chucVuList.find((cv) => cv.maChucVu === maChucVu);
    if (!chucVu) {
      toast.warning('Vui lòng chọn chức vụ');
      return;
    }

    if (selectedPositions.some((p) => p.maChucVu === maChucVu)) {
      toast.warning('Chức vụ này đã được thêm rồi');
      return;
    }

    const newPosition = {
      id: Date.now(),
      maChucVu,
      tenChucVu: chucVu.tenChucVu,
      ngayNhanChuc: new Date().toISOString().split('T')[0],
    };

    setSelectedPositions([...selectedPositions, newPosition]);
  };

  const handleRemovePosition = (id) => {
    setSelectedPositions(selectedPositions.filter((p) => p.id !== id));
  };

  const handleSubmit = async () => {
    if (!validateStep3()) return;
    if (selectedPositions.length === 0) {
      toast.warning('Vui lòng thêm ít nhất 1 chức vụ');
      return;
    }

    const submitData = {
      loaiThanhVien,
      maThanhVien:
        loaiThanhVien === BCH_TYPES.SINH_VIEN
          ? selectedPerson.maSv
          : selectedPerson.id,
      nhiemKy: formData.nhiemKy,
      ngayBatDau: formData.ngayBatDau,
      ngayKetThuc: formData.ngayKetThuc,
      hinhAnh: formData.hinhAnh || null,
      danhSachChucVu: selectedPositions.map((p) => ({
        maChucVu: p.maChucVu,
        ngayNhanChuc: p.ngayNhanChuc,
      })),
    };

    createMutation.mutate(submitData);
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="space-y-6 max-w-2xl">
        <div>
          <h2 className="text-2xl font-bold">Tạo BCH mới</h2>
          <p className="text-gray-600 text-sm mt-1">Bước {step} / 4</p>
        </div>

        {/* STEP 1: Choose BCH Type */}
        {step === 1 && (
          <Card>
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Chọn loại thành viên</h3>

              <div className="space-y-3">
                {[
                  {
                    value: BCH_TYPES.SINH_VIEN,
                    label: 'Sinh viên',
                    description: 'Chọn từ danh sách sinh viên',
                    color: '#3b82f6',
                  },
                  {
                    value: BCH_TYPES.GIANG_VIEN,
                    label: 'Giảng viên',
                    description: 'Chọn từ danh sách giảng viên',
                    color: '#10b981',
                  },
                  {
                    value: BCH_TYPES.CHUYEN_VIEN,
                    label: 'Chuyên viên',
                    description: 'Chọn từ danh sách chuyên viên',
                    color: '#a855f7',
                  },
                ].map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all"
                    style={{
                      borderColor: loaiThanhVien === option.value ? option.color : '#ddd',
                      backgroundColor:
                        loaiThanhVien === option.value ? option.color + '10' : 'white',
                    }}
                    onClick={() => setLoaiThanhVien(option.value)}
                  >
                    <input
                      type="radio"
                      name="loaiThanhVien"
                      value={option.value}
                      checked={loaiThanhVien === option.value}
                      onChange={() => {}}
                      className="w-5 h-5"
                    />
                    <div className="ml-4">
                      <p className="font-semibold text-gray-900">{option.label}</p>
                      <p className="text-sm text-gray-600">{option.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* STEP 2: Select Person */}
        {step === 2 && loaiThanhVien && (
          <Card>
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">
                Chọn {
                  loaiThanhVien === BCH_TYPES.SINH_VIEN
                    ? 'sinh viên'
                    : loaiThanhVien === BCH_TYPES.GIANG_VIEN
                      ? 'giảng viên'
                      : 'chuyên viên'
                }
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tìm và chọn
                  {loaiThanhVien === BCH_TYPES.SINH_VIEN && ' sinh viên'}
                  {loaiThanhVien === BCH_TYPES.GIANG_VIEN && ' giảng viên'}
                  {loaiThanhVien === BCH_TYPES.CHUYEN_VIEN && ' chuyên viên'}
                  <span className="text-red-500"> *</span>
                </label>

                <div className="relative">
                  <Input
                    placeholder={
                      loaiThanhVien === BCH_TYPES.SINH_VIEN
                        ? 'Nhập mã hoặc tên sinh viên...'
                        : loaiThanhVien === BCH_TYPES.GIANG_VIEN
                          ? 'Nhập tên giảng viên...'
                          : 'Nhập tên chuyên viên...'
                    }
                    value={searchInput}
                    onChange={(e) => handleSearch(e.target.value)}
                  />

                  {/* Search Results Dropdown */}
                  {searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg z-10 mt-1 max-h-64 overflow-y-auto">
                      {searchResults.map((person) => (
                        <div
                          key={person.id || person.maSv}
                          onClick={() => handleSelectPerson(person)}
                          className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-200 last:border-b-0"
                        >
                          <p className="font-medium text-sm">
                            {person.hoTen}
                            {loaiThanhVien === BCH_TYPES.SINH_VIEN && ` (${person.maSv})`}
                          </p>
                          <p className="text-xs text-gray-600">
                            {person.email}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {searchInput && searchResults.length === 0 && !isSearching && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg z-10 mt-1 p-3 text-gray-500 text-sm">
                      Không tìm thấy kết quả
                    </div>
                  )}
                </div>
              </div>

              {selectedPerson && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-2">Đã chọn</h4>
                  <div className="text-sm space-y-1 text-blue-800">
                    {selectedPerson.maSv && <p>Mã: {selectedPerson.maSv}</p>}
                    <p>Tên: {selectedPerson.hoTen}</p>
                    {selectedPerson.email && <p>Email: {selectedPerson.email}</p>}
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* STEP 3: Term Information */}
        {step === 3 && (
          <Card>
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Thông tin nhiệm kỳ</h3>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Nhiệm kỳ"
                  placeholder="VD: 2023-2024"
                  value={formData.nhiemKy}
                  onChange={(e) => setFormData({ ...formData, nhiemKy: e.target.value })}
                  error={errors.nhiemKy}
                  required
                />
                <Input
                  label="Ngày bắt đầu"
                  type="date"
                  value={formData.ngayBatDau}
                  onChange={(e) => setFormData({ ...formData, ngayBatDau: e.target.value })}
                  error={errors.ngayBatDau}
                  required
                />
              </div>

              <Input
                label="Ngày kết thúc"
                type="date"
                value={formData.ngayKetThuc}
                onChange={(e) => setFormData({ ...formData, ngayKetThuc: e.target.value })}
                error={errors.ngayKetThuc}
                required
              />

              <Input
                label="Hình ảnh (URL)"
                placeholder="https://example.com/image.jpg"
                value={formData.hinhAnh}
                onChange={(e) => setFormData({ ...formData, hinhAnh: e.target.value })}
              />
            </div>
          </Card>
        )}

        {/* STEP 4: Add Positions */}
        {step === 4 && (
          <div className="space-y-4">
            <Card>
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Thêm chức vụ</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chức vụ
                  </label>
                  <div className="flex gap-2">
                    <Select
                      id="chucVuSelect"
                      className="flex-1"
                      defaultValue=""
                    >
                      <option value="">-- Chọn chức vụ --</option>
                      {chucVuList.map((cv) => (
                        <option key={cv.maChucVu} value={cv.maChucVu}>
                          {cv.tenChucVu} ({cv.maChucVu})
                        </option>
                      ))}
                    </Select>
                    <Button
                      onClick={() => {
                        const chucVuSelect = document.getElementById('chucVuSelect');
                        if (chucVuSelect.value) {
                          handleAddPosition(chucVuSelect.value);
                          chucVuSelect.value = '';
                        }
                      }}
                      icon={Plus}
                    >
                      Thêm
                    </Button>
                  </div>
                </div>

                {selectedPositions.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Danh sách chức vụ ({selectedPositions.length})</h4>
                    <div className="space-y-2">
                      {selectedPositions.map((position) => (
                        <div
                          key={position.id}
                          className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                        >
                          <div>
                            <Badge variant="info">{position.tenChucVu}</Badge>
                            <span className="text-xs text-gray-600 ml-2">
                              Ngày nhận: {position.ngayNhanChuc}
                            </span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600"
                            icon={Trash2}
                            onClick={() => handleRemovePosition(position.id)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedPositions.length === 0 && (
                  <div className="text-center py-4 text-gray-500 text-sm bg-gray-50 rounded-lg">
                    Chưa thêm chức vụ nào (yêu cầu ít nhất 1 chức vụ)
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between gap-2 pt-4">
          <Button
            variant="outline"
            onClick={handlePreviousStep}
            icon={ChevronLeft}
            disabled={step === 1}
          >
            Quay lại
          </Button>

          {step < 4 ? (
            <Button onClick={handleNextStep} icon={ChevronRight}>
              Tiếp theo
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Hủy
              </Button>
              <Button
                onClick={handleSubmit}
                loading={createMutation.isLoading}
                disabled={selectedPositions.length === 0}
              >
                Tạo BCH
              </Button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default BCHCreateForm;
