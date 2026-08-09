import React, { useEffect, useRef, useState } from "react";
import { Header, Page, Spinner } from "zmp-ui";
import { Search, ClipboardList, Calendar, User, Users, FileText } from "lucide-react";
import { banHanhService } from "../../services/api";
import { BASE } from "../../utils/url";

interface BanHanh {
  id: number;
  maHoatDong: string;
  tenHoatDong?: string;
  tieuDe?: string;
  ngayBanHanh: string;
  nguoiBanHanh?: string;
  fileUrl?: string;
  trangThai: string;
  tongSinhVien?: number;
  soLuong?: number;
}

export default function BanHanhPage() {
  const [items, setItems] = useState<BanHanh[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState("");
  const searchTimer = useRef<any>(null);

  const load = (pg: number, kw: string, replace: boolean) => {
    if (pg === 0) setLoading(true); else setLoadingMore(true);
    banHanhService.getList({ page: pg, size: 15, search: kw || undefined })
      .then((res) => {
        const data = res.data?.data;
        const content: BanHanh[] = data?.content ?? data ?? [];
        const last: boolean = data?.last ?? content.length < 15;
        if (replace) setItems(content); else setItems((prev) => [...prev, ...content]);
        setHasMore(!last);
        setPage(pg);
      })
      .catch(() => {})
      .finally(() => { setLoading(false); setLoadingMore(false); });
  };

  useEffect(() => { load(0, "", true); }, []);

  const handleSearch = (v: string) => {
    setSearch(v);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => load(0, v, true), 400);
  };

  const handleDownload = (item: BanHanh) => {
    const url = `${BASE}/api/public/ban-hanh/${item.id}/download`;
    window.open(url, "_blank");
  };

  return (
    <Page>
      <Header title="Danh sách ban hành" showBackIcon />
      <div className="page-content">
        <div className="search-bar">
          <span className="search-icon"><Search size={16} /></span>
          <input
            placeholder="Tìm kiếm..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", paddingTop: 60 }}><Spinner /></div>
        ) : items.length === 0 ? (
          <div className="empty-state"><div className="icon"><ClipboardList size={44} /></div><p>Chưa có danh sách nào</p></div>
        ) : (
          <>
            {items.map((item) => (
              <div key={item.id} className="card" style={{ marginBottom: 10 }}>
                <div style={{ padding: "12px 14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.4 }}>
                        {item.tieuDe ?? item.tenHoatDong ?? item.maHoatDong}
                      </p>
                      <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                        <ClipboardList size={12} /> {item.maHoatDong}
                      </p>
                      <div style={{ display: "flex", gap: 12, marginTop: 6, flexWrap: "wrap", fontSize: 11, color: "var(--text-muted)" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Calendar size={11} /> {formatDate(item.ngayBanHanh)}</span>
                        {item.nguoiBanHanh && <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><User size={11} /> {item.nguoiBanHanh}</span>}
                        {(item.tongSinhVien ?? item.soLuong) != null && (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Users size={11} /> {item.tongSinhVien ?? item.soLuong} SV</span>
                        )}
                      </div>
                    </div>
                    <span className={`badge ${item.trangThai === "DA_BAN_HANH" || item.trangThai === "ACTIVE" ? "badge-green" : item.trangThai === "HUY" ? "badge-red" : "badge-yellow"}`} style={{ flexShrink: 0, fontSize: 11 }}>
                      {item.trangThai === "DA_BAN_HANH" || item.trangThai === "ACTIVE" ? "Đã ban hành" : item.trangThai === "HUY" ? "Đã hủy" : item.trangThai}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDownload(item)}
                    style={{ marginTop: 10, width: "100%", padding: "8px 0", borderRadius: 8, background: "var(--primary-bg)", color: "var(--primary)", fontWeight: 600, fontSize: 13, border: "1.5px solid var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                  >
                    <FileText size={14} /> Xem / Tải file PDF
                  </button>
                </div>
              </div>
            ))}

            {hasMore && (
              <button
                onClick={() => load(page + 1, search, false)}
                disabled={loadingMore}
                style={{ width: "100%", padding: "10px 0", borderRadius: "var(--radius-sm)", background: "var(--card-bg)", border: "1.5px solid var(--border)", fontWeight: 600, fontSize: 13, marginTop: 4, color: "var(--text-secondary)" }}
              >
                {loadingMore ? "Đang tải..." : "Xem thêm"}
              </button>
            )}
          </>
        )}
      </div>
    </Page>
  );
}

function formatDate(s: string) {
  if (!s) return "";
  const d = new Date(s);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}
