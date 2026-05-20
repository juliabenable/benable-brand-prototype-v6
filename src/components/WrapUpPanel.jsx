import { useState } from 'react';
import { PolaroidPostcard } from './Postcards.jsx';
import {
  getCreatorMeta,
  getPostcard,
  getReCollab,
  isPositiveReCollab,
} from '../utils/postcardStorage.js';

/**
 * v6 Wrap-up tab (round 4 — full reshape per Tony's brainstorm):
 *   1. Hero — primary stats (3 hero numbers) + secondary stats (3 small)
 *      + 3 fan-comment testimonials
 *   2. Content gallery — collage of all the posts (clickable thumbs)
 *   3. Catch-up tile — dedicated card listing unthanked creators
 *   4. Thank-you wall — scattered polaroid postcards
 *   5. Re-collab pinboard — favorites + laters as tilted chips
 *   6. Organic rights — redesigned for readability, no green gradient
 *   7. Paid options — capability-based multi-select (simplified copy)
 *   8. Primary CTA — contract-aware (launch / proposal), warm gradient
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

  // Secondary stats — derived from the deterministic creator meta so
  // numbers stay consistent across reloads.
  const totalLikes = Math.round(totalReach * (avgEng / 100) * 0.78);
  const totalComments = Math.round(totalReach * (avgEng / 100) * 0.14);
  const totalSaves = Math.round(totalReach * (avgEng / 100) * 0.08);

  const formatN = (n) =>
    n >= 1000000 ? `${(n / 1e6).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}K` : `${n}`;

  const reachLabel = formatN(totalReach);
  const likesLabel = formatN(totalLikes);
  const commentsLabel = formatN(totalComments);
  const savesLabel = formatN(totalSaves);

  const thanked = allMeta.filter((c) => !!c.state.postcard);
  const unthanked = allMeta.filter((c) => !c.state.postcard);
  const favoriteCreators = allMeta.filter((c) => c.state.reCollab === 'favorite');
  const laterCreators = allMeta.filter((c) => c.state.reCollab === 'later');
  const _positiveCount = allMeta.filter((c) => isPositiveReCollab(c.state.reCollab)).length; // eslint-disable-line no-unused-vars

  // Demo-only: pretend "Pikora" has an active Benable contract → CTA
  // becomes "Launch new campaign". A future "no-contract" variant would
  // flip this to "Request a proposal". The brainstorm study covers both.
  const hasContract = true;

  // Flatten all posts for the content gallery — preserves creator order.
  const allPosts = allMeta.flatMap((c) =>
    c.posts.map((p) => ({ ...p, _creator: c.creator }))
  );

  return (
    <div className="wu">
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

      <Hero
        creatorCount={creatorCount}
        thankedCount={thanked.length}
        reachLabel={reachLabel}
        postCount={postCount}
        avgEng={avgEng}
        likesLabel={likesLabel}
        commentsLabel={commentsLabel}
        savesLabel={savesLabel}
      />

      <ContentGallery posts={allPosts} />

      {unthanked.length > 0 && (
        <CatchUpTile unthanked={unthanked} onOpenThanks={onOpenThanks} totalCount={creatorCount} />
      )}

      <ThankYouWall thanked={thanked} brandName={brandName} />

      <ReCollabPinboard favorites={favoriteCreators} laters={laterCreators} />

      <OrganicRightsTile />

      <PaidOptionsSection />

      <PrimaryCTA hasContract={hasContract} brandName={brandName} />

      <p className="wu-fineprint">
        Best content + creator-rating recaps coming soon. Need rights help in the meantime? <a href="mailto:katie@benable.com">Email Katie</a>.
      </p>
    </div>
  );
}

/* =========================================================
   1. Hero — primary + secondary stats + fan comments
   ========================================================= */
