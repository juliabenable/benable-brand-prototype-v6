import { useState } from 'react';
import {
  getCreatorMeta,
  getPostcard,
  getReCollab,
  isPositiveReCollab,
  getPaidRights,
  setPaidRights,
  PAID_TIERS,
  expiryFromNow,
} from '../utils/postcardStorage.js';

/**
 * v6 Wrap-up tab — appears when ≥50% of creators are thanked OR the brand
 * manually closes the campaign. Celebratory recap + finish-thank-yous nudge
 * + a per-post paid-rights select-list (scoped to creators the brand wants
 * to work with again) + a monthly-proposal CTA.
 *
 * Props:
 *   campaignId, brandName, creatorsWithPosts: [{ creator, posts, allPostKeys }],
 *   onOpenThanks(creator, posts), onChanged()
 */
export default function WrapUpPanel({
  campaignId,
  brandName,
  creatorsWithPosts,
  onOpenThanks,
  onChanged,
  onBack,
}) {
  // ----- top-line numbers (deterministic demo) -----
  const allMeta = creatorsWithPosts.map((c) => ({
    ...c,
    meta: getCreatorMeta(c.creator.handle),
    state: {
      postcard: getPostcard(campaignId, c.creator.handle),
      reCollab: getReCollab(campaignId, c.creator.handle),
    },
  }));
  const creatorCount = allMeta.length;
  const postCount = allMeta.reduce((s, c) => s + c.posts.length, 0);
  const totalReach = allMeta.reduce((s, c) => s + c.meta.avgViews * c.posts.length, 0);
  const avgEng = allMeta.length
    ? (allMeta.reduce((s, c) => s + c.meta.engagement, 0) / allMeta.length).toFixed(1)
    : 0;
  const reachLabel = totalReach >= 1000000
    ? `${(totalReach / 1e6).toFixed(1)}M`
    : `${Math.round(totalReach / 1000)}K`;

  const thanked = allMeta.filter((c) => !!c.state.postcard);
  const unthanked = allMeta.filter((c) => !c.state.postcard);

  // creators the brand wants to keep working with → posts eligible for paid rights upsell
  const positiveCreators = allMeta.filter((c) => isPositiveReCollab(c.state.reCollab));

  return (
    <div className="wu">
      {/* ---- mini nav ---- */}
      {onBack && (
        <nav className="wu-nav">
          <button type="button" className="wu-nav__back" onClick={onBack}>← Back to campaign</button>
          <div className="wu-nav__tabs" role="tablist">
            <button type="button" className="wu-nav__tab" onClick={() => onBack('Dashboard')}>Dashboard</button>
            <button type="button" className="wu-nav__tab" onClick={() => onBack('Content')}>Content</button>
            <button type="button" className="wu-nav__tab on" aria-selected="true">★ Wrap-up</button>
          </div>
        </nav>
      )}

      {/* ---- hero recap ---- */}
      <section className="wu-hero">
        <div className="wu-hero__kicker">★ Campaign complete</div>
        <h2 className="wu-hero__title">Your campaign is done. You crushed it.</h2>
        <p className="wu-hero__sub">Here's what {creatorCount} creator{creatorCount === 1 ? '' : 's'} delivered.</p>
        <div className="wu-stats">
          <div className="wu-stat"><div className="n">{reachLabel}</div><div className="l">Total reach</div></div>
          <div className="wu-stat"><div className="n">{postCount}</div><div className="l">Pieces of content</div></div>
          <div className="wu-stat"><div className="n">{avgEng}%</div><div className="l">Avg. engagement</div></div>
          <div className="wu-stat"><div className="n">{thanked.length}/{creatorCount}</div><div className="l">Thanked</div></div>
        </div>
      </section>

      {/* ---- finish your thank-yous ---- */}
      {unthanked.length > 0 && (
        <section className="wu-card">
          <div className="wu-card__head">
            <h3>Finish your thank-yous</h3>
            <p>{unthanked.length} creator{unthanked.length === 1 ? '' : 's'} haven't heard from you yet.</p>
          </div>
          <ul className="wu-list">
            {unthanked.map((c) => (
              <li key={c.creator.handle}>
                <span className="wu-list__av">{c.creator.avatarInitial}</span>
                <span className="wu-list__who">
                  <b>{c.creator.name}</b>
                  <small>{c.creator.handle} · {c.posts.length} post{c.posts.length === 1 ? '' : 's'}</small>
                </span>
                <button className="wu-mini" onClick={() => onOpenThanks(c.creator, c.posts)}>♥ Say thanks</button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ---- paid rights select-list (only from re-collab YES creators) ---- */}
      <PaidRightsSection
        campaignId={campaignId}
        creators={positiveCreators}
        onChanged={onChanged}
      />

      {/* ---- monthly proposal CTA ---- */}
      <section className="wu-cta">
        <div>
          <h3>Want to keep this going?</h3>
          <p>Get a proposal for a monthly creator program — recurring drops, the creators you loved, no per-campaign setup.</p>
        </div>
        <button className="wu-cta__btn">Request a proposal</button>
      </section>

      <p className="wu-fineprint">
        Best content + creator-rating recaps coming soon. Need rights help in the meantime? <a href="mailto:katie@benable.com">Email Katie</a>.
      </p>
    </div>
  );
}

/* ---------------- Paid rights select-list ---------------- */
function PaidRightsSection({ campaignId, creators, onChanged }) {
  // flatten to per-post rows, only for creators with reCollab in {later, favorite}
  const rows = [];
  creators.forEach((c) => {
    c.posts.forEach((post, i) => {
      const postKey = post.postUrl || `${post.platform || 'post'}#${i}`;
      const current = getPaidRights(campaignId, c.creator.handle, postKey);
      rows.push({ creator: c.creator, post, postKey, current });
    });
  });

  // selection: postKey -> true
  const [selected, setSelected] = useState(() => {
    const init = {};
    rows.forEach((r) => { if (r.current) init[`${r.creator.handle}::${r.postKey}`] = true; });
    return init;
  });
  const [tierId, setTierId] = useState('3mo');
  const tier = PAID_TIERS.find((t) => t.id === tierId) || PAID_TIERS[1];

  const toggle = (k) => setSelected((s) => ({ ...s, [k]: !s[k] }));
  const selectedCount = Object.values(selected).filter(Boolean).length;
  const totalPrice = selectedCount * tier.price;

  const submit = () => {
    rows.forEach((r) => {
      const k = `${r.creator.handle}::${r.postKey}`;
      if (selected[k]) {
        setPaidRights(campaignId, r.creator.handle, r.postKey, {
          status: 'active', mode: 'instant', tier: tier.id, price: tier.price,
          acquiredAt: new Date().toISOString(),
          expiresAt: expiryFromNow(tier.months),
        });
      }
    });
    onChanged && onChanged();
    // tiny inline confirmation via alert-equivalent (kept lightweight for prototype)
    setTimeout(() => alert(`Request received — Katie will reach out about paid rights for ${selectedCount} post${selectedCount === 1 ? '' : 's'}.`), 100);
  };

  if (rows.length === 0) {
    return (
      <section className="wu-card">
        <div className="wu-card__head">
          <h3>Want paid usage rights?</h3>
          <p>Mark a creator as "yes, work again" in their say-thanks flow — eligible posts will appear here.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="wu-card wu-rights">
      <div className="wu-card__head">
        <h3>Run any of this as paid?</h3>
        <p>Pick the posts you'd like to run as ads. We'll reach out to the creator and the platform to set it up.</p>
      </div>
      <div className="wu-rights__list">
        {rows.map((r) => {
          const k = `${r.creator.handle}::${r.postKey}`;
          const on = !!selected[k];
          return (
            <label key={k} className={`wu-rights__row ${on ? 'on' : ''}`}>
              <input type="checkbox" checked={on} onChange={() => toggle(k)} />
              <span
                className="wu-rights__thumb"
                style={r.post.thumbnailUrl ? { backgroundImage: `url(${r.post.thumbnailUrl})` } : undefined}
              />
              <span className="wu-rights__meta">
                <b>{r.creator.name}</b>
                <small>{r.post.platform || 'Post'}{r.post.timeAgo ? ` · ${r.post.timeAgo}` : ''}</small>
              </span>
              <span className={`wu-rights__check ${on ? 'on' : ''}`}>{on ? '✓' : ''}</span>
            </label>
          );
        })}
      </div>
      <div className="wu-rights__foot">
        <div className="wu-rights__tier">
          <span className="wu-field-label">Duration</span>
          <div className="wu-tiers">
            {PAID_TIERS.map((t) => (
              <button
                key={t.id}
                className={`wu-tier ${tierId === t.id ? 'on' : ''}`}
                onClick={() => setTierId(t.id)}
              >
                <span>{t.label}</span><b>${t.price}/post</b>
              </button>
            ))}
          </div>
        </div>
        <div className="wu-rights__cta">
          <span className="wu-rights__total">
            {selectedCount > 0
              ? <><b>{selectedCount}</b> post{selectedCount === 1 ? '' : 's'} · est. <b>${totalPrice}</b></>
              : 'Select posts to continue'}
          </span>
          <button className="wu-primary" disabled={!selectedCount} onClick={submit}>
            Request paid rights →
          </button>
        </div>
      </div>
    </section>
  );
}
