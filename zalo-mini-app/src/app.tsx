import React from "react";
import { Route } from "react-router-dom";
import { AnimationRoutes, ZMPRouter, BottomNavigation } from "zmp-ui";
import { Home, Target, ClipboardList, User } from "lucide-react";
import HomePage from "./pages/index";
import NewsDetailPage from "./pages/index/detail";
import ActivitiesPage from "./pages/activities";
import ActivityDetailPage from "./pages/activities/detail";
import AttendancePage from "./pages/attendance";
import ProfilePage from "./pages/profile";
import ServicesPage from "./pages/services";
import TrainingPointsPage from "./pages/training-points";
import VotingPage from "./pages/voting";
import VotingDetailPage from "./pages/voting/detail";
import DocumentsPage from "./pages/documents";
import ClubsPage from "./pages/clubs";
import SelfScanPage from "./pages/scan";
import ManagePage from "./pages/manage";
import AttendanceDetailPage from "./pages/manage/attendance-detail";
import MyActivitiesPage from "./pages/my-activities";
import BanHanhPage from "./pages/ban-hanh";
import TermsPage from "./pages/terms";
import CertificatesPage from "./pages/certificates";

export default function AppRouter() {
  return (
    <ZMPRouter>
      <AnimationRoutes>
        <Route path="/" element={<HomePage />} />
        <Route path="/news/:id" element={<NewsDetailPage />} />
        <Route path="/activities" element={<ActivitiesPage />} />
        <Route path="/activities/:id" element={<ActivityDetailPage />} />
        <Route path="/my-activities" element={<MyActivitiesPage />} />
        <Route path="/attendance" element={<AttendancePage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/training-points" element={<TrainingPointsPage />} />
        <Route path="/voting" element={<VotingPage />} />
        <Route path="/voting/:slug" element={<VotingDetailPage />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/forms" element={<DocumentsPage />} />
        <Route path="/clubs" element={<ClubsPage />} />
        <Route path="/self-scan" element={<SelfScanPage />} />
        <Route path="/manage" element={<ManagePage />} />
        <Route path="/manage/:activityId/attendance" element={<AttendanceDetailPage />} />
        <Route path="/ban-hanh" element={<BanHanhPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/certificates" element={<CertificatesPage />} />
      </AnimationRoutes>
      <BottomNavigation fixed>
        <BottomNavigation.Item key="home" label="Trang chủ" icon={<Home size={21} strokeWidth={2.1} />} linkTo="/" />
        <BottomNavigation.Item key="activities" label="Hoạt động" icon={<Target size={21} strokeWidth={2.1} />} linkTo="/activities" />
        <BottomNavigation.Item key="services" label="Dịch vụ" icon={<ClipboardList size={21} strokeWidth={2.1} />} linkTo="/services" />
        <BottomNavigation.Item key="profile" label="Cá nhân" icon={<User size={21} strokeWidth={2.1} />} linkTo="/profile" />
      </BottomNavigation>
    </ZMPRouter>
  );
}