const DEMO_COMMENTS = [
  { handle: '@elsa.k',      avatar: 'E', text: 'omggg i need this routine — what brand??', likes: 142 },
  { handle: '@nightcalls',  avatar: 'N', text: "this is the realest content on my fyp today 💯", likes: 89 },
  { handle: '@junjun.style', avatar: 'J', text: 'wait this looks SO clean. where do i get it?', likes: 67 },
];
function Hero({ creatorCount, thankedCount, reachLabel, postCount, avgEng, likesLabel, commentsLabel, savesLabel }) {
  return (
    <section className="wu-hero">
      <div className="wu-hero__confetti" aria-hidden="true">
        <span>✦</span><span>·</span><span>✦</span><span>★</span><span>·</span>
        <span>✦</span><span>·</span><span>★</span>
      </div>
      <div className="wu-hero__kicker">★ Campaign complete</div>
      <h2 className="wu-hero__title">You crushed it.</h2>
      <p className="wu-hero__sub">
        Here's everything {creatorCount} creator{creatorCount === 1 ? '' : 's'} made for you.
      </p>

      <div className="wu-stats wu-stats--hero">
        <div className="wu-stat"><div className="n">{reachLabel}</div><div className="l">Total reach</div></div>
        <div className="wu-stat"><div className="n">{postCount}</div><div className="l">Pieces of content</div></div>
        <div className="wu-stat"><div className="n">{avgEng}%</div><div className="l">Avg. engagement</div></div>
      </div>

      <div className="wu-stats wu-stats--secondary">
        <div className="wu-stat-sm">
          <span className="wu-stat-sm__icon" aria-hidden="true">♥</span>
          <div><b>{likesLabel}</b><small>likes</small></div>
        </div>
        <div className="wu-stat-sm">
          <span className="wu-stat-sm__icon" aria-hidden="true">💬</span>
          <div><b>{commentsLabel}</b><small>comments</small></div>
        </div>
        <div className="wu-stat-sm">
          <span className="wu-stat-sm__icon" aria-hidden="true">🔖</span>
          <div><b>{savesLabel}</b><small>saves &amp; shares</small></div>
        </div>
        <div className="wu-stat-sm">
          <span className="wu-stat-sm__icon" aria-hidden="true">✓</span>
          <div><b>{thankedCount}/{creatorCount}</b><small>thanked</small></div>
        </div>
      </div>

      <div className="wu-hero__divider"><span>What people are saying</span></div>

      <div className="wu-comments">
        {DEMO_COMMENTS.map((c, i) => (
          <figure key={i} className="wu-comment">
            <blockquote>"{c.text}"</blockquote>
            <figcaption>
              <span className="wu-comment__av">{c.avatar}</span>
              <span className="wu-comment__handle">{c.handle}</span>
              <span className="wu-comment__likes">♥ {c.likes}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

/* =========================================================
   2. Content gallery — collage of all the posts
   ========================================================= */
function ContentGallery({ posts }) {
  if (posts.length === 0) return null;
  return (
    <section className="wu-card wu-gallery">
      <div className="wu-card__head">
        <h3>The content they made</h3>
        <p>{posts.length} piece{posts.length === 1 ? '' : 's'} · click any to open the original post.</p>
      </div>
      <div className="wu-gallery__grid">
        {posts.map((post, i) => (
          <a
            key={i}
            className="wu-gallery__tile"
            href={post.postUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            style={post.thumbnailUrl ? { backgroundImage: `url(${post.thumbnailUrl})` } : undefined}
            title={`${post._creator?.name || ''} · ${post.platform || 'Post'}`}
          >
            {post.platform && (
              <span className="wu-gallery__platform">{post.platform}</span>
            )}
            <span className="wu-gallery__overlay" aria-hidden="true">
              <small>{post._creator?.name}</small>
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}

/* =========================================================
   3. Catch-up tile — unthanked creators (dedicated card)
   ========================================================= */
function CatchUpTile({ unthanked, onOpenThanks, totalCount }) {
  const pct = Math.round(((totalCount - unthanked.length) / totalCount) * 100);
  return (
    <section className="wu-card wu-catchup">
      <div className="wu-card__head wu-catchup__head">
        <span className="wu-catchup__kicker">⏰ Almost there</span>
        <h3>{unthanked.length} creator{unthanked.length === 1 ? '' : 's'} still to thank</h3>
        <p>Close the loop — send them a postcard before the wrap-up's officially done.</p>
        <div className="wu-catchup__bar">
          <div className="wu-catchup__bar-fill" style={{ width: `${pct}%` }} />
          <span className="wu-catchup__bar-label">{pct}% complete · {totalCount - unthanked.length} of {totalCount}</span>
        </div>
      </div>
      <ul className="wu-catchup__list">
        {unthanked.map((c) => (
          <li key={c.creator.handle}>
            <span className="wu-catchup__av">{c.creator.avatarInitial}</span>
            <div className="wu-catchup__meta">
              <b>{c.creator.name}</b>
              <small>{c.creator.handle} · {c.posts.length} post{c.posts.length === 1 ? '' : 's'} · {c.meta.avgViewsLabel} avg views</small>
            </div>
            <button
              type="button"
              className="wu-catchup__btn"
              onClick={() => onOpenThanks(c.creator, c.posts)}
            >
              <span aria-hidden="true">♥</span> Say thanks
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* =========================================================
   4. Thank-you wall — scattered polaroids of sent postcards
   ========================================================= */
const PIN_ANGLES = ['-4deg', '3deg', '-2deg', '5deg', '-3deg', '2deg', '-5deg', '4deg', '-1deg', '6deg'];
function ThankYouWall({ thanked, brandName }) {
  if (thanked.length === 0) {
    return (
      <section className="wu-card wu-wall wu-wall--empty">
        <div className="wu-card__head">
          <h3>Your thank-you wall</h3>
          <p>Once you start sending postcards, they'll pin up here.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="wu-card wu-wall">
      <div className="wu-card__head">
        <h3>Your thank-you wall</h3>
        <p>{thanked.length} postcard{thanked.length === 1 ? '' : 's'} sent · all the warmth you put into this campaign.</p>
      </div>
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
    </section>
  );
}

/* =========================================================
   5. Re-collab pinboard — tilted creator chips
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
            <span className="wu-faves__emoji">🤝</span>
            <b>Yes, periodically</b>
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
   6. Organic rights — clean white card, no gradient green
   ========================================================= */
const ORGANIC_RIGHTS = [
  { icon: '↻',  t: 'Cross-post to your own channels',         d: 'Re-upload to your IG, TikTok, or YouTube Shorts — credit the creator and you\'re set.' },
  { icon: '○',  t: 'Stories & highlights',                     d: 'Repost any of these to your Stories or save them to a Highlight forever.' },
  { icon: '⌘',  t: 'Embed on your website & blog',             d: "Use the platform's official embed code on any page you own." },
  { icon: '✉',  t: 'Newsletter & email',                        d: 'Embed a still or link the post — perfect for monthly roundups.' },
  { icon: '◆',  t: 'Pitch decks, press, case studies',          d: 'Use the content internally and in any unpaid materials.' },
];
function OrganicRightsTile() {
  return (
    <section className="wu-card wu-edu">
      <div className="wu-card__head wu-edu__head">
        <span className="wu-edu__pill">Included · free</span>
        <h3>What you can already do with this content</h3>
        <p>Everything from this campaign is yours to use organically for 30 days — here's the cheat sheet.</p>
      </div>
      <ul className="wu-edu__list">
        {ORGANIC_RIGHTS.map((r) => (
          <li key={r.t}>
            <span className="wu-edu__icon" aria-hidden="true">{r.icon}</span>
            <div className="wu-edu__copy">
              <b>{r.t}</b>
              <small>{r.d}</small>
            </div>
          </li>
        ))}
      </ul>
      <div className="wu-edu__foot">
        Need it longer than 30 days? Extend organic from <b>$15/post</b>, or pick a paid option below.
      </div>
    </section>
  );
}

/* =========================================================
   7. Paid options — capability multi-select (simplified)
   ========================================================= */
const PAID_CAPS = [
  { id: 'rights',    icon: '⚡', title: 'Paid usage rights',
    desc: 'License the content for your own paid ads, from your handle.' },
  { id: 'whitelist', icon: '🤝', title: 'Whitelisting (dark posts)',
    desc: "Run paid ads from the creator's handle — feels native." },
  { id: 'boost',     icon: '🚀', title: 'Boost the original post',
    desc: 'Amplify the actual organic post with paid spend.' },
  { id: 'repurpose', icon: '✂️', title: 'Long-term repurpose',
    desc: 'Extended licensing + raw cuts for owned channels.' },
  { id: 'rebook',    icon: '🔁', title: 'Brief them again',
    desc: 'Hire one of these creators for your next campaign.' },
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
        <p>Tick anything you're curious about — we'll come back with options + pricing. No commitment.</p>
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

/* =========================================================
   8. Primary CTA — contract-aware, warm gradient
   ========================================================= */
function PrimaryCTA({ hasContract, brandName }) {
  if (hasContract) {
    return (
      <section className="wu-promo wu-promo--launch">
        <div className="wu-promo__bg" aria-hidden="true">
          <span>★</span><span>✦</span><span>·</span><span>★</span>
          <span>·</span><span>✦</span><span>★</span><span>·</span>
        </div>
        <div className="wu-promo__copy">
          <div className="wu-promo__kicker">Ready for round two?</div>
          <h3>Launch your next campaign</h3>
          <p>Brief in 5 minutes · re-invite your favorites · live in 7 days.<br />Your contract covers it — no extra setup.</p>
          <div className="wu-promo__metrics">
            <span>🚀 12 creators ready to brief</span>
            <span>·</span>
            <span>⏱ Avg. brief-to-live: 6 days</span>
          </div>
        </div>
        <div className="wu-promo__cta">
          <button className="wu-promo__btn">Launch new campaign →</button>
          <span className="wu-promo__sub">or <a href="#">duplicate this campaign</a></span>
        </div>
      </section>
    );
  }
  return (
    <section className="wu-promo wu-promo--proposal">
      <div className="wu-promo__bg" aria-hidden="true">
        <span>✦</span><span>·</span><span>★</span><span>·</span>
        <span>✦</span><span>★</span><span>·</span><span>✦</span>
      </div>
      <div className="wu-promo__copy">
        <div className="wu-promo__kicker">Loved this? Make it recurring.</div>
        <h3>Get a proposal for {brandName}'s monthly creator program</h3>
        <p>The creators you loved, fresh content every month — no per-campaign setup, predictable spend.</p>
        <div className="wu-promo__metrics">
          <span>📈 Brands save ~40% vs ad hoc</span>
          <span>·</span>
          <span>📞 Proposal in 48h</span>
        </div>
      </div>
      <div className="wu-promo__cta">
        <button className="wu-promo__btn">Request a proposal →</button>
        <span className="wu-promo__sub">or <a href="mailto:katie@benable.com">email Katie</a></span>
      </div>
    </section>
  );
}
