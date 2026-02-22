import { useState, useEffect } from 'react';
import {
  DIEM_REN_LUYEN_CRITERIA,
  findDanhMuc,
  findTieuChi,
} from '../../constants/renLuyenCriteria';

/**
 * Component chọn tiêu chí điểm rèn luyện và nhập điểm tương ứng.
 *
 * Props:
 *  - maDanhMuc   : string  - id danh mục đang chọn (I, II, ...)
 *  - maTieuChi   : string  - id tiêu chí đang chọn (1.1, 3.4, ...)
 *  - diemRenLuyen: number  - điểm đã nhập
 *  - onChange     : fn({ maDanhMucRenLuyen, maTieuChiRenLuyen, diemRenLuyen, diemToiDaTieuChi })
 */
const RenLuyenSelector = ({
  maDanhMuc = '',
  maTieuChi = '',
  diemRenLuyen = '',
  onChange,
}) => {
  const [selectedDanhMuc, setSelectedDanhMuc] = useState(maDanhMuc || '');
  const [selectedTieuChi, setSelectedTieuChi] = useState(maTieuChi || '');
  const [diem, setDiem] = useState(diemRenLuyen ?? '');
  const [selectedChiTiet, setSelectedChiTiet] = useState('');

  // Sync khi initialData thay đổi (trường hợp edit)
  useEffect(() => {
    setSelectedDanhMuc(maDanhMuc || '');
    setSelectedTieuChi(maTieuChi || '');
    setDiem(diemRenLuyen ?? '');
  }, [maDanhMuc, maTieuChi, diemRenLuyen]);

  const danhMucObj = findDanhMuc(selectedDanhMuc);
  const tieuChiObj = selectedTieuChi ? findTieuChi(selectedTieuChi) : null;
  const hasChiTiet = tieuChiObj?.chiTiet?.length > 0;
  const diemMax = tieuChiObj?.diemToiDa ?? 0;

  const notify = (dmId, tcId, d) => {
    if (onChange) {
      onChange({
        maDanhMucRenLuyen: dmId,
        maTieuChiRenLuyen: tcId,
        diemRenLuyen: d !== '' ? parseInt(d, 10) : null,
        diemToiDaTieuChi: tcId ? findTieuChi(tcId)?.diemToiDa ?? null : null,
      });
    }
  };

  const handleDanhMucChange = (e) => {
    const val = e.target.value;
    setSelectedDanhMuc(val);
    setSelectedTieuChi('');
    setSelectedChiTiet('');
    setDiem('');
    notify(val, '', '');
  };

  const handleTieuChiChange = (e) => {
    const val = e.target.value;
    setSelectedTieuChi(val);
    setSelectedChiTiet('');
    setDiem('');
    notify(selectedDanhMuc, val, '');
  };

  const handleChiTietChange = (e) => {
    const val = e.target.value;
    setSelectedChiTiet(val);
    const detail = tieuChiObj?.chiTiet?.find((cd) => cd.id === val);
    const d = detail ? detail.diem : '';
    setDiem(d);
    notify(selectedDanhMuc, selectedTieuChi, d);
  };

  const handleDiemChange = (e) => {
    const val = e.target.value;
    if (val === '' || (parseInt(val, 10) >= 0 && parseInt(val, 10) <= diemMax)) {
      setDiem(val);
      notify(selectedDanhMuc, selectedTieuChi, val);
    }
  };

  const isOverLimit = diem !== '' && diemMax > 0 && parseInt(diem, 10) > diemMax;

  return (
    <div className="space-y-4">
      {/* Bước 1: Chọn Danh mục */}
      <div>
        <label className="form-label">Danh mục điểm rèn luyện</label>
        <select
          className="form-input"
          value={selectedDanhMuc}
          onChange={handleDanhMucChange}
        >
          <option value="">-- Không áp dụng --</option>
          {DIEM_REN_LUYEN_CRITERIA.map((dm) => (
            <option key={dm.id} value={dm.id}>
              Mục {dm.id} – {dm.danhMuc} (tối đa {dm.tongDiemToiDa}đ)
            </option>
          ))}
        </select>
        {danhMucObj && (
          <p className="mt-1 text-xs text-gray-500 leading-relaxed">
            {danhMucObj.danhMucDayDu}
          </p>
        )}
      </div>

      {/* Bước 2: Chọn Tiêu chí con (chỉ hiện khi đã chọn danh mục) */}
      {selectedDanhMuc && danhMucObj && (
        <div>
          <label className="form-label">Tiêu chí cụ thể</label>
          <select
            className="form-input"
            value={selectedTieuChi}
            onChange={handleTieuChiChange}
          >
            <option value="">-- Chọn tiêu chí --</option>
            {danhMucObj.tieuChi.map((tc) => (
              <option key={tc.id} value={tc.id}>
                {tc.id} – {tc.noiDung.length > 70 ? tc.noiDung.substring(0, 70) + '…' : tc.noiDung}{' '}
                (tối đa {tc.diemToiDa}đ)
              </option>
            ))}
          </select>
          {tieuChiObj && (
            <p className="mt-1 text-xs text-gray-500 leading-relaxed">
              {tieuChiObj.noiDung}
            </p>
          )}
        </div>
      )}

      {/* Bước 3a: Nếu tiêu chí có chi tiết → cho chọn mức */}
      {selectedTieuChi && hasChiTiet && (
        <div>
          <label className="form-label">Mức xếp loại</label>
          <div className="flex gap-3 flex-wrap">
            {tieuChiObj.chiTiet.map((cd) => (
              <label
                key={cd.id}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors ${
                  selectedChiTiet === cd.id
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 hover:border-indigo-300 text-gray-700'
                }`}
              >
                <input
                  type="radio"
                  name="chiTietRenLuyen"
                  value={cd.id}
                  checked={selectedChiTiet === cd.id}
                  onChange={handleChiTietChange}
                  className="accent-indigo-600"
                />
                <span className="text-sm font-medium">{cd.noiDung}</span>
                <span className="text-xs font-bold text-indigo-600">+{cd.diem}đ</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Bước 3b: Nếu tiêu chí không có chi tiết → nhập số điểm */}
      {selectedTieuChi && !hasChiTiet && (
        <div>
          <label className="form-label">
            Số điểm rèn luyện{' '}
            <span className="text-indigo-600 font-semibold">(tối đa {diemMax} điểm)</span>
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="0"
              max={diemMax}
              value={diem}
              onChange={handleDiemChange}
              className={`form-input w-32 ${isOverLimit ? 'border-red-500' : ''}`}
              placeholder="0"
            />
            {diemMax > 0 && (
              <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    isOverLimit ? 'bg-red-500' : 'bg-indigo-500'
                  }`}
                  style={{
                    width: `${Math.min(100, diem !== '' ? (parseInt(diem) / diemMax) * 100 : 0)}%`,
                  }}
                />
              </div>
            )}
            {diem !== '' && (
              <span className={`text-sm font-medium ${isOverLimit ? 'text-red-600' : 'text-gray-600'}`}>
                {diem}/{diemMax}
              </span>
            )}
          </div>
          {isOverLimit && (
            <p className="mt-1 text-xs text-red-500">
              Điểm nhập vượt quá mức tối đa ({diemMax} điểm) của tiêu chí này.
            </p>
          )}
        </div>
      )}

      {/* Summary badge */}
      {selectedTieuChi && diem !== '' && diem !== null && !isOverLimit && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-sm text-green-700">
            Hoạt động này sẽ tính{' '}
            <strong>{diem} điểm rèn luyện</strong> theo{' '}
            <strong>
              Tiêu chí {selectedTieuChi} – Mục {selectedDanhMuc}
            </strong>
          </span>
        </div>
      )}
    </div>
  );
};

export default RenLuyenSelector;
