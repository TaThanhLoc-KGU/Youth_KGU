import React, { useEffect, useState } from "react";
import { Header, Page, Spinner } from "zmp-ui";
import { FileText, ClipboardList, Search, Calendar, Download } from "lucide-react";
import { vanBanService, bieuMauService } from "../../services/api";

interface VanBan {
  id: number;
  tieuDe: string;
  soHieu?: string;
  loaiVanBan?: string;
  ngayBanHanh?: string;
  fileUrl?: string;
}

interface BieuMau {
  id: number;
  tenBieuMau: string;
  moTa?: string;
  fileUrl?: string;
  loai?: string;
}

export default function DocumentsPage() {
  const [tab, setTab] = useState<"vanban" | "bieumau">("vanban");
  const [vanBans, setVanBans] = useState<VanBan[]>([]);
  const [bieuMaus, setBieuMaus] = useState<BieuMau[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    setLoading(true);
    const svc = tab === "vanban"
      ? vanBanService.getList({ keyword: keyword || undefined })
      : bieuMauService.getList({ keyword: keyword || undefined });
    svc
      .then((res) => {
        const data = res.data?.data ?? res.data?.content ?? res.data ?? [];
        if (tab === "vanban") setVanBans(Array.isArray(data) ? data : []);
        else setBieuMaus(Array.isArray(data) ? data : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tab, keyword]);

  const list = tab === "vanban" ? vanBans : bieuMaus;

  const handleDownload = (url?: string) => {
    if (!url) return;
    window.open(url.startsWith("http") ? url : `https://tuoitre.vnkgu.edu.vn${url}`, "_blank");
  };

  return (
    <Page>
      <Header title="Văn bản & Biểu mẫu" showBackIcon />
      <div style={{ background: "#fff", borderBottom: "1px solid var(--border)", padding: "0 14px" }}>
        <div className="tab-switch" style={{ paddingTop: 10 }}>
          <button className={`tab-switch-btn${tab === "vanban" ? " active" : ""}`} onClick={() => setTab("vanban")} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5 }}><FileText size={14} /> Văn bản</button>
          <button className={`tab-switch-btn${tab === "bieumau" ? " active" : ""}`} onClick={() => setTab("bieumau")} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5 }}><ClipboardList size={14} /> Biểu mẫu</button>
        </div>
        <div style={{ padding: "10px 0", position: "relative" }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", display: "flex" }}><Search size={15} /></span>
          <input
            className="form-input"
            placeholder="Tìm kiếm..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ margin: 0, paddingLeft: 36 }}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 60 }}><Spinner /></div>
      ) : list.length === 0 ? (
        <div className="empty-state">
          <div className="icon">{tab === "vanban" ? <FileText size={44} /> : <ClipboardList size={44} />}</div>
          <p>Chưa có {tab === "vanban" ? "văn bản" : "biểu mẫu"} nào</p>
        </div>
      ) : (
        <div style={{ padding: "10px 12px 80px" }}>
          {tab === "vanban"
            ? vanBans.map((vb) => (
              <div key={vb.id} className="card" style={{ marginBottom: 10 }}>
                <div className="card-body">
                  <div style={{ display: "flex", gap: 10 }}>
                    <div style={{ color: "var(--primary)", flexShrink: 0 }}><FileText size={24} /></div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.4 }}>{vb.tieuDe}</p>
                      <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap", fontSize: 12, color: "var(--text-secondary)" }}>
                        {vb.soHieu && <span>Số: {vb.soHieu}</span>}
                        {vb.loaiVanBan && <span className="badge badge-blue" style={{ fontSize: 11 }}>{vb.loaiVanBan}</span>}
                        {vb.ngayBanHanh && <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Calendar size={11} /> {formatDate(vb.ngayBanHanh)}</span>}
                      </div>
                    </div>
                  </div>
                  {vb.fileUrl && (
                    <button
                      onClick={() => handleDownload(vb.fileUrl)}
                      className="btn btn-outline"
                      style={{ marginTop: 10, width: "100%", padding: "8px 0", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                    >
                      <Download size={14} /> Tải xuống
                    </button>
                  )}
                </div>
              </div>
            ))
            : bieuMaus.map((bm) => (
              <div key={bm.id} className="card" style={{ marginBottom: 10 }}>
                <div className="card-body">
                  <div style={{ display: "flex", gap: 10 }}>
                    <div style={{ color: "var(--primary)", flexShrink: 0 }}><ClipboardList size={24} /></div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.4 }}>{bm.tenBieuMau}</p>
                      {bm.moTa && <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>{bm.moTa}</p>}
                      {bm.loai && <span className="badge badge-blue" style={{ fontSize: 11, marginTop: 6, display: "inline-block" }}>{bm.loai}</span>}
                    </div>
                  </div>
                  {bm.fileUrl && (
                    <button
                      onClick={() => handleDownload(bm.fileUrl)}
                      className="btn btn-outline"
                      style={{ marginTop: 10, width: "100%", padding: "8px 0", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                    >
                      <Download size={14} /> Tải biểu mẫu
                    </button>
                  )}
                </div>
              </div>
            ))}
        </div>
      )}
    </Page>
  );
}

function formatDate(s: string) {
  if (!s) return "";
  const d = new Date(s);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}
