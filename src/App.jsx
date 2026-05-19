import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Shell from './shell/Shell.jsx';
import LoginPage from './pages/LoginPage.jsx';
import CampaignsListPage from './pages/CampaignsListPage.jsx';
import CampaignDetailPage from './pages/CampaignDetailPage.jsx';
import CreateCampaignPage from './pages/CreateCampaignPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import SoonPage from './pages/SoonPage.jsx';

export default function App() {
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  const withShell = (el) => (
    <Shell
      accountMenuOpen={accountMenuOpen}
      onToggleAccountMenu={() => setAccountMenuOpen((v) => !v)}
    >
      {el}
    </Shell>
  );

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/brand/tonypikora/campaigns" replace />} />
      <Route path="/brand/login" element={<LoginPage />} />
      <Route path="/brand/tonypikora" element={withShell(<CampaignsListPage />)} />
      <Route path="/brand/tonypikora/campaigns" element={withShell(<CampaignsListPage />)} />
      <Route path="/brand/tonypikora/campaigns/new" element={withShell(<CreateCampaignPage />)} />
      <Route path="/brand/tonypikora/campaigns/:id" element={withShell(<CampaignDetailPage />)} />
      <Route path="/brand/tonypikora/settings" element={withShell(<SettingsPage />)} />
      <Route path="/brand/tonypikora/ugc" element={withShell(<SoonPage />)} />
      <Route path="/brand/tonypikora/alerts" element={withShell(<SoonPage />)} />
      <Route path="/brand/tonypikora/intelligence" element={withShell(<SoonPage />)} />
      <Route path="*" element={<Navigate to="/brand/tonypikora/campaigns" replace />} />
    </Routes>
  );
}
