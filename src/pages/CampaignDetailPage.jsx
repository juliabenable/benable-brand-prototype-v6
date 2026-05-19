import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  campaignDetailActive,
  campaignContentTab,
  campaignDetailsModalModal,
  addCreatorsModalModal,
} from '../data/capturedHtml.js';
import CreatorHubModal from '../components/CreatorHubModal.jsx';
import {
  getCreatorState,
  getActionedCount,
  clearAllActions,
  getRelationshipSummary,
} from '../utils/postcardStorage.js';

const BRAND_NAME = 'Pikora';

export default function CampaignDetailPage() {
  const [tab, setTab] = useState('Dashboard'); // 'Dashboard' | 'Content'
  const [modal, setModal] = useState(null); // null | 'details' | 'addCreators'
  const [hubTarget, setHubTarget] = useState(null); // { creator, posts } or null
  const [decorTick, setDecorTick] = useState(0);
  const ref = useRef(null);
  const navigate = useNavigate();
  const { id: campaignId = '0' } = useParams();

  const html = tab === 'Content' ? campaignContentTab : campaignDetailActive;

  // Active-tab class patch.
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    root.querySelectorAll('.workflow-dashboard-tab').forEach((b) => {
      b.classList.toggle('active', b.textContent.trim() === tab);
    });
  }, [tab, html]);

  // ----- Decorate Content tiles ("Thanked" badge) and the Dashboard
  //       creator list (cross-creator relationship status) -----
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    if (tab === 'Content') {
      root.querySelectorAll('.content-post-card').forEach((card) => decorateCard(card, campaignId));
    } else {
      root.querySelectorAll('.creator-management-table tbody tr').forEach((tr) => decorateDashboardRow(tr, campaignId));
    }
  }, [tab, html, campaignId, decorTick, hubTarget]);

  // ----- Click delegation -----
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const onClick = (e) => {
      // Any click on a content-post-card opens the creator hub.
      const card = e.target.closest('.content-post-card');
      if (card) {
        e.preventDefault();
        e.stopPropagation();
        openHub(card, root);
        return;
      }
      const tabBtn = e.target.closest('.workflow-dashboard-tab');
      if (tabBtn) {
        e.preventDefault();
        const label = tabBtn.textContent.trim();
        if (label === 'Dashboard' || label === 'Content') setTab(label);
        return;
      }
      const headerEdit = e.target.closest('.workflow-header-edit-btn');
      if (headerEdit) {
        e.preventDefault();
        setModal('details');
        return;
      }
      const button = e.target.closest('button');
      if (button && button.textContent.trim() === 'Add Creators') {
        e.preventDefault();
        setModal('addCreators');
        return;
      }
      const back = e.target.closest('.flow-backlink, .workflow-back-link');
      if (back) {
        e.preventDefault();
        navigate('/brand/tonypikora/campaigns');
      }
    };
    root.addEventListener('click', onClick);
    return () => root.removeEventListener('click', onClick);
  }, [navigate, html, tab]);

  // Open the hub for the clicked card's creator, gathering ALL their posts.
  function openHub(clickedCard, root) {
    const clicked = extractCard(clickedCard);
    if (!clicked) return;
    const allCards = Array.from(root.querySelectorAll('.content-post-card'));
    const posts = allCards
      .map(extractCard)
      .filter((c) => c && c.creator.handle === clicked.creator.handle)
      .map((c) => c.post);
    setHubTarget({ creator: clicked.creator, posts });
  }

  function onChanged() {
    setDecorTick((t) => t + 1);
  }

  function resetAll() {
    clearAllActions();
    setDecorTick((t) => t + 1);
  }

  const actionedCount = getActionedCount(); // re-reads on every render

  return (
    <>
      <div ref={ref} dangerouslySetInnerHTML={{ __html: html }} />
      {modal === 'details' && (
        <ModalLayer html={campaignDetailsModalModal} onClose={() => setModal(null)} />
      )}
      {modal === 'addCreators' && (
        <ModalLayer html={addCreatorsModalModal} onClose={() => setModal(null)} />
      )}
      {hubTarget && (
        <CreatorHubModal
          campaignId={campaignId}
          brandName={BRAND_NAME}
          creator={hubTarget.creator}
          posts={hubTarget.posts}
          onClose={() => setHubTarget(null)}
          onChanged={onChanged}
        />
      )}
      {actionedCount > 0 && !hubTarget && (
        <button
          type="button"
          className="reset-thanks-fab"
          onClick={resetAll}
          aria-label="Reset all creator actions (demo only)"
          title="Reset all creator actions — demo only"
        >
          <span aria-hidden="true" className="reset-thanks-fab__icon">↺</span>
          Reset {actionedCount} creator{actionedCount === 1 ? '' : 's'}
          <span className="reset-thanks-fab__hint">demo</span>
        </button>
      )}
    </>
  );
}

