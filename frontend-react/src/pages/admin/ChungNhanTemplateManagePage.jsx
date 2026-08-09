import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Stage, Layer, Image as KonvaImage, Rect, Text as KonvaText, Transformer } from 'react-konva';
import {
  Plus, Trash2, ArrowLeft, Save, Eye, Upload, Type, Award,
  User, Calendar, Hash, GraduationCap, Building2, Loader2, PenLine,
} from 'lucide-react';
import chungNhanService from '../../services/chungNhanService';
import kySoService from '../../services/kySoService';
import { API_BASE_URL } from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

const imgUrl = (p) => (p ? (p.startsWith('http') ? p : `${API_BASE_URL}${p}`) : null);

const FIELD_TYPES = [
  { fieldType: 'text', key: 'hoTenSinhVien', label: 'Họ tên SV', icon: User },
  { fieldType: 'text', key: 'tenHoatDong',   label: 'Tên hoạt động', icon: Award },
  { fieldType: 'text', key: 'ngayCap',       label: 'Ngày cấp', icon: Calendar },
  { fieldType: 'text', key: 'maChungNhan',   label: 'Mã chứng nhận', icon: Hash },
  { fieldType: 'text', key: 'tenLop',        label: 'Tên lớp', icon: GraduationCap },
  { fieldType: 'text', key: 'tenKhoa',       label: 'Tên khoa', icon: Building2 },
  { fieldType: 'text', key: null,            label: 'Text tuỳ chỉnh', icon: Type },
  { fieldType: 'signature', key: null,       label: 'Chữ ký', icon: PenLine },
];

const FIELD_LABEL_BY_KEY = Object.fromEntries(FIELD_TYPES.filter(t => t.key).map(t => [t.key, t.label]));

let fieldSeq = 0;
const newFieldId = () => `f${++fieldSeq}_${Date.now()}`;

const makeField = (type) => ({
  _id: newFieldId(),
  type: type.fieldType,
  key: type.key,
  label: type.key ? type.label : (type.fieldType === 'signature' ? 'Chữ ký' : 'Văn bản mẫu'),
  chuKyId: null,
  x: 80, y: 80,
  width: type.fieldType === 'signature' ? 160 : 320,
  height: type.fieldType === 'signature' ? 70 : 44,
  fontSizePt: 26, fontName: 'times', color: '#1a1a1a', bold: false, align: 'center',
});

/** Load 1 ảnh (URL hoặc blob URL) thành HTMLImageElement cho Konva. */
function useHtmlImage(src) {
  const [img, setImg] = useState(null);
  useEffect(() => {
    if (!src) { setImg(null); return; }
    const el = new window.Image();
    el.onload = () => setImg(el);
    el.src = src;
    return () => { el.onload = null; };
  }, [src]);
  return img;
}

/**
 * Lớp hiển thị (không tương tác) của 1 field trên canvas — text placeholder hoặc ảnh chữ ký
 * thật (nếu đã chọn), giữ tỉ lệ + canh giữa khung giống hệt cách ChungNhanRenderService vẽ khi
 * xuất PDF thật, để bản xem trên canvas phản ánh đúng kết quả cuối cùng.
 */
function FieldVisual({ f, chuKyMap }) {
  const chuKy = f.type === 'signature' && f.chuKyId ? chuKyMap[f.chuKyId] : null;
  const sigImg = useHtmlImage(chuKy ? imgUrl(chuKy.duongDan) : null);

  if (f.type === 'signature') {
    if (sigImg) {
      const scale = Math.min(f.width / sigImg.width, f.height / sigImg.height);
      const w = sigImg.width * scale, h = sigImg.height * scale;
      return (
        <KonvaImage
          image={sigImg}
          x={f.x + (f.width - w) / 2}
          y={f.y + (f.height - h) / 2}
          width={w} height={h}
          listening={false}
        />
      );
    }
    return (
      <KonvaText
        x={f.x} y={f.y} width={f.width} height={f.height}
        text="✍️ Chọn chữ ký ở panel bên phải"
        fontSize={13} fill="#9ca3af" align="center" verticalAlign="middle"
        listening={false}
      />
    );
  }

  return (
    <KonvaText
      x={f.x} y={f.y} width={f.width} height={f.height}
      text={f.key ? `{{${FIELD_LABEL_BY_KEY[f.key] || f.key}}}` : (f.label || 'Văn bản mẫu')}
      fontSize={f.fontSizePt}
      fontStyle={f.bold ? 'bold' : 'normal'}
      fill={f.color}
      align={f.align}
      verticalAlign="middle"
      listening={false}
    />
  );
}

