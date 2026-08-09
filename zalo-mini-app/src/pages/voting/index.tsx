import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header, Page, Spinner } from "zmp-ui";
import { Vote, Clock } from "lucide-react";
import { votingService } from "../../services/api";
import { imgUrl } from "../../utils/url";

interface VotingItem {
  id: number;
  tieuDe: string;
  slug: string;
  anhDaiDien: string;
  moTa: string;
  trangThai: string;
  ngayBatDau: string;
  ngayKetThuc: string;
  tongPhieu: number;
}

export default function VotingPage() {
  const navigate = useNavigate();
  const [list, setList] = useState<VotingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    votingService.getList()
      .then((res) => setList(res.data?.data ?? res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <Page>
      <Header title="Bình chọn & Cuộc thi" showBackIcon />
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 60 }}><Spinner /></div>
      ) : list.length === 0 ? (
        <div className="empty-state">
          <div className="icon"><Vote size={44} /></div>
          <p>Chưa có cuộc bình chọn nào</p>
        </div>
      ) : (
        <div className="page-content">
          {list.map((item) => (
            <div key={item.id} className="card" style={{ cursor: "pointer" }} onClick={() => navigate(`/voting/${item.slug}`)}>
              {item.anhDaiDien && (
                <img src={imgUrl(item.anhDaiDien)} alt={item.tieuDe} style={{ width: "100%", height: 150, objectFit: "cover", borderRadius: "10px 10px 0 0" }} onError={(e) => { (e.target as HTMLImageElement).style.display="none"; }} />
              )}
              <div className="card-body">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <p style={{ fontWeight: 700, fontSize: 15, flex: 1, paddingRight: 8 }}>{item.tieuDe}</p>
                  <span className={`badge ${item.trangThai === "DANG_DIEN_RA" ? "badge-green" : "badge-yellow"}`}>
                    {item.trangThai === "DANG_DIEN_RA" ? "Đang diễn ra" : "Đã kết thúc"}
                  </span>
                </div>
                {item.moTa && (
                  <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {item.moTa}
                  </p>
                )}
                <div style={{ display: "flex", gap: 12, marginTop: 8, fontSize: 12, color: "var(--text-secondary)" }}>
                  {item.ngayKetThuc && <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Clock size={12} /> HH: {formatDate(item.ngayKetThuc)}</span>}
                  {item.tongPhieu != null && <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Vote size={12} /> {item.tongPhieu} phiếu</span>}
                </div>
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
