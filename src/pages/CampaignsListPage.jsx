import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { campaignsList } from '../data/capturedHtml.js';

export default function CampaignsListPage() {
  const ref = useRef(null);
  const navigate = useNavigate();

  // Wire up campaign row clicks + Create Campaign button using event delegation.
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const handler = (e) => {
      const row = e.target.closest('tr.campaign-row');
      if (row) {
        const label = row.getAttribute('aria-label') || '';
        // Map by the aria-label "Open <campaign name>"
        // For the prototype, route everyone to a representative campaign detail page.
        // The first active campaign in the data is /46 — we'll use that as the canonical detail.
        e.preventDefault();
        navigate('/brand/tonypikora/campaigns/46');
        return;
      }
      const launch = e.target.closest('.launch-button');
      if (launch) {
        e.preventDefault();
        navigate('/brand/tonypikora/campaigns/new');
      }
    };
    root.addEventListener('click', handler);
    return () => root.removeEventListener('click', handler);
  }, [navigate]);

  return (
    <div ref={ref} dangerouslySetInnerHTML={{ __html: campaignsList }} />
  );
}
