import React, { useEffect, useState } from "react";

import { Header, Page, Spinner } from "zmp-ui";
import { Landmark, Users, Check } from "lucide-react";
import { clbService } from "../../services/api";
import { isLoggedIn } from "../../services/auth";
import { imgUrl } from "../../utils/url";

interface CLB {
  maCLB: string;
  tenCLB: string;
  moTa?: string;
  anhDaiDien?: string;
  soLuongThanhVien?: number;
  soLuongToiDa?: number;
  trangThai?: string;
  daDangKy?: boolean;
}

export default function ClubsPage() {
  const loggedIn = isLoggedIn();
  const [clubs, setClubs] = useState<CLB[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    const listProm = clbService.getList().then((res) => res.data?.data ?? res.data ?? []);
    const memberProm = loggedIn
      ? clbService.getMyMembership().then((res) => {
          const list: any[] = res.data?.data ?? res.data ?? [];
          return new Set<string>(list.map((r) => r.maCLB ?? r.id?.toString()));
        }).catch(() => new Set<string>())
      : Promise.resolve(new Set<string>());
    Promise.all([listProm, memberProm])
      .then(([list, memberSet]) => {
        // API có thể trả trùng CLB (vd. tài khoản có nhiều vai trò trên cùng 1 CLB) — loại trùng theo maCLB
        const seen = new Set<string>();
        const deduped = list.filter((c: CLB) => {
          if (!c.maCLB || seen.has(c.maCLB)) return false;
          seen.add(c.maCLB);
          return true;
        });
        setClubs(deduped.map((c: CLB) => ({ ...c, daDangKy: memberSet.has(c.maCLB) })));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [loggedIn]);

  return (
    <Page>
      <Header title="Câu lạc bộ" showBackIcon />
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 60 }}><Spinner /></div>
      ) : clubs.length === 0 ? (
        <div className="empty-state"><div className="icon"><Landmark size={44} /></div><p>Chưa có câu lạc bộ nào</p></div>
      ) : (
        <div className="page-content" style={{ paddingBottom: 80 }}>
          {clubs.map((clb) => {
            const full = clb.soLuongToiDa ? clb.soLuongThanhVien! >= clb.soLuongToiDa : false;
            return (
              <div key={clb.maCLB} className="card" style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", gap: 12, padding: "12px 12px 0" }}>
                  {clb.anhDaiDien ? (
                    <img src={imgUrl(clb.anhDaiDien)} alt={clb.tenCLB} style={{ width: 64, height: 64, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} onError={(e) => { (e.target as HTMLImageElement).style.display="none"; }} />
                  ) : (
                    <div style={{ width: 64, height: 64, borderRadius: 10, background: "var(--primary-bg)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)", flexShrink: 0 }}><Landmark size={28} /></div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: 15 }}>{clb.tenCLB}</p>
                    {clb.moTa && <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{clb.moTa}</p>}
                    {clb.soLuongThanhVien != null && (
                      <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                        <Users size={12} /> {clb.soLuongThanhVien}{clb.soLuongToiDa ? `/${clb.soLuongToiDa}` : ""} thành viên
                      </p>
                    )}
                  </div>
                </div>
                <div style={{ padding: "8px 12px 12px" }}>
                  {clb.daDangKy ? (
                    <span className="badge badge-green" style={{ fontSize: 12, display: "inline-flex", alignItems: "center", gap: 3 }}><Check size={11} /> Đang là thành viên</span>
                  ) : full ? (
                    <span className="badge badge-yellow" style={{ fontSize: 12 }}>Hết chỗ</span>
                  ) : (
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Liên hệ BCH để tham gia</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Page>
  );
}
