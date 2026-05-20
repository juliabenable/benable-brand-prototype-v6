import { useState } from 'react';
import { PolaroidPostcard } from './Postcards.jsx';
import {
  getCreatorMeta,
  getPostcard,
  getReCollab,
  isPositiveReCollab,
} from '../utils/postcardStorage.js';

/**
 * v6 Wrap-up tab (Tony-feedback round 2) — celebratory recap with:
 *   1. Hero stats
 *   2. Thank-you wall (scattered polaroid gallery of sent postcards + nudge for the rest)
 *   3. Creators you'd work with again (tilted pinboard chips for favorites + laters)
 *   4. What you can do with this content — organic rights education tile (green checks)
 *   5. Want to go further? — paid capabilities multi-select (interest-only, not per-post)
 *   6. Monthly proposal CTA
 */
export default function WrapUpPanel({
  campaignId,
  brandName,
  creatorsWithPosts,
  onOpenThanks,
  onChanged: _onChanged, // eslint-disable-line no-unused-vars
  onBack,
}) {
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
  const favoriteCreators = allMeta.filter((c) => c.state.reCollab === 'favorite');
  const laterCreators = allMeta.filter((c) => c.state.reCollab === 'later');
  const _positiveCount = allMeta.filter((c) => isPositiveReCollab(c.state.reCollab)).length; // eslint-disable-line no-unused-vars

  return (
    <div className="wu">
      {/* mini nav */}
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

      {/* hero recap */}
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

      {/* Thank-you wall — scattered polaroid gallery */}
      <ThankYouWall
        thanked={thanked}
        unthanked={unthanked}
        onOpenThanks={onOpenThanks}
        brandName={brandName}
      />

      {/* Re-collab pinboard */}
      <ReCollabPinboard favorites={favoriteCreators} laters={laterCreators} />

      {/* Organic rights education */}
      <OrganicRightsTile />

      {/* Paid options (capability-based, interest only) */}
      <PaidOptionsSection />

      {/* Monthly proposal CTA */}
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

/* =========================================================
   1. Thank-you wall — scattered polaroids of sent postcards
   ========================================================= */
const PIN_ANGLES = ['-4deg', '3deg', '-2deg', '5deg', '-3deg', '2deg', '-5deg', '4deg', '-1deg', '6deg'];
function ThankYouWall({ thanked, unthanked, onOpenThanks, brandName }) {
  if (thanked.length === 0 && unthanked.length === 0) return null;

  return (
    <section className="wu-card wu-wall">
      <div className="wu-card__head">
        <h3>Your thank-you wall</h3>
        <p>
          {thanked.length === 0
            ? "You haven't sent any postcards yet — kick one off below."
            : `${thanked.length} postcard${thanked.length === 1 ? '' : 's'} sent${unthanked.length > 0 ? ` · ${unthanked.length} still to go` : ' · all done 🎉'}.`}
        </p>
      </div>

      {thanked.length > 0 && (
        <div className={`wu-wall__pinboard ${thanked.length <= 2 ? 'wu-wall__pinboard--single' : ''}`}>
          {thanked.map((c, i) => {
            const post = c.posts[0] || {};
            return (
              <div
                key={c.creator.handle}
                className="wu-wall__pin"
                style={{ '--tilt': PIN_ANGLES[i % PIN_ANGLES.length] }}
                title={`Sent to ${c.creator.name}`}
              >
                <div className="wu-wall__tape" />
                <div className="wu-wall__card">
                  <PolaroidPostcard
                    thumbnailUrl={post.thumbnailUrl}
                    platform={post.platform}
                    brandName={brandName}
                    message={c.state.postcard.publicMessage}
                    signoff={c.state.postcard.signature ? `— ${c.state.postcard.signature}` : undefined}
                  />
                </div>
                <div className="wu-wall__caption">
                  <span className="wu-wall__caption-label">Sent to</span>
                  <b>{c.creator.name}</b>
                  <small>{c.creator.handle}</small>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {unthanked.length > 0 && (
        <div className="wu-wall__nudge">
          <span className="wu-wall__nudge-label">Still to thank:</span>
          <div className="wu-wall__pills">
            {unthanked.map((c) => (
              <button
                key={c.creator.handle}
                type="button"
                className="wu-wall__nudge-pill"
                onClick={() => onOpenThanks(c.creator, c.posts)}
              >
                <span className="wu-wall__nudge-av">{c.creator.avatarInitial}</span>
                {c.creator.name}
                <span aria-hidden="true">→</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

/* =========================================================
   2. Re-collab pinboard — tilted creator chips
   ========================================================= */
const TILT_ANGLES = ['-3deg', '2deg', '-2deg', '4deg', '-4deg', '1deg', '-1deg', '3deg', '-5deg', '5deg'];
function ReCollabPinboard({ favorites, laters }) {
  if (favorites.length === 0 && laters.length === 0) return null;

  return (
    <section className="wu-card wu-faves">
      <div className="wu-card__head">
        <h3>Creators you'd work with again</h3>
        <p>Favorites get an auto-invite on every future campaign. The "later" crew stays on standby.</p>
      </div>

      {favorites.length > 0 && (
        <div className="wu-faves__group">
          <div className="wu-faves__label">
            <span className="wu-faves__emoji">⭐</span>
            <b>Your favorites</b>
            <small>· auto-invited to every campaign you run</small>
          </div>
          <div className="wu-faves__pinboard">
            {favorites.map((c, i) => (
              <div
                key={c.creator.handle}
                className="wu-faves__pin wu-faves__pin--fav"
                style={{ '--tilt': TILT_ANGLES[i % TILT_ANGLES.length] }}
              >
                <span className="wu-faves__av">{c.creator.avatarInitial}</span>
                <div className="wu-faves__who">
                  <b>{c.creator.name}</b>
                  <small>{c.creator.handle}</small>
                </div>
                <span className="wu-faves__badge" aria-hidden="true">★</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {laters.length > 0 && (
        <div className="wu-faves__group">
          <div className="wu-faves__label">
            <span className="wu-faves__emoji">🌱</span>
            <b>Yes — just not next time</b>
            <small>· we'll keep them warm for a future round</small>
          </div>
          <div className="wu-faves__pinboard">
            {laters.map((c, i) => (
              <div
                key={c.creator.handle}
                className="wu-faves__pin wu-faves__pin--later"
                style={{ '--tilt': TILT_ANGLES[(i + 3) % TILT_ANGLES.length] }}
              >
                <span className="wu-faves__av">{c.creator.avatarInitial}</span>
                <div className="wu-faves__who">
                  <b>{c.creator.name}</b>
                  <small>{c.creator.handle}</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

/* =========================================================
   3. Organic rights education — what you ALREADY can do
   ========================================================= */
const ORGANIC_RIGHTS = [
  { t: 'Cross-post to your own channels',     d: 'Re-upload to your IG, TikTok, or YouTube Shorts — credit the creator and you\'re set.' },
  { t: 'Share to stories & highlights',       d: 'Repost any of these to your Stories or save them to a Highlight forever.' },
  { t: 'Embed on your website & blog',        d: "Use the platform's official embed code anywhere on your owned site." },
  { t: 'Include in your newsletter',          d: 'Embed a still or link the post — perfect for monthly roundups.' },
  { t: 'Show in decks, press kits, case studies', d: 'Use the content internally and in unpaid press / investor materials.' },
];
function OrganicRightsTile() {
  return (
    <section className="wu-card wu-edu">
      <div className="wu-card__head">
        <span className="wu-edu__pill">Already included · free for 30 days</span>
        <h3>You already have these rights</h3>
        <p>Everything that came out of this campaign is yours to use organically, for the first 30 days. Here's the cheat sheet.</p>
      </div>
      <ul className="wu-edu__list">
        {ORGANIC_RIGHTS.map((r) => (
          <li key={r.t}>
            <span className="wu-edu__check" aria-hidden="true">✓</span>
            <div>
              <b>{r.t}</b>
              <small>{r.d}</small>
            </div>
          </li>
        ))}
      </ul>
      <div className="wu-edu__foot">
        Need it longer than 30 days? Extend organic from <b>$15/post</b> — or pick a paid option below.
      </div>
    </section>
  );
}

/* =========================================================
   4. Paid options — capability-based multi-select (interest only)
   ========================================================= */
const PAID_CAPS = [
  { id: 'rights',    icon: '⚡',
    title: 'Paid usage rights',
    desc: 'License this content for your own paid ads on Meta, TikTok, etc. — runs from your handle.',
    eg: 'Popular for: brand-aligned hero shots.' },
  { id: 'whitelist', icon: '🤝',
    title: 'Whitelisting (dark posts)',
    desc: "Run paid ads from the creator's own handle — feels native, lifts engagement, no public post.",
    eg: 'Popular for: warm-audience retargeting.' },
  { id: 'boost',     icon: '🚀',
    title: 'Boost the original post',
    desc: 'Pay the platform to amplify the actual organic post — same likes, more reach.',
    eg: 'Popular for: posts already taking off.' },
  { id: 'repurpose', icon: '✂️',
    title: 'Long-term repurpose',
    desc: 'Extended licensing + raw cuts so you can edit + reuse across your owned channels.',
    eg: 'Popular for: evergreen product moments.' },
  { id: 'rebook',    icon: '🔁',
    title: 'Brief them again',
    desc: 'Skip discovery — hire one of these creators directly for your next campaign brief.',
    eg: 'Popular for: a creator who just got it right.' },
];
function PaidOptionsSection() {
  const [selected, setSelected] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const selectedIds = Object.keys(selected).filter((id) => selected[id]);

  const toggle = (id) => {
    if (submitted) return;
    setSelected((s) => ({ ...s, [id]: !s[id] }));
  };
  const submit = () => {
    if (selectedIds.length === 0) return;
    setSubmitted(true);
    setTimeout(() => {
      alert(`Got it — Katie will email you about ${selectedIds.length} option${selectedIds.length === 1 ? '' : 's'} within 1 business day.`);
    }, 100);
  };

  return (
    <section className="wu-card wu-paid">
      <div className="wu-card__head">
        <h3>Want to go further?</h3>
        <p>Tick anything you're curious about. We'll come back with options + pricing tailored to your campaign — no commitment.</p>
      </div>
      <div className="wu-paid__list">
        {PAID_CAPS.map((cap) => {
          const on = !!selected[cap.id];
          return (
            <label key={cap.id} className={`wu-paid__row ${on ? 'on' : ''} ${submitted ? 'locked' : ''}`}>
              <input
                type="checkbox"
                checked={on}
                onChange={() => toggle(cap.id)}
                disabled={submitted}
              />
              <span className="wu-paid__icon" aria-hidden="true">{cap.icon}</span>
              <div className="wu-paid__copy">
                <b>{cap.title}</b>
                <p>{cap.desc}</p>
                <small>{cap.eg}</small>
              </div>
              <span className={`wu-paid__check ${on ? 'on' : ''}`} aria-hidden="true">{on ? '✓' : ''}</span>
            </label>
          );
        })}
      </div>
      <div className="wu-paid__foot">
        <span className="wu-paid__count">
          {selectedIds.length === 0
            ? 'Tick anything you want pricing on'
            : <><b>{selectedIds.length}</b> option{selectedIds.length === 1 ? '' : 's'} selected</>}
        </span>
        {submitted ? (
          <span className="wu-paid__sent">✓ Request sent · Katie will email you within 1 business day</span>
        ) : (
          <button className="wu-primary" disabled={selectedIds.length === 0} onClick={submit}>
            Send request →
          </button>
        )}
      </div>
    </section>
  );
}