/* Add a small "Thanked" badge to a card if a postcard was sent to that creator. */
function decorateCard(card, campaignId) {
  if (getComputedStyle(card).position === 'static') {
    card.style.position = 'relative';
  }
  card.querySelector('.thanked-badge')?.remove();

  const info = extractCard(card);
  if (!info) return;
  const st = getCreatorState(campaignId, info.creator.handle);
  if (!st.postcard) return;

  const date = new Date(st.postcard.sentAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const badge = document.createElement('span');
  badge.className = 'thanked-badge';
  badge.innerHTML = `<span class="thanked-badge__check">✓</span> Thanked · ${date}`;
  badge.setAttribute('aria-label', `Postcard sent to ${info.creator.name} on ${date}`);
  card.appendChild(badge);
}

/* Cross-creator surface: show relationship status on each Dashboard row
 * whose creator has had any post-campaign action taken. */
function decorateDashboardRow(tr, campaignId) {
  tr.querySelector('.relationship-strip')?.remove();
  const handle = tr.querySelector('.creator-table-person-copy small')?.textContent.trim();
  if (!handle) return;
  const s = getRelationshipSummary(campaignId, handle);
  if (!s.any) return;

  const chips = [];
  if (s.thanked) chips.push('<span class="rel-chip rel-chip--thanked">♥ Thanked</span>');
  if (s.paidRights > 0) chips.push(`<span class="rel-chip rel-chip--rights">⊛ Paid rights · ${s.paidRights}</span>`);
  if (s.shortlisted) chips.push('<span class="rel-chip rel-chip--save">★ Shortlisted</span>');
  if (s.invitedNext) chips.push('<span class="rel-chip rel-chip--invite">＋ Invited next</span>');

  const noteCell = tr.querySelector('.creator-management-note-col');
  const host = noteCell || tr.querySelector('td:nth-child(3)') || tr.lastElementChild;
  if (!host) return;
  const strip = document.createElement('div');
  strip.className = 'relationship-strip';
  strip.innerHTML = chips.join('');
  host.appendChild(strip);
}

function extractCard(card) {
  const nameEl = card.querySelector('.content-post-card__name');
  const handleEl = card.querySelector('.content-post-card__handle');
  if (!nameEl || !handleEl) return null;
  const avatarText =
    card.querySelector('.content-post-card__avatar')?.textContent.trim() ||
    nameEl.textContent.trim().charAt(0);
  const thumb = card.querySelector('.content-post-card__thumb-image')?.getAttribute('src') || '';
  const badge = card.querySelector('.content-post-card__badge')?.textContent.trim() || '';
  const caption = card.querySelector('.content-post-card__caption')?.textContent.trim() || '';
  const timeAgo = card.querySelector('.content-post-card__time')?.textContent.trim() || '';
  const postUrl = card.getAttribute('href') || '';
  return {
    creator: {
      name: nameEl.textContent.trim(),
      handle: handleEl.textContent.trim(),
      avatarInitial: avatarText.charAt(0).toUpperCase(),
    },
    post: { thumbnailUrl: thumb, platform: badge, caption, timeAgo, postUrl },
  };
}

function ModalLayer({ html, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const onClick = (e) => {
      if (e.target.closest('.brand-portal-modal__backdrop, .brand-portal-modal__close')) {
        e.preventDefault();
        onClose();
      }
    };
    root.addEventListener('click', onClick);
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { root.removeEventListener('click', onClick); window.removeEventListener('keydown', onKey); };
  }, [onClose]);
  return <div ref={ref} dangerouslySetInnerHTML={{ __html: html }} />;
}
