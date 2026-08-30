import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Send, Settings2, Save, RefreshCw, Trash2, CheckCircle2, XCircle, MailPlus } from 'lucide-react';
import emailBroadcastService from '../../services/emailBroadcastService';
import khoaService from '../../services/khoaService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import RichTextEditor from '../../components/news/manage/RichTextEditor';
import EmailGroupManageModal from '../../components/email/EmailGroupManageModal';

const parseExtraEmails = (text) =>
  text
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean);

/**
 * Soạn & Gửi Email — người nhận là các NHÓM MAIL đã lưu (mỗi khoa 1 nhóm riêng, hoặc nhóm
 * chung) và/hoặc địa chỉ gõ tay thêm. Nội dung dựa trên mẫu có sẵn (tùy chọn) rồi chỉnh sửa
 * tự do trước khi gửi — không có mẫu cố định, không có gửi tự động; chỉ gửi khi bấm "Gửi".
 */
const EmailBroadcastPage = () => {
  const queryClient = useQueryClient();

  const [selectedGroupIds, setSelectedGroupIds] = useState([]);
  const [extraEmailsText, setExtraEmailsText] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showSaveAsModal, setShowSaveAsModal] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [showSendConfirm, setShowSendConfirm] = useState(false);
  const [sendResult, setSendResult] = useState(null);
  const [confirmDeleteTemplate, setConfirmDeleteTemplate] = useState(false);

  const { data: groups = [] } = useQuery({ queryKey: ['email-broadcast-groups'], queryFn: emailBroadcastService.getGroups });
  const { data: templates = [] } = useQuery({ queryKey: ['email-broadcast-templates'], queryFn: emailBroadcastService.getTemplates });
  const { data: khoaList = [] } = useQuery({ queryKey: ['khoa-active-list'], queryFn: khoaService.getActive });

  const khoaOptions = useMemo(() => khoaList.map((k) => ({ value: k.maKhoa, label: k.tenKhoa })), [khoaList]);
  const templateOptions = useMemo(
    () => [{ value: '', label: '— Soạn mới (không dùng mẫu) —' }, ...templates.map((t) => ({ value: String(t.id), label: t.tenMau }))],
    [templates]
  );

  const groupsChung = groups.filter((g) => !g.maKhoa);
  const groupsTheoKhoa = groups.filter((g) => g.maKhoa);

  const toggleGroup = (id) =>
    setSelectedGroupIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const applyTemplate = (idStr) => {
    setSelectedTemplateId(idStr);
    if (!idStr) return;
    const t = templates.find((x) => String(x.id) === idStr);
    if (t) { setSubject(t.tieuDe); setBody(t.noiDung); }
  };

  const invalidateTemplates = () => queryClient.invalidateQueries({ queryKey: ['email-broadcast-templates'] });

  const saveAsTemplateMutation = useMutation({
    mutationFn: () => emailBroadcastService.createTemplate({ tenMau: newTemplateName.trim(), tieuDe: subject, noiDung: body }),
    onSuccess: (created) => {
      toast.success('Đã lưu mẫu mới');
      setShowSaveAsModal(false);
      setNewTemplateName('');
      invalidateTemplates();
      if (created?.id) setSelectedTemplateId(String(created.id));
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Lưu mẫu thất bại'),
  });

  const updateTemplateMutation = useMutation({
    mutationFn: () => {
      const current = templates.find((t) => String(t.id) === selectedTemplateId);
      return emailBroadcastService.updateTemplate(selectedTemplateId, { tenMau: current.tenMau, tieuDe: subject, noiDung: body });
    },
    onSuccess: () => { toast.success('Đã cập nhật mẫu'); invalidateTemplates(); },
    onError: (e) => toast.error(e.response?.data?.message || 'Cập nhật mẫu thất bại'),
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: () => emailBroadcastService.deleteTemplate(selectedTemplateId),
    onSuccess: () => {
      toast.success('Đã xóa mẫu');
      setSelectedTemplateId('');
      setConfirmDeleteTemplate(false);
      invalidateTemplates();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Xóa mẫu thất bại'),
  });

  const extraEmails = parseExtraEmails(extraEmailsText);
  const totalRecipients = selectedGroupIds.length + extraEmails.length;

  const sendMutation = useMutation({
    mutationFn: () => emailBroadcastService.send({ groupIds: selectedGroupIds, extraEmails, subject: subject.trim(), body }),
    onSuccess: (result) => { setShowSendConfirm(false); setSendResult(result); },
    onError: (e) => { setShowSendConfirm(false); toast.error(e.response?.data?.message || 'Gửi email thất bại'); },
  });

  const canSend = subject.trim() && body.trim() && totalRecipients > 0;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
          <MailPlus className="w-6 h-6 text-primary" /> Soạn &amp; Gửi Email
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Chọn nhóm mail cần gửi, soạn nội dung (có thể nạp từ mẫu có sẵn rồi chỉnh sửa tự do), rồi bấm Gửi.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ── Người nhận ─────────────────────────────────────────────────── */}
        <Card className="lg:col-span-1 h-fit">
          <Card.Header action={
            <button onClick={() => setShowGroupModal(true)} className="text-gray-400 hover:text-primary" title="Quản lý nhóm mail">
              <Settings2 className="w-4 h-4" />
            </button>
          }>
            <h2 className="font-semibold text-gray-800">Người nhận</h2>
          </Card.Header>
          <Card.Body className="space-y-4">
            {groupsChung.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Nhóm chung</p>
                <div className="space-y-1.5">
                  {groupsChung.map((g) => (
                    <label key={g.id} className="flex items-start gap-2 text-sm cursor-pointer">
                      <input type="checkbox" className="mt-0.5" checked={selectedGroupIds.includes(g.id)} onChange={() => toggleGroup(g.id)} />
                      <span className="text-gray-700">{g.tenNhom}<br /><span className="text-xs text-gray-400">{g.diaChiEmail}</span></span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            {groupsTheoKhoa.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Theo khoa</p>
                <div className="space-y-1.5">
                  {groupsTheoKhoa.map((g) => (
                    <label key={g.id} className="flex items-start gap-2 text-sm cursor-pointer">
                      <input type="checkbox" className="mt-0.5" checked={selectedGroupIds.includes(g.id)} onChange={() => toggleGroup(g.id)} />
                      <span className="text-gray-700">{g.tenNhom}<br /><span className="text-xs text-gray-400">{g.tenKhoa} · {g.diaChiEmail}</span></span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            {groups.length === 0 && (
              <p className="text-sm text-gray-400">
                Chưa có nhóm mail nào. Bấm{' '}
                <button onClick={() => setShowGroupModal(true)} className="text-primary underline">quản lý nhóm mail</button>{' '}
                để thêm.
              </p>
            )}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Email khác (tùy chọn)</p>
              <textarea
                value={extraEmailsText}
                onChange={(e) => setExtraEmailsText(e.target.value)}
                rows={2}
                placeholder="Cách nhau bằng dấu phẩy, chấm phẩy hoặc xuống dòng"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <p className="text-xs text-gray-400 pt-1 border-t border-gray-50">
              Tổng cộng: <strong className="text-gray-600">{totalRecipients}</strong> người nhận (mỗi nhóm/địa chỉ nhận 1 email)
            </p>
          </Card.Body>
        </Card>

        {/* ── Soạn thảo ──────────────────────────────────────────────────── */}
        <Card className="lg:col-span-2">
          <Card.Header>
            <h2 className="font-semibold text-gray-800">Nội dung email</h2>
          </Card.Header>
          <Card.Body className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={selectedTemplateId} onChange={(e) => applyTemplate(e.target.value)} options={templateOptions} className="w-full sm:w-72" placeholder={null} />
              {selectedTemplateId && (
                <div className="flex gap-2">
                  <Button variant="secondary" icon={RefreshCw} onClick={() => updateTemplateMutation.mutate()} isLoading={updateTemplateMutation.isPending}>
                    Cập nhật mẫu này
                  </Button>
                  <Button variant="secondary" icon={Trash2} onClick={() => setConfirmDeleteTemplate(true)}>
                    Xóa mẫu
                  </Button>
                </div>
              )}
            </div>

            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Tiêu đề email"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
            />

            <RichTextEditor value={body} onChange={setBody} placeholder="Nội dung email..." height={380} />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-gray-50">
              <Button variant="secondary" icon={Save} onClick={() => setShowSaveAsModal(true)} disabled={!subject.trim() || !body.trim()}>
                Lưu thành mẫu mới
              </Button>
              <Button icon={Send} onClick={() => setShowSendConfirm(true)} disabled={!canSend}>
                Gửi ({totalRecipients})
              </Button>
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* Quản lý nhóm mail */}
      <EmailGroupManageModal isOpen={showGroupModal} onClose={() => setShowGroupModal(false)} khoaOptions={khoaOptions} />

      {/* Lưu mẫu mới */}
      {showSaveAsModal && (
        <Modal isOpen onClose={() => setShowSaveAsModal(false)} title="Lưu thành mẫu mới" size="sm">
          <div className="space-y-3">
            <input
              autoFocus
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
              placeholder="Tên mẫu (vd: Thông báo hoạt động)"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowSaveAsModal(false)}>Hủy</Button>
              <Button onClick={() => saveAsTemplateMutation.mutate()} isLoading={saveAsTemplateMutation.isPending} disabled={!newTemplateName.trim()}>
                Lưu mẫu
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Xác nhận gửi */}
      <ConfirmDialog
        isOpen={showSendConfirm}
        onClose={() => setShowSendConfirm(false)}
        onConfirm={() => sendMutation.mutate()}
        isLoading={sendMutation.isPending}
        variant="primary"
        title="Xác nhận gửi email"
        description={`Gửi email "${subject}" tới ${totalRecipients} người nhận (nhóm mail/địa chỉ)? Hành động này không thể thu hồi sau khi gửi.`}
        confirmLabel="Gửi ngay"
      />

      {/* Xác nhận xóa mẫu */}
      <ConfirmDialog
        isOpen={confirmDeleteTemplate}
        onClose={() => setConfirmDeleteTemplate(false)}
        onConfirm={() => deleteTemplateMutation.mutate()}
        isLoading={deleteTemplateMutation.isPending}
        title="Xóa mẫu email"
        description="Xóa mẫu này? Không ảnh hưởng tới email đã gửi trước đó."
      />

      {/* Kết quả gửi */}
      {sendResult && (
        <Modal isOpen onClose={() => setSendResult(null)} title="Kết quả gửi email" size="sm">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-sm font-medium">Thành công: {sendResult.guiThanhCong}/{sendResult.tongSoNguoiNhan}</span>
            </div>
            {sendResult.guiThatBai > 0 && (
              <div>
                <div className="flex items-center gap-2 text-red-600 mb-1">
                  <XCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">Thất bại: {sendResult.guiThatBai}</span>
                </div>
                <ul className="text-xs text-gray-500 list-disc list-inside space-y-0.5">
                  {(sendResult.diaChiThatBai || []).map((addr) => <li key={addr}>{addr}</li>)}
                </ul>
              </div>
            )}
            <div className="flex justify-end pt-1">
              <Button onClick={() => setSendResult(null)}>Đóng</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default EmailBroadcastPage;