// ─── Danh sách mẫu ──────────────────────────────────────────────────────────

function TemplateList({ onCreate, onEdit }) {
  const qc = useQueryClient();
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['chung-nhan-mau'],
    queryFn: chungNhanService.getTemplates,
  });

  const deleteMut = useMutation({
    mutationFn: (id) => chungNhanService.deleteTemplate(id),
    onSuccess: () => {
      toast.success('Đã xoá mẫu');
      qc.invalidateQueries({ queryKey: ['chung-nhan-mau'] });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Xoá thất bại'),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Mẫu chứng nhận</h1>
          <p className="text-gray-600 mt-1">Thiết kế mẫu chứng nhận để cấp hàng loạt theo hoạt động</p>
        </div>
        <Button icon={Plus} onClick={onCreate}>Tạo mẫu mới</Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
      ) : templates.length === 0 ? (
        <Card>
          <div className="py-12 text-center text-gray-400">
            <Award className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>Chưa có mẫu chứng nhận nào</p>
            <Button className="mt-4" icon={Plus} onClick={onCreate}>Tạo mẫu đầu tiên</Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((t) => (
            <Card key={t.id} padding={false} className="overflow-hidden">
              <div
                className="aspect-[4/3] bg-gray-100 cursor-pointer overflow-hidden"
                onClick={() => onEdit(t)}
              >
                <img src={imgUrl(t.hinhNen)} alt={t.ten} className="w-full h-full object-cover" />
              </div>
              <div className="p-3 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-sm text-gray-900 truncate">{t.ten}</p>
                  <p className="text-xs text-gray-400">{(t.fields || []).length} trường nội dung</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => onEdit(t)}>Sửa</Button>
                  <Button
                    size="sm" variant="danger-ghost" icon={Trash2}
                    onClick={() => { if (window.confirm(`Xoá mẫu "${t.ten}"?`)) deleteMut.mutate(t.id); }}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Trình thiết kế ─────────────────────────────────────────────────────────

const MAX_CANVAS_W = 760;

function TemplateEditor({ template, onBack }) {
  const qc = useQueryClient();
  const fileRef = useRef(null);
  const stageRef = useRef(null);
  const trRef = useRef(null);
  const nodeRefs = useRef({});

  const [ten, setTen] = useState(template?.ten || '');
  const [naturalSize, setNaturalSize] = useState(
    template ? { w: template.chieuRongPx, h: template.chieuCaoPx } : null
  );
  const [bgFile, setBgFile] = useState(null);
  const [bgSrc, setBgSrc] = useState(template ? imgUrl(template.hinhNen) : null);
  const [fields, setFields] = useState(
    (template?.fields || []).map((f) => ({ ...f, _id: newFieldId() }))
  );
  const [selectedId, setSelectedId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [previewSrc, setPreviewSrc] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const bgImg = useHtmlImage(bgSrc);

  const { data: chuKyList = [] } = useQuery({ queryKey: ['chu-ky'], queryFn: kySoService.getAllChuKy });
  const chuKyMap = Object.fromEntries(chuKyList.map((c) => [c.id, c]));

  const handlePickFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBgFile(file);
    const url = URL.createObjectURL(file);
    setBgSrc(url);
    const probe = new window.Image();
    probe.onload = () => setNaturalSize({ w: probe.naturalWidth, h: probe.naturalHeight });
    probe.src = url;
  };

  const scale = naturalSize ? Math.min(1, MAX_CANVAS_W / naturalSize.w) : 1;

  const addField = (type) => {
    const f = makeField(type);
    setFields((prev) => [...prev, f]);
    setSelectedId(f._id);
  };

  const updateField = (id, patch) =>
    setFields((prev) => prev.map((f) => (f._id === id ? { ...f, ...patch } : f)));

  const removeField = (id) => {
    setFields((prev) => prev.filter((f) => f._id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  useEffect(() => {
    if (trRef.current) {
      const node = selectedId ? nodeRefs.current[selectedId] : null;
      trRef.current.nodes(node ? [node] : []);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [selectedId, fields.length]);

  const handleSave = async () => {
    if (!ten.trim()) { toast.error('Vui lòng nhập tên mẫu'); return; }
    if (!bgFile && !template) { toast.error('Vui lòng chọn ảnh nền'); return; }
    const payloadFields = fields.map(({ _id, ...rest }) => rest);
    setSaving(true);
    try {
      if (template) {
        await chungNhanService.updateTemplate(template.id, ten.trim(), bgFile, payloadFields);
        toast.success('Đã cập nhật mẫu');
      } else {
        await chungNhanService.createTemplate(ten.trim(), bgFile, payloadFields);
        toast.success('Đã tạo mẫu chứng nhận');
      }
      qc.invalidateQueries({ queryKey: ['chung-nhan-mau'] });
      onBack();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Lưu mẫu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = async () => {
    if (!template) { toast.info('Lưu mẫu trước khi xem trước với dữ liệu mẫu'); return; }
    setPreviewLoading(true);
    try {
      const base64 = await chungNhanService.preview({ templateId: template.id });
      setPreviewSrc(base64);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Không tạo được bản xem trước');
    } finally {
      setPreviewLoading(false);
    }
  };

  const selected = fields.find((f) => f._id === selectedId);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={onBack}>Quay lại</Button>
        <input
          value={ten}
          onChange={(e) => setTen(e.target.value)}
          placeholder="Tên mẫu (VD: Chứng nhận tham gia hoạt động Đoàn)"
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <Button variant="outline" icon={Eye} isLoading={previewLoading} onClick={handlePreview}>Xem trước</Button>
        <Button icon={Save} isLoading={saving} onClick={handleSave}>Lưu mẫu</Button>
      </div>

      <div className="flex gap-4 items-start">
        {/* Palette */}
        <Card className="w-56 flex-shrink-0">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Thêm trường</p>
          <div className="space-y-1.5">
            {FIELD_TYPES.map((t) => (
              <button
                key={t.label}
                onClick={() => addField(t)}
                disabled={!naturalSize}
                className="w-full flex items-center gap-2 px-2.5 py-2 text-sm text-left rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <t.icon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                {t.label}
              </button>
            ))}
          </div>
          {!naturalSize && (
            <p className="text-[11px] text-amber-600 mt-3">Chọn ảnh nền trước khi thêm trường</p>
          )}
        </Card>

        {/* Canvas */}
        <Card className="flex-1 flex flex-col items-center overflow-auto" padding={false}>
          {!bgSrc ? (
            <div
              onClick={() => fileRef.current?.click()}
              className="w-full aspect-[4/3] flex flex-col items-center justify-center gap-2 text-gray-400 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <Upload className="w-8 h-8" />
              <span className="text-sm">Chọn ảnh nền chứng nhận</span>
            </div>
          ) : (
            <div className="p-4">
              {naturalSize && bgImg && (
                <Stage
                  ref={stageRef}
                  width={naturalSize.w * scale}
                  height={naturalSize.h * scale}
                  scaleX={scale}
                  scaleY={scale}
                  onMouseDown={(e) => { if (e.target === e.target.getStage()) setSelectedId(null); }}
                  style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.15)' }}
                >
                  <Layer>
                    <KonvaImage image={bgImg} width={naturalSize.w} height={naturalSize.h} />
                    {fields.map((f) => (
                      <Rect
                        key={f._id}
                        x={f.x} y={f.y} width={f.width} height={f.height}
                        fill="rgba(59,130,246,0.08)"
                        stroke={selectedId === f._id ? '#3b82f6' : 'rgba(59,130,246,0.4)'}
                        strokeWidth={selectedId === f._id ? 2 : 1}
                        dash={[6, 4]}
                        draggable
                        ref={(node) => { if (node) nodeRefs.current[f._id] = node; }}
                        onClick={() => setSelectedId(f._id)}
                        onTap={() => setSelectedId(f._id)}
                        onDragEnd={(e) => updateField(f._id, { x: e.target.x(), y: e.target.y() })}
                        onTransformEnd={(e) => {
                          const node = e.target;
                          const sx = node.scaleX(), sy = node.scaleY();
                          node.scaleX(1); node.scaleY(1);
                          updateField(f._id, {
                            x: node.x(), y: node.y(),
                            width: Math.max(20, node.width() * sx),
                            height: Math.max(16, node.height() * sy),
                          });
                        }}
                      />
                    ))}
                    {fields.map((f) => (
                      <FieldVisual key={`${f._id}-visual`} f={f} chuKyMap={chuKyMap} />
                    ))}
                    <Transformer ref={trRef} rotateEnabled={false} flipEnabled={false} />
                  </Layer>
                </Stage>
              )}
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={handlePickFile} />
          {bgSrc && (
            <button onClick={() => fileRef.current?.click()} className="text-xs text-blue-600 hover:underline pb-3">
              Đổi ảnh nền
            </button>
          )}
        </Card>

        {/* Inspector */}
        <Card className="w-64 flex-shrink-0">
          {!selected ? (
            <p className="text-xs text-gray-400">Chọn 1 trường trên canvas để chỉnh font/màu/canh lề.</p>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {selected.type === 'signature' ? 'Chữ ký' : selected.key ? FIELD_LABEL_BY_KEY[selected.key] : 'Text tuỳ chỉnh'}
                </p>
                <button onClick={() => removeField(selected._id)} className="text-red-400 hover:text-red-600">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {selected.type === 'signature' ? (
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Chọn chữ ký</label>
                  {chuKyList.length === 0 ? (
                    <p className="text-xs text-amber-600">
                      Chưa có chữ ký nào — vào mục <span className="font-medium">Quản lý Chữ ký</span> để upload trước.
                    </p>
                  ) : (
                    <select
                      value={selected.chuKyId ?? ''}
                      onChange={(e) => updateField(selected._id, { chuKyId: e.target.value ? Number(e.target.value) : null })}
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-white"
                    >
                      <option value="">— Chọn —</option>
                      {chuKyList.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.tenNguoiKy}{c.chucVu ? ` (${c.chucVu})` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                  <p className="text-[11px] text-gray-400 mt-2">Ảnh chữ ký sẽ tự co giãn vừa khung, giữ nguyên tỉ lệ.</p>
                </div>
              ) : (
                <>
                  {!selected.key && (
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Nội dung</label>
                      <input
                        value={selected.label}
                        onChange={(e) => updateField(selected._id, { label: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Cỡ chữ</label>
                    <input
                      type="number" min={8} max={120}
                      value={selected.fontSizePt}
                      onChange={(e) => updateField(selected._id, { fontSizePt: Number(e.target.value) })}
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Phông chữ</label>
                    <select
                      value={selected.fontName}
                      onChange={(e) => updateField(selected._id, { fontName: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-white"
                    >
                      <option value="times">Times New Roman</option>
                      <option value="arial">Arial</option>
                      <option value="calibri">Calibri</option>
                      <option value="montserrat">Montserrat</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">Màu chữ</label>
                      <input
                        type="color"
                        value={selected.color}
                        onChange={(e) => updateField(selected._id, { color: e.target.value })}
                        className="w-full h-8 border border-gray-200 rounded cursor-pointer"
                      />
                    </div>
                    <label className="flex items-center gap-1.5 text-xs text-gray-600 pt-4">
                      <input
                        type="checkbox"
                        checked={selected.bold}
                        onChange={(e) => updateField(selected._id, { bold: e.target.checked })}
                      />
                      Đậm
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Canh lề</label>
                    <div className="flex gap-1">
                      {['left', 'center', 'right'].map((a) => (
                        <button
                          key={a}
                          onClick={() => updateField(selected._id, { align: a })}
                          className={`flex-1 px-2 py-1.5 text-xs rounded-lg border transition-colors ${
                            selected.align === a ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500'
                          }`}
                        >
                          {a === 'left' ? 'Trái' : a === 'center' ? 'Giữa' : 'Phải'}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </Card>
      </div>

      {previewSrc && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6" onClick={() => setPreviewSrc(null)}>
          <img src={previewSrc} alt="Xem trước chứng nhận" className="max-w-full max-h-full rounded-lg shadow-2xl" />
        </div>
      )}
    </div>
  );
}

// ─── Trang chính ────────────────────────────────────────────────────────────

export default function ChungNhanTemplateManagePage() {
  const [editing, setEditing] = useState(undefined); // undefined = list, null = new, object = editing

  if (editing === undefined) {
    return (
      <TemplateList
        onCreate={() => setEditing(null)}
        onEdit={(t) => setEditing(t)}
      />
    );
  }

  return (
    <TemplateEditor
      template={editing}
      onBack={() => setEditing(undefined)}
    />
  );
}
