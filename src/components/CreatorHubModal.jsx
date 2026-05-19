import { useEffect, useState } from 'react';
import { PolaroidPostcard, VintagePostcard } from './Postcards.jsx';
import {
  getCreatorState,
  savePostcard,
  getPaidRights,
  setPaidRights,
  paidRightsCount,
  setShortlisted,
  setInvitedNext,
  setRebooked,
  setRating,
  getPreferredStyle,
  setPreferredStyle,
  getCreatorMeta,
  PAID_TIERS,
  ORGANIC_TIERS,
  ORGANIC_FREE_DAYS,
  tierById,
  bundlePrice,
  expiryFromNow,
  getOrganicExt,
  setOrganicExt,
  fmtDate,
} from '../utils/postcardStorage.js';

const ANIM_DURATION_MS = 4600;
const MESSAGE_MAX = 140;
const SIGNOFF_MAX = 40;
const OFFER_ACCEPT_MS = 3000; // simulated creator response delay

function postKeyOf(post, idx) {
  return post?.postUrl || `${post?.platform || 'post'}#${idx}`;
}

/**
 * Creator hub. Left = carousel of all the creator's posts.
 * Right = three focused tabs (Postcard / Rights / Re-collab).
 * Scope: postcard & re-collab are per-creator; rights are per-POST and
 * always reflect the post currently shown in the carousel.
 */
