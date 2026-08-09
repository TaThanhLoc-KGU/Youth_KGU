import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Header, Page, Spinner, useSnackbar } from "zmp-ui";
import { Frown, Clock, Vote, Upload, Trophy, Check } from "lucide-react";
import { votingService } from "../../services/api";
import { isLoggedIn } from "../../services/auth";
import { imgUrl } from "../../utils/url";
import SubmitEntryModal from "./SubmitEntryModal";

interface ThiSinh {
  id: number;
  tenThiSinh: string;
  anhDaiDien?: string;
  moTa?: string;
  soVote?: number;
  soPhieu?: number;
  daVote?: boolean;
}

interface BinhChon {
  id: number;
  tieuDe: string;
  moTa: string;
  anhBia?: string;
  anhDaiDien?: string;
  trangThai: string;
  ngayBatDau: string;
  ngayKetThuc: string;
  tongSoVote?: number;
  tongPhieu?: number;
  chiVoteMotLan?: boolean;
  dangMoVote?: boolean;
  choPhepNopBai?: boolean;
  hanNop?: string;
  danhSachThiSinh: ThiSinh[];
}

export default function VotingDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { openSnackbar } = useSnackbar();
  const loggedIn = isLoggedIn();
  const [contest, setContest] = useState<BinhChon | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState<number | null>(null);
  const [myVote, setMyVote] = useState<number | null>(null);
  const [showSubmit, setShowSubmit] = useState(false);

  const fetchDetail = () => {
    if (!slug) return Promise.resolve();
    return votingService.getDetail(slug)
      .then((res) => {
        const data: BinhChon = res.data?.data ?? res.data;
        setContest(data);
        const voted = data?.danhSachThiSinh?.find((t) => t.daVote);
        if (voted) setMyVote(voted.id);
      })
      .catch(() => {});
  };

  useEffect(() => {
    setLoading(true);
    fetchDetail().finally(() => setLoading(false));
  }, [slug]);

  const handleVote = async (thiSinhId: number) => {
    if (!loggedIn) {
      openSnackbar({ text: "Vui lòng đăng nhập để bình chọn", type: "warning", duration: 2000 });
      return;
    }
    if (myVote) {
      openSnackbar({ text: "Bạn đã bình chọn rồi", type: "warning", duration: 2000 });
      return;
    }
    if (!contest?.id) return;
    setVoting(thiSinhId);
    try {
      await votingService.vote(contest.id, thiSinhId);
      setMyVote(thiSinhId);
      setContest((prev) => prev ? {
        ...prev,
        danhSachThiSinh: prev.danhSachThiSinh.map((t) =>
          t.id === thiSinhId ? { ...t, soVote: (t.soVote ?? t.soPhieu ?? 0) + 1, daVote: true } : t
        ),
      } : prev);
      openSnackbar({ text: "Bình chọn thành công! 🎉", type: "success", duration: 2000 });
    } catch (err: any) {
      openSnackbar({ text: err.response?.data?.message ?? "Bình chọn thất bại", type: "error", duration: 2000 });
    } finally {
      setVoting(null);
    }
  };

  const thiSinhs = contest?.danhSachThiSinh ?? [];
  const maxPhieu = Math.max(...thiSinhs.map((t) => t.soVote ?? t.soPhieu ?? 0), 1);
  const isOpen = contest?.dangMoVote || contest?.trangThai === "DANG_MO" || contest?.trangThai === "DANG_DIEN_RA";
  const coverImg = contest?.anhBia || contest?.anhDaiDien;

  return (
    <Page>
      <Header title="Bình chọn" showBackIcon />
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 60 }}><Spinner /></div>
      ) : !contest ? (
        <div className="empty-state"><div className="icon"><Frown size={44} /></div><p>Không tìm thấy</p></div>
      ) : (
        <div style={{ paddingTop: "var(--header-height)" }}>
          {coverImg && (
            <img src={imgUrl(coverImg)} alt={contest.tieuDe} style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover" }} onError={(e) => { (e.target as HTMLImageElement).style.display="none"; }} />
          )}
          <div style={{ padding: "14px 14px 0" }}>
            <h1 style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.4 }}>{contest.tieuDe}</h1>
            <div style={{ display: "flex", gap: 10, marginTop: 8, flexWrap: "wrap", fontSize: 12, color: "var(--text-secondary)" }}>
              <span className={`badge ${isOpen ? "badge-green" : "badge-yellow"}`}>
                {isOpen ? "Đang diễn ra" : "Đã kết thúc"}
              </span>
              {contest.ngayKetThuc && <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Clock size={12} /> HH: {formatDate(contest.ngayKetThuc)}</span>}
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Vote size={12} /> {contest.tongSoVote ?? contest.tongPhieu ?? 0} phiếu</span>
            </div>
            {contest.moTa && <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 10, lineHeight: 1.6 }}>{contest.moTa}</p>}

            {contest.choPhepNopBai && (!contest.hanNop || new Date(contest.hanNop) > new Date()) && (
              <button
                className="btn btn-primary"
                style={{ marginTop: 12 }}
                onClick={() => {
                  if (!loggedIn) {
                    openSnackbar({ text: "Vui lòng đăng nhập để nộp bài dự thi", type: "warning", duration: 2000 });
                    return;
                  }
                  setShowSubmit(true);
                }}
              >
                <Upload size={16} /> Nộp bài dự thi
              </button>
            )}
          </div>

          <div style={{ padding: "14px 14px 80px" }}>
            <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Danh sách thí sinh ({thiSinhs.length})</p>
            {thiSinhs.length === 0 && <div className="empty-state"><div className="icon"><Trophy size={44} /></div><p>Chưa có thí sinh</p></div>}
            {thiSinhs.map((ts) => {
              const soPhieu = ts.soVote ?? ts.soPhieu ?? 0;
              const pct = Math.round((soPhieu / maxPhieu) * 100);
              const isMyVote = myVote === ts.id;
              return (
                <div key={ts.id} className="card" style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", gap: 12, padding: "12px 12px 0" }}>
                    {ts.anhDaiDien ? (
                      <img src={imgUrl(ts.anhDaiDien)} alt={ts.tenThiSinh} style={{ width: 60, height: 60, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} onError={(e) => { (e.target as HTMLImageElement).style.display="none"; }} />
                    ) : (
                      <div style={{ width: 60, height: 60, borderRadius: 8, background: "var(--primary-bg)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)", flexShrink: 0 }}><Trophy size={24} /></div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 700, fontSize: 14 }}>{ts.tenThiSinh}</p>
                      {ts.moTa && <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{ts.moTa}</p>}
                    </div>
                  </div>

                  <div style={{ padding: "10px 12px 12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-secondary)", marginBottom: 4 }}>
                      <span>{soPhieu} phiếu</span>
                      <span>{pct}%</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: "var(--border)", overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 3, width: `${pct}%`, background: isMyVote ? "var(--success)" : "var(--primary)", transition: "width .4s" }} />
                    </div>

                    {isOpen && (
                      <button
                        onClick={() => handleVote(ts.id)}
                        disabled={!!myVote || voting === ts.id}
                        style={{
                          marginTop: 10, width: "100%", padding: "8px 0", borderRadius: 8, border: "none", cursor: myVote ? "default" : "pointer",
                          fontWeight: 600, fontSize: 13,
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                          background: isMyVote ? "var(--success)" : myVote ? "var(--border)" : "var(--primary)",
                          color: myVote && !isMyVote ? "var(--text-muted)" : "#fff",
                        }}
                      >
                        {voting === ts.id ? "Đang gửi..." : isMyVote ? <><Check size={13} /> Đã bình chọn</> : myVote ? "Đã bình chọn" : "Bình chọn"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {contest && (
        <SubmitEntryModal
          visible={showSubmit}
          cuocThiId={contest.id}
          onClose={() => setShowSubmit(false)}
          onSubmitted={fetchDetail}
        />
      )}
    </Page>
  );
}

function formatDate(s: string) {
  if (!s) return "";
  const d = new Date(s);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}
