// Prototype-only persistence for per-creator post-campaign actions.
// Real implementation will hit an API; for the demo we just need state
// to survive reloads. Keyed by `${campaignId}::${creatorHandle}`.
//
// Scope: postcard / shortlist / invite are per-CREATOR; content rights are
// licensed per-POST, so `paidRights` is a map of postKey -> rights object:
//   { status:'pending'|'active', mode:'instant'|'offer',
//     tier:'1mo'|'3mo'|'6mo', price:Number, acquiredAt:ISO, expiresAt:ISO }

const STORAGE_KEY = 'benable.creatorActions.v3';

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeAll(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function makeKey(campaignId, creatorHandle) {
  return `${campaignId}::${creatorHandle}`;
}

const EMPTY = {
  postcard: null,
  shortlisted: false,
  invitedNext: false,
  rebooked: false,
  rating: 0,         // 0 = unrated, 1-5 stars (private to the brand)
  paidRights: {},   // postKey -> { status, mode, tier, price, acquiredAt, expiresAt, bundle? }
  organicExt: {},    // postKey -> { tier, price, extendedUntil, acquiredAt, bundle? }
};

export function getCreatorState(campaignId, creatorHandle) {
  return { ...EMPTY, ...(readAll()[makeKey(campaignId, creatorHandle)] || {}) };
}

function patchCreatorState(campaignId, creatorHandle, patch) {
  const all = readAll();
  const key = makeKey(campaignId, creatorHandle);
  all[key] = { ...EMPTY, ...(all[key] || {}), ...patch };
  writeAll(all);
}

// --- Postcard (per creator) ---
export function getPostcard(campaignId, creatorHandle) {
  return getCreatorState(campaignId, creatorHandle).postcard;
}
export function savePostcard(campaignId, creatorHandle, postcard) {
  patchCreatorState(campaignId, creatorHandle, { postcard });
}

// --- Paid rights (per post, rich object) ---
export function getPaidRights(campaignId, creatorHandle, postKey) {
  return getCreatorState(campaignId, creatorHandle).paidRights[postKey] || null;
}
export function setPaidRights(campaignId, creatorHandle, postKey, rights /* obj | null */) {
  const cur = getCreatorState(campaignId, creatorHandle).paidRights || {};
  const next = { ...cur };
  if (rights) next[postKey] = rights;
  else delete next[postKey];
  patchCreatorState(campaignId, creatorHandle, { paidRights: next });
}
// --- Organic extension (per post) ---
export function getOrganicExt(campaignId, creatorHandle, postKey) {
  return getCreatorState(campaignId, creatorHandle).organicExt[postKey] || null;
}
export function setOrganicExt(campaignId, creatorHandle, postKey, ext /* obj | null */) {
  const cur = getCreatorState(campaignId, creatorHandle).organicExt || {};
  const next = { ...cur };
  if (ext) next[postKey] = ext;
  else delete next[postKey];
  patchCreatorState(campaignId, creatorHandle, { organicExt: next });
}

// Count posts that have an active OR pending rights record.
export function paidRightsCount(campaignId, creatorHandle) {
  return Object.keys(getCreatorState(campaignId, creatorHandle).paidRights || {}).length;
}

// --- Re-collab (per creator) ---
export function setShortlisted(campaignId, creatorHandle, value) {
  patchCreatorState(campaignId, creatorHandle, { shortlisted: value });
}
export function setInvitedNext(campaignId, creatorHandle, value) {
  patchCreatorState(campaignId, creatorHandle, { invitedNext: value });
}
export function setRebooked(campaignId, creatorHandle, value) {
  patchCreatorState(campaignId, creatorHandle, { rebooked: value });
}
export function setRating(campaignId, creatorHandle, value) {
  patchCreatorState(campaignId, creatorHandle, { rating: value });
}

// --- Cross-creator surface ---
export function getRelationshipSummary(campaignId, creatorHandle) {
  const s = getCreatorState(campaignId, creatorHandle);
  const rights = Object.keys(s.paidRights || {}).length;
  const organic = Object.keys(s.organicExt || {}).length;
  return {
    thanked: !!s.postcard,
    paidRights: rights,
    organicExt: organic,
    shortlisted: !!s.shortlisted,
    invitedNext: !!s.invitedNext,
    rebooked: !!s.rebooked,
    rating: s.rating || 0,
    any: !!(s.postcard || rights || organic || s.shortlisted || s.invitedNext || s.rebooked || s.rating),
  };
}

// --- Demo helpers ---
export function getActionedCount() {
  return Object.values(readAll()).filter((s) => {
    if (!s) return false;
    const rights = s.paidRights && Object.keys(s.paidRights).length;
    const organic = s.organicExt && Object.keys(s.organicExt).length;
    return s.postcard || rights || organic || s.shortlisted || s.invitedNext || s.rebooked || s.rating;
  }).length;
}
export function clearAllActions() {
  localStorage.removeItem(STORAGE_KEY);
}

// Back-compat aliases (CampaignDetailPage / reset FAB import these names)
export const getPostcardCount = getActionedCount;
export const clearAllPostcards = clearAllActions;

const STYLE_PREF_KEY = 'benable.postcards.preferredStyle';
export function getPreferredStyle() {
  return localStorage.getItem(STYLE_PREF_KEY) || 'polaroid';
}
export function setPreferredStyle(style) {
  localStorage.setItem(STYLE_PREF_KEY, style);
}

// ---------------------------------------------------------------------------
// Deterministic demo creator metadata (NOT an "action" — survives the reset
// FAB). Synthesised from the handle so it's stable across reloads.
// ---------------------------------------------------------------------------
function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function getCreatorMeta(handle) {
  const h = hashString(handle || 'anon');
  // followers 8k–420k, deterministic
  const followers = 8000 + (h % 412) * 1000;
  let tier = 'Nano';
  if (followers >= 500000) tier = 'Macro';
  else if (followers >= 100000) tier = 'Mid';
  else if (followers >= 10000) tier = 'Micro';
  const engagement = (2 + ((h >> 3) % 60) / 10).toFixed(1); // 2.0–7.9 %
  // The main demo creator (@rmtfka) is intentionally an OFFER creator so the
  // suggested-price reasoning is what shows by default. Otherwise: hash bucket.
  const instantLicensing = handle === '@rmtfka' ? false : (h % 2 === 0);
  const followersLabel =
    followers >= 1000000 ? `${(followers / 1e6).toFixed(1)}M` : `${Math.round(followers / 1000)}K`;
  // Deterministic relationship + performance demo numbers (survive reset).
  const eng = Number(engagement);
  const avgViews = Math.round(followers * (0.9 + (h % 50) / 100)); // ~0.9–1.4× followers
  const campaignsTogether = 1 + (h % 4);                            // 1–4
  const totalInvested = 180 + (h % 14) * 90;                        // $180–$1,350
  const deliveredOnTime = (h >> 5) % 5 !== 0;                       // ~80% on time
  return {
    followers,
    followersLabel,
    tier,
    engagement: eng,
    instantLicensing,
    avgViews,
    avgViewsLabel: avgViews >= 1000000 ? `${(avgViews / 1e6).toFixed(1)}M` : `${Math.round(avgViews / 1000)}K`,
    campaignsTogether,
    totalInvested,
    deliveredOnTime,
  };
}

// Published paid tiers. Also used as the "suggested" offer price.
export const PAID_TIERS = [
  { id: '1mo', label: '1 month', months: 1, price: 50 },
  { id: '3mo', label: '3 months', months: 3, price: 100 },
  { id: '6mo', label: '6 months', months: 6, price: 200, best: true },
];

// Organic is free for 30 days; brands can extend it (cheaper than paid).
export const ORGANIC_TIERS = [
  { id: 'o3mo', label: '3 months', months: 3, price: 15 },
  { id: 'o6mo', label: '6 months', months: 6, price: 25, best: true },
  { id: 'o12mo', label: '12 months', months: 12, price: 40 },
];

export const ORGANIC_FREE_DAYS = 30;

export function tierById(id) {
  return (
    PAID_TIERS.find((t) => t.id === id) ||
    ORGANIC_TIERS.find((t) => t.id === id) ||
    PAID_TIERS[1]
  );
}

// Bundle = apply to every post from this creator at a 30% discount.
export function bundlePrice(perPostPrice, postCount) {
  const raw = perPostPrice * postCount * 0.7;
  return Math.round(raw / 5) * 5;
}
export function expiryFromDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export function expiryFromNow(months) {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString();
}

export function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}