export default function CreatorHubModal({
  campaignId,
  creator,
  posts,
  brandName,
  onClose,
  onChanged,
}) {
  const [tab, setTab] = useState('postcard');
  const [idx, setIdx] = useState(0);
  const [sending, setSending] = useState(false);
  const [animPostcard, setAnimPostcard] = useState(null);
  const [state, setState] = useState(() => getCreatorState(campaignId, creator.handle));

  const post = posts[idx] || posts[0] || {};
  const pKey = postKeyOf(post, idx);
  const allPostKeys = posts.map((p, i) => postKeyOf(p, i));

  function refresh() {
    setState(getCreatorState(campaignId, creator.handle));
    onChanged && onChanged();
  }

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape' && !sending) onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [sending, onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const onBackdrop = (e) => { if (e.target === e.currentTarget && !sending) onClose(); };

  // ---- send animation overlay ----
  if (sending && animPostcard) {
    const PC = animPostcard.style === 'polaroid' ? PolaroidPostcard : VintagePostcard;
    return (
      <div className="hub-overlay" role="dialog" aria-label="Sending postcard">
        <div className="send-anim-stage">
          <div className="send-anim__envelope">
            <div className="send-anim__envelope-back" />
            <div className="send-anim__card-clip">
              <div className="send-anim__card"><PC {...animPostcard.props} /></div>
            </div>
            <div className="send-anim__envelope-front" />
            <div className="send-anim__envelope-flap" />
            <div className="send-anim__envelope-seal" />
          </div>
          {Array.from({ length: 10 }).map((_, i) => (
            <span key={i} className={`send-anim__cp ${i % 2 ? 'send-anim__cp--square' : 'send-anim__cp--round'}`} />
          ))}
        </div>
      </div>
    );
  }

  const rightsForThisPost = getPaidRights(campaignId, creator.handle, pKey);
  const organicForThisPost = getOrganicExt(campaignId, creator.handle, pKey);
  const totalPaidPosts = paidRightsCount(campaignId, creator.handle);
  const creatorMeta = getCreatorMeta(creator.handle);

  // Apply a rights mutation to one post (scope 'post') or every post
  // from this creator (scope 'bundle').
  const keysForScope = (s) => (s === 'bundle' ? allPostKeys : [pKey]);

  return (
    <div className="hub-overlay" role="dialog" aria-label={`Creator hub for ${creator.name}`} onClick={onBackdrop}>
      <div className="hub-modal">
        <div className="hub-topbar">
          <span className="hub-avatar" aria-hidden="true">{creator.avatarInitial}</span>
          <div className="hub-id">
            <div className="hub-name">{creator.name}</div>
            <div className="hub-handle">{creator.handle} · {posts.length} post{posts.length === 1 ? '' : 's'}</div>
          </div>
          <button className="hub-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="hub-body">
          {/* LEFT: carousel */}
          <div className="hub-carousel">
            <div
              className="hub-carousel__thumb"
              style={post.thumbnailUrl ? { backgroundImage: `url(${post.thumbnailUrl})` } : undefined}
            >
              {post.platform && <span className="hub-carousel__platform">{post.platform}</span>}
              {posts.length > 1 && (
                <div className="hub-carousel__arrows">
                  <button aria-label="Previous post" onClick={() => setIdx((i) => (i - 1 + posts.length) % posts.length)}>‹</button>
                  <button aria-label="Next post" onClick={() => setIdx((i) => (i + 1) % posts.length)}>›</button>
                </div>
              )}
              {posts.length > 1 && (
                <div className="hub-carousel__dots">
                  {posts.map((_, i) => <span key={i} className={i === idx ? 'on' : ''} />)}
                </div>
              )}
            </div>
            <div className="hub-carousel__meta">
              <div className="hub-carousel__count">
                {post.platform || 'Post'} · {idx + 1} of {posts.length}{post.timeAgo ? ` · ${post.timeAgo}` : ''}
              </div>
              <p className="hub-carousel__caption">{post.caption || 'No caption.'}</p>
              {post.postUrl && (
                <a className="hub-carousel__link" href={post.postUrl} target="_blank" rel="noopener noreferrer">
                  View original post ↗
                </a>
              )}
            </div>
          </div>

          {/* RIGHT: tabs */}
          <div className="hub-right">
            <div className="hub-tabs" role="tablist">
              <button className={`hub-tab ${tab === 'postcard' ? 'on' : ''}`} onClick={() => setTab('postcard')} role="tab" aria-selected={tab === 'postcard'}>
                Postcard
                {state.postcard && <span className="hub-tab__dot" aria-label="done" />}
              </button>
              <button className={`hub-tab ${tab === 'rights' ? 'on' : ''}`} onClick={() => setTab('rights')} role="tab" aria-selected={tab === 'rights'}>
                Rights
                {totalPaidPosts > 0 && <span className="hub-tab__dot" aria-label="done" />}
              </button>
              <button className={`hub-tab ${tab === 'recollab' ? 'on' : ''}`} onClick={() => setTab('recollab')} role="tab" aria-selected={tab === 'recollab'}>
                Re-collab
                {(state.shortlisted || state.invitedNext || state.rebooked || state.rating > 0) && (
                  <span className="hub-tab__dot" aria-label="done" />
                )}
              </button>
            </div>

            <div className="hub-panel">
              {tab === 'postcard' && (
                <PostcardPanel
                  campaignId={campaignId}
                  creator={creator}
                  post={post}
                  brandName={brandName}
                  existing={state.postcard}
                  onStartSend={(payload) => { setAnimPostcard(payload); setSending(true); }}
                  finishSend={(record) => {
                    savePostcard(campaignId, creator.handle, record);
                    setSending(false);
                    setAnimPostcard(null);
                    refresh();
                  }}
                  animMs={ANIM_DURATION_MS}
                />
              )}
              {tab === 'rights' && (
                <RightsPanel
                  creator={creator}
                  creatorMeta={creatorMeta}
                  post={post}
                  postCount={posts.length}
                  paidRights={rightsForThisPost}
                  organicExt={organicForThisPost}
                  onExtendOrganic={(tier, sc) => {
                    const expiresAt = expiryFromNow(tier.months);
                    keysForScope(sc).forEach((k) =>
                      setOrganicExt(campaignId, creator.handle, k, {
                        tier: tier.id, price: tier.price,
                        extendedUntil: expiresAt, acquiredAt: new Date().toISOString(),
                        bundle: sc === 'bundle',
                      }));
                    refresh();
                  }}
                  onBuyPaidInstant={(tier, sc) => {
                    const price = sc === 'bundle' ? bundlePrice(tier.price, posts.length) : tier.price;
                    keysForScope(sc).forEach((k) =>
                      setPaidRights(campaignId, creator.handle, k, {
                        status: 'active', mode: 'instant', tier: tier.id, price,
                        acquiredAt: new Date().toISOString(),
                        expiresAt: expiryFromNow(tier.months),
                        bundle: sc === 'bundle',
                      }));
                    refresh();
                  }}
                  onSendPaidOffer={(tier, amount, sc) => {
                    const keys = keysForScope(sc);
                    keys.forEach((k) =>
                      setPaidRights(campaignId, creator.handle, k, {
                        status: 'pending', mode: 'offer', tier: tier.id, price: amount,
                        acquiredAt: new Date().toISOString(),
                        expiresAt: expiryFromNow(tier.months),
                        bundle: sc === 'bundle',
                      }));
                    refresh();
                    // Simulated creator response — accept after a short delay.
                    setTimeout(() => {
                      keys.forEach((k) => {
                        const cur = getPaidRights(campaignId, creator.handle, k);
                        if (cur && cur.status === 'pending') {
                          setPaidRights(campaignId, creator.handle, k, {
                            ...cur, status: 'active',
                            acquiredAt: new Date().toISOString(),
                            expiresAt: expiryFromNow(tierById(cur.tier).months),
                          });
                        }
                      });
                      refresh();
                    }, OFFER_ACCEPT_MS);
                  }}
                  onResetPaid={() => {
                    allPostKeys.forEach((k) => setPaidRights(campaignId, creator.handle, k, null));
                    refresh();
                  }}
                  onResetOrganic={() => {
                    allPostKeys.forEach((k) => setOrganicExt(campaignId, creator.handle, k, null));
                    refresh();
                  }}
                />
              )}
              {tab === 'recollab' && (
                <ReCollabPanel
                  creator={creator}
                  creatorMeta={creatorMeta}
                  shortlisted={state.shortlisted}
                  invitedNext={state.invitedNext}
                  rebooked={state.rebooked}
                  rating={state.rating}
                  onToggleShortlist={() => { setShortlisted(campaignId, creator.handle, !state.shortlisted); refresh(); }}
                  onToggleInvite={() => { setInvitedNext(campaignId, creator.handle, !state.invitedNext); refresh(); }}
                  onToggleRebook={() => { setRebooked(campaignId, creator.handle, !state.rebooked); refresh(); }}
                  onRate={(n) => { setRating(campaignId, creator.handle, n === state.rating ? 0 : n); refresh(); }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Postcard panel ---------------- */
function PostcardPanel({ campaignId, creator, post, brandName, existing, onStartSend, finishSend, animMs }) {
  const viewOnly = !!existing;
  const [style, setStyle] = useState(viewOnly ? existing.style : getPreferredStyle());
  const [message, setMessage] = useState(
    viewOnly ? existing.message : 'We loved what you made! Thank you for sharing it with your community.'
  );
  const [signoff, setSignoff] = useState(
    viewOnly ? existing.signoff : `xoxo the ${brandName} team`
  );

  const props = {
    thumbnailUrl: post?.thumbnailUrl,
    platform: post?.platform,
    brandName, message, signoff,
    date: viewOnly ? new Date(existing.sentAt) : new Date(),
  };
  const PC = style === 'polaroid' ? PolaroidPostcard : VintagePostcard;
  const changeStyle = (s) => { setStyle(s); if (!viewOnly) setPreferredStyle(s); };

  const send = () => {
    const record = { style, message, signoff, sentAt: new Date().toISOString() };
    onStartSend({ style, props });
    setTimeout(() => finishSend(record), animMs);
  };

  return (
    <div className="hub-postcard">
      <div className="hub-postcard__preview">
        <PC {...props} />
      </div>

      {viewOnly ? (
        <div className="hub-postcard__sent">
          <div className="hub-postcard__sent-badge">✓ Sent</div>
          <p>You sent {creator.name} a postcard on{' '}
            {new Date(existing.sentAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.</p>
        </div>
      ) : (
        <div className="hub-postcard__compose">
          <div className="hub-picker">
            <button className={`hub-picker__btn ${style === 'polaroid' ? 'on' : ''}`} onClick={() => changeStyle('polaroid')}>Polaroid keepsake</button>
            <button className={`hub-picker__btn ${style === 'vintage' ? 'on' : ''}`} onClick={() => changeStyle('vintage')}>Vintage × Pastel</button>
          </div>
          <label className="hub-field">
            <span>Your message</span>
            <textarea rows={3} maxLength={MESSAGE_MAX} value={message}
              onChange={(e) => setMessage(e.target.value)} placeholder="we love what you made!" />
            <small>{message.length} / {MESSAGE_MAX}</small>
          </label>
          <label className="hub-field">
            <span>Sign-off</span>
            <input type="text" maxLength={SIGNOFF_MAX} value={signoff}
              onChange={(e) => setSignoff(e.target.value)} placeholder={`xoxo the ${brandName} team`} />
          </label>
          <button className="hub-primary" onClick={send} disabled={!message.trim()}>♥ Send postcard</button>
        </div>
      )}
    </div>
  );
}

/* ---------------- Rights panel — education-first, Airbnb-clean ---------------- */

function fmtShort(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function RightsPanel({
  creator, creatorMeta, post, postCount,
  paidRights, organicExt,
  onExtendOrganic, onBuyPaidInstant, onSendPaidOffer, onResetPaid, onResetOrganic,
}) {
  const firstName = creator.name.split(' ')[0];
  const canBundle = postCount > 1;
  const [scope, setScope] = useState('post'); // 'post' | 'bundle'
  const bundled = scope === 'bundle' && canBundle;
  const scopeLabel = bundled ? `all ${postCount} posts` : 'this post';

  // price for a tier under the current scope (bundle = 30% off the total)
  const scopedPrice = (t) => (bundled ? bundlePrice(t.price, postCount) : t.price);
  const fullPrice = (t) => t.price * (bundled ? postCount : 1);
  const savings = (t) => fullPrice(t) - scopedPrice(t);

  // organic free window (30 days from now, for the demo)
  const freeUntil = (() => { const d = new Date(); d.setDate(d.getDate() + ORGANIC_FREE_DAYS); return d; })();

  // ---- organic extend (progressive disclosure) ----
  const [orgOpen, setOrgOpen] = useState(false);
  const [orgTierId, setOrgTierId] = useState('o6mo');
  const orgTier = ORGANIC_TIERS.find((t) => t.id === orgTierId) || ORGANIC_TIERS[1];

  // ---- paid ----
  const [paidTierId, setPaidTierId] = useState('3mo');
  const paidTier = PAID_TIERS.find((t) => t.id === paidTierId) || PAID_TIERS[1];
  const [offerOpen, setOfferOpen] = useState(false);
  const [touched, setTouched] = useState(false);
  const [amount, setAmount] = useState(scopedPrice(paidTier));
  const suggested = scopedPrice(paidTier);
  const offerAmt = touched ? amount : suggested;
  const lowball = offerAmt < Math.round(suggested * 0.85);
  const instant = creatorMeta.instantLicensing;

  return (
    <div className="rt">
      {/* scope segmented control */}
      {canBundle && (
        <div className="rt-scope" role="tablist" aria-label="Apply rights to">
          <button role="tab" aria-selected={!bundled} className={!bundled ? 'on' : ''} onClick={() => setScope('post')}>
            This post
          </button>
          <button role="tab" aria-selected={bundled} className={bundled ? 'on' : ''} onClick={() => setScope('bundle')}>
            All {postCount} posts
          </button>
        </div>
      )}

      {/* ---- ORGANIC ---- */}
      <section className="rt-card">
        <h3 className="rt-title">Where you can use this</h3>
        <p className="rt-sub">Your own channels — website, email, social posts, product pages.</p>

        {organicExt ? (
          <div className="rt-status rt-status--ok">
            <span className="rt-dot" /> Extended — yours until <b>{fmtShort(organicExt.extendedUntil)}</b>
            <button className="rt-undo" onClick={onResetOrganic}>Undo</button>
          </div>
        ) : (
          <>
            <div className="rt-status">
              <span className="rt-dot" /> Free for 30 days · until <b>{fmtShort(freeUntil.toISOString())}</b>
            </div>
            {!orgOpen ? (
              <button className="rt-link" onClick={() => setOrgOpen(true)}>Keep it longer →</button>
            ) : (
              <div className="rt-extend">
                <div className="rt-tiers">
                  {ORGANIC_TIERS.map((t) => (
                    <button
                      key={t.id}
                      className={`rt-tier ${orgTierId === t.id ? 'on' : ''}`}
                      aria-pressed={orgTierId === t.id}
                      onClick={() => setOrgTierId(t.id)}
                    >
                      {t.best && <span className="rt-tier__best">Popular</span>}
                      <span className="rt-tier__label">{t.label}</span>
                      <span className="rt-tier__price">${scopedPrice(t)}</span>
                      {bundled && savings(t) > 0 && <span className="rt-tier__save">save ${savings(t)}</span>}
                    </button>
                  ))}
                </div>
                <div className="rt-actions">
                  <button className="rt-ghost" onClick={() => setOrgOpen(false)}>Cancel</button>
                  <button className="rt-primary" onClick={() => onExtendOrganic(orgTier, scope)}>
                    Extend {scopeLabel} — ${scopedPrice(orgTier)}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* ---- PAID ---- */}
      <section className="rt-card">
        <h3 className="rt-title">Run it as an ad</h3>
        <p className="rt-sub">Advertise on Instagram, TikTok &amp; Facebook — feed, Stories, Reels.</p>

        {paidRights && paidRights.status === 'active' ? (
          <>
            <div className="rt-status rt-status--ok">
              <span className="rt-dot" /> Active — runnable until <b>{fmtShort(paidRights.expiresAt)}</b>
            </div>
            <dl className="rt-receipt">
              <div><dt>Covers</dt><dd>{paidRights.bundle ? `All ${postCount} posts` : 'This post'}</dd></div>
              <div><dt>Where</dt><dd>Instagram, TikTok &amp; Facebook ads</dd></div>
              <div><dt>Duration</dt><dd>{tierById(paidRights.tier).label}</dd></div>
              <div><dt>{paidRights.mode === 'instant' ? 'Paid' : 'Offer accepted'}</dt><dd>${paidRights.price}</dd></div>
            </dl>
            <button className="rt-ghost" onClick={onResetPaid}>Undo</button>
          </>
        ) : paidRights && paidRights.status === 'pending' ? (
          <>
            <div className="rt-status rt-status--wait">
              <span className="rt-spin" aria-hidden="true" /> Offer sent — ${paidRights.price} · awaiting {firstName}
            </div>
            <p className="rt-sub">{firstName} can accept, counter, or decline. We'll let you know.</p>
          </>
        ) : (
          <>
            <div className="rt-tiers">
              {PAID_TIERS.map((t) => (
                <button
                  key={t.id}
                  className={`rt-tier ${paidTierId === t.id ? 'on' : ''}`}
                  aria-pressed={paidTierId === t.id}
                  onClick={() => { setPaidTierId(t.id); setTouched(false); }}
                >
                  {t.best && <span className="rt-tier__best">Best value</span>}
                  <span className="rt-tier__label">{t.label}</span>
                  <span className="rt-tier__price">${scopedPrice(t)}</span>
                  {bundled && savings(t) > 0 && <span className="rt-tier__save">save ${savings(t)}</span>}
                </button>
              ))}
            </div>

            {instant ? (
              <>
                <p className="rt-note">⚡ {firstName} accepts instant licensing — active right away.</p>
                <button className="rt-primary rt-primary--full" onClick={() => onBuyPaidInstant(paidTier, scope)}>
                  Buy now — ${scopedPrice(paidTier)}
                </button>
              </>
            ) : !offerOpen ? (
              <>
                <p className="rt-note">{firstName} reviews each request. We'll suggest a fair price.</p>
                <button className="rt-primary rt-primary--full" onClick={() => { setOfferOpen(true); setTouched(false); }}>
                  Make an offer
                </button>
              </>
            ) : (
              <div className="rt-offer">
                <div className="rt-suggest">
                  <div className="rt-suggest__row">
                    <span>Suggested</span><b>${suggested}</b>
                  </div>
                  <p className="rt-suggest__why">
                    @{creator.handle.replace(/^@/, '')} ≈ {creatorMeta.followersLabel} followers · {creatorMeta.tier} tier · {creatorMeta.engagement}% engagement · {paidTier.label.toLowerCase()}{bundled ? ` · ${postCount} posts` : ''}.
                  </p>
                  <p className="rt-suggest__comp">
                    Comparable deals: ${Math.round(suggested * 0.8)}–${Math.round(suggested * 1.2)}
                  </p>
                </div>
                <label className="rt-amount">
                  <span>Your offer</span>
                  <div className="rt-amount__field">
                    <i>$</i>
                    <input type="number" min="0" step="5" value={offerAmt}
                      onChange={(e) => { setTouched(true); setAmount(Number(e.target.value)); }} />
                  </div>
                </label>
                {lowball && <p className="rt-warn">Below the typical range — {firstName} may decline.</p>}
                <div className="rt-actions">
                  <button className="rt-ghost" onClick={() => setOfferOpen(false)}>Cancel</button>
                  <button className="rt-primary" disabled={!offerAmt}
                    onClick={() => onSendPaidOffer(paidTier, offerAmt, scope)}>
                    Send offer — ${offerAmt}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      <p className="rt-fineprint">
        Trending audio may not be cleared for paid ads — organic reposts are always fine.
      </p>
    </div>
  );
}

/* ---------------- Re-collab panel — B1 (decision-first recap) + B2 (relationship) ---------------- */
function ReCollabPanel({
  creator, creatorMeta, shortlisted, invitedNext, rebooked, rating,
  onToggleShortlist, onToggleInvite, onToggleRebook, onRate,
}) {
  const first = creator.name.split(' ')[0];
  return (
    <div className="rt">
      <section className="rt-card">
        <h3 className="rt-title">Work with {first} again?</h3>
        <p className="rt-sub">How {first} did this campaign — and your history together.</p>

        {/* B1 — this-campaign performance recap */}
        <div className="rc-stats">
          <div className="rc-stat">
            <div className="n">{creatorMeta.avgViewsLabel}</div>
            <div className="l">Avg. views</div>
          </div>
          <div className="rc-stat">
            <div className="n">{creatorMeta.engagement}%</div>
            <div className="l">Engagement</div>
          </div>
          <div className={`rc-stat ${creatorMeta.deliveredOnTime ? '' : 'rc-stat--warn'}`}>
            <div className="n">{creatorMeta.deliveredOnTime ? 'On time' : 'Late'}</div>
            <div className="l">Delivery</div>
          </div>
        </div>

        {/* B2 — relationship summary */}
        <dl className="rc-rel">
          <div><dt>Campaigns together</dt><dd>{creatorMeta.campaignsTogether}</dd></div>
          <div><dt>Total invested</dt><dd>${creatorMeta.totalInvested.toLocaleString()}</dd></div>
          <div>
            <dt>Your rating</dt>
            <dd>
              <span className="rc-stars" role="radiogroup" aria-label="Rate this creator">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    className={`rc-star ${n <= rating ? 'on' : ''}`}
                    aria-label={`${n} star${n > 1 ? 's' : ''}`}
                    aria-pressed={n <= rating}
                    onClick={() => onRate(n)}
                  >★</button>
                ))}
                <span className="rc-rate-hint">{rating ? `${rating}/5 · private` : 'Rate (private)'}</span>
              </span>
            </dd>
          </div>
        </dl>
      </section>

      <section className="rt-card">
        <button
          className={`rt-primary rt-primary--full ${rebooked ? 'is-done' : ''}`}
          onClick={onToggleRebook}
        >
          {rebooked ? '✓ Rebooked — same brief & terms' : `↻ Rebook ${first} — same deal`}
        </button>
        <div className="rc-secondary">
          <button className={`rt-ghost ${shortlisted ? 'is-on' : ''}`} onClick={onToggleShortlist}>
            {shortlisted ? '★ Shortlisted' : '☆ Save to shortlist'}
          </button>
          <button className={`rt-ghost ${invitedNext ? 'is-on' : ''}`} onClick={onToggleInvite}>
            {invitedNext ? '✓ Invited to next' : '＋ Invite to next campaign'}
          </button>
        </div>
        <p className="rt-fineprint">
          Rebook reuses this campaign's brief and terms — you can tweak before it goes live.
        </p>
      </section>
    </div>
  );
}
