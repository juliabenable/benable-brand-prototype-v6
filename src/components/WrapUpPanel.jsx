import { useState } from 'react';
import { PolaroidPostcard } from './Postcards.jsx';
import {
  getCreatorMeta,
  getPostcard,
  getReCollab,
  isPositiveReCollab,
} from '../utils/postcardStorage.js';

/**
 * v6 Wrap-up tab (round 5 — per Tony's section-by-section iteration):
 *   1. Hero — stats only (comments moved out), cleaner layout
 *   2. Comments — separate section, IG/TT-style comment thread
 *   3. Content gallery — social-feed post cards (not uniform grid)
 *   4. Catch-up — neutral white card, quieter
 *   5. Thank-you wall — unchanged
 *   6. Re-collab pinboard — unchanged
 *   7. Organic rights — iteration on B, single column for readability
 *   8. Paid options — 2-col grid (variant C from the study)
 *   9. Primary CTA — toned-down, brand-portal-aligned warm card
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

  const hasContract = true;

  const allPosts = allMeta.flatMap((c) =>
    c.posts.map((p) => ({ ...p, _creator: c.creator, _meta: c.meta }))
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

      <CommentsSection posts={allPosts} />

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
   Shared section header — matches the campaign-brief aesthetic:
   a 28px purple icon box + UPPERCASE 14px letter-spaced title.
   ========================================================= */
function BriefHead({ icon, title, sub, accent = 'purple' }) {
  return (
    <header className={`wu-brief-head wu-brief-head--${accent}`}>
      <div className="wu-brief-head__heading">
        <span className="wu-brief-head__icon" aria-hidden="true">{icon}</span>
        <h3>{title}</h3>
      </div>
      {sub && <p className="wu-brief-head__sub">{sub}</p>}
    </header>
  );
}

/* =========================================================
   1. Hero — stats only, cleaner layout
   ========================================================= */
function Hero({ creatorCount, thankedCount, reachLabel, postCount, avgEng, likesLabel, commentsLabel, savesLabel }) {
  return (
    <section className="wu-hero wu-brief-card">
      <span className="wu-brief-label">Campaign complete</span>
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
    </section>
  );
}

/* =========================================================
   2. Comments — separate section, IG/TT-style thread
   ========================================================= */
const DEMO_COMMENTS = [
  { handle: 'elsa.k',      avatar: 'E', text: 'omggg i need this routine — what brand??', likes: 142, time: '2d', verified: false },
  { handle: 'nightcalls',  avatar: 'N', text: "this is the realest content on my fyp today 💯", likes: 89, time: '4d', verified: true },
  { handle: 'junjun.style', avatar: 'J', text: 'wait this looks SO clean. where do i get it?', likes: 67, time: '5d', verified: false },
  { handle: 'laraf.',      avatar: 'L', text: 'just bought! ty for the discount code 🙏', likes: 54, time: '6d', verified: false },
  { handle: 'maycal',      avatar: 'M', text: 'how is your skin SO glowy', likes: 38, time: '6d', verified: false },
];
function CommentsSection({ posts }) {
  const sourcePost = posts[0] || {};
  return (
    <section className="wu-card wu-brief-card wu-comments-card">
      <BriefHead icon="💬" title="What people are saying" sub="Top comments pulled from the campaign's posts." />

      <div className="wu-comments-thread">
        <div className="wu-comments-thread__src">
          <div
            className="wu-comments-thread__thumb"
            style={sourcePost.thumbnailUrl ? { backgroundImage: `url(${sourcePost.thumbnailUrl})` } : undefined}
          />
          <div className="wu-comments-thread__src-meta">
            <b>{sourcePost._creator?.handle || '@creator'}</b>
            <small>{sourcePost.platform || 'Post'} · {DEMO_COMMENTS.length}+ comments</small>
          </div>
        </div>
        <ul className="wu-comments-list">
          {DEMO_COMMENTS.map((c, i) => (
            <li key={i} className="wu-cmt">
              <span className="wu-cmt__av">{c.avatar}</span>
              <div className="wu-cmt__body">
                <div className="wu-cmt__line">
                  <b className="wu-cmt__handle">{c.handle}{c.verified && <span className="wu-cmt__verified" aria-hidden="true">✓</span>}</b>
                  <span className="wu-cmt__text">{c.text}</span>
                </div>
                <div className="wu-cmt__meta">
                  <span>{c.time}</span>
                  <span>{c.likes} likes</span>
                  <span>Reply</span>
                </div>
              </div>
              <button className="wu-cmt__heart" aria-label="Like comment">♡</button>
            </li>
          ))}
        </ul>
        <div className="wu-comments-thread__footer">
          <a href="#" className="wu-comments-thread__link">View all {DEMO_COMMENTS.length * 4}+ comments →</a>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   3. Content gallery — social-feed post cards, not uniform grid
   ========================================================= */
function ContentGallery({ posts }) {
  if (posts.length === 0) return null;
  return (
    <section className="wu-card wu-brief-card wu-gallery">
      <BriefHead icon="▦" title="The content they made" sub={`${posts.length} piece${posts.length === 1 ? '' : 's'} from the campaign · click to open.`} />

      <div className="wu-gallery__cards">
        {posts.map((post, i) => {
          const views = post._meta?.avgViews || 0;
          const viewsLabel = views >= 1000000 ? `${(views / 1e6).toFixed(1)}M` : `${Math.round(views / 1000)}K`;
          const likes = Math.round(views * 0.082);
          const likesLabel = likes >= 1000 ? `${(likes / 1000).toFixed(1)}K` : `${likes}`;
          return (
            <a
              key={i}
              className="wu-gallery__card"
              href={post.postUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="wu-gallery__card-hd">
                <span className="wu-gallery__av">{post._creator?.avatarInitial || '·'}</span>
                <div className="wu-gallery__who">
                  <b>{post._creator?.name}</b>
                  <small>{post._creator?.handle}</small>
                </div>
                <span className="wu-gallery__platform">{post.platform || 'Post'}</span>
              </div>
              <div
                className="wu-gallery__thumb"
                style={post.thumbnailUrl ? { backgroundImage: `url(${post.thumbnailUrl})` } : undefined}
              />
              <div className="wu-gallery__card-ft">
                <span className="wu-gallery__stat"><span aria-hidden="true">♥</span> {likesLabel}</span>
                <span className="wu-gallery__stat"><span aria-hidden="true">▶</span> {viewsLabel}</span>
                {post.timeAgo && <span className="wu-gallery__time">{post.timeAgo}</span>}
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}

/* =========================================================
   4. Catch-up tile — neutral, quieter
   ========================================================= */
function CatchUpTile({ unthanked, onOpenThanks, totalCount }) {
  const pct = Math.round(((totalCount - unthanked.length) / totalCount) * 100);
  return (
    <section className="wu-card wu-brief-card wu-catchup">
      <BriefHead icon="◷" title="Still to thank" sub={`${unthanked.length} creator${unthanked.length === 1 ? '' : 's'} haven't heard from you yet. Close the loop before wrap-up is officially done.`} />
      <div className="wu-catchup__bar">
        <div className="wu-catchup__bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="wu-catchup__bar-label">{pct}% complete · {totalCount - unthanked.length} of {totalCount}</span>

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
   5. Thank-you wall — scattered polaroids (unchanged)
   ========================================================= */
const PIN_ANGLES = ['-4deg', '3deg', '-2deg', '5deg', '-3deg', '2deg', '-5deg', '4deg', '-1deg', '6deg'];
function ThankYouWall({ thanked, brandName }) {
  if (thanked.length === 0) {
    return (
      <section className="wu-card wu-brief-card wu-wall wu-wall--empty">
        <BriefHead icon="♥" title="Your thank-you wall" sub="Once you start sending postcards, they'll pin up here." />
      </section>
    );
  }

  return (
    <section className="wu-card wu-brief-card wu-wall">
      <BriefHead icon="♥" title="Your thank-you wall" sub={`${thanked.length} postcard${thanked.length === 1 ? '' : 's'} sent · all the warmth you put into this campaign.`} />
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
   6. Re-collab pinboard (unchanged)
   ========================================================= */
const TILT_ANGLES = ['-3deg', '2deg', '-2deg', '4deg', '-4deg', '1deg', '-1deg', '3deg', '-5deg', '5deg'];
function ReCollabPinboard({ favorites, laters }) {
  if (favorites.length === 0 && laters.length === 0) return null;

  return (
    <section className="wu-card wu-brief-card wu-faves">
      <BriefHead icon="↻" title="Creators you'd work with again" sub='Favorites get an auto-invite on every future campaign. The "later" crew stays on standby.' />

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
   7. Organic rights — single-column checklist, hanging indent
   ========================================================= */
const ORGANIC_RIGHTS = [
  { t: 'Cross-post to your own channels',         d: 'Re-upload to your IG, TikTok, or YouTube Shorts with creator credit.' },
  { t: 'Share to Stories & Highlights',           d: 'Repost any of these to your Stories or save to a Highlight forever.' },
  { t: 'Embed on your website & blog',            d: "Drop the platform's official embed code on any page you own." },
  { t: 'Use in your newsletter & email',          d: 'Embed a still or link the post — works great for monthly roundups.' },
  { t: 'Show in decks, press kits, case studies', d: 'Use the content internally and in any unpaid materials.' },
];
function OrganicRightsTile() {
  return (
    <section className="wu-card wu-brief-card wu-edu">
      <BriefHead icon="✓" title="What you can already do" sub="Everything from this campaign is yours to use organically for 30 days — free, included with the brief." accent="green" />
      <ul className="wu-edu__list">
        {ORGANIC_RIGHTS.map((r, i) => (
          <li key={r.t}>
            <span className="wu-edu__num" aria-hidden="true">{i + 1}</span>
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
   8. Paid options — 2-col grid (variant C from study)
   ========================================================= */
const PAID_CAPS = [
  { id: 'rights',    icon: '⚡', title: 'Paid usage rights',
    desc: 'License the content for your own paid ads, from your handle.' },
  { id: 'whitelist', icon: '🤝', title: 'Whitelisting',
    desc: "Run paid ads from the creator's handle — feels native." },
  { id: 'boost',     icon: '🚀', title: 'Boost the original',
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
    <section className="wu-card wu-brief-card wu-paid">
      <BriefHead icon="✦" title="Want to go further?" sub="Tap anything you're curious about — we'll come back with options + pricing. No commitment." />
      <div className="wu-paid__grid">
        {PAID_CAPS.map((cap) => {
          const on = !!selected[cap.id];
          return (
            <button
              key={cap.id}
              type="button"
              className={`wu-paid__card ${on ? 'on' : ''} ${submitted ? 'locked' : ''}`}
              onClick={() => toggle(cap.id)}
              disabled={submitted}
              aria-pressed={on}
            >
              <span className="wu-paid__card-icon" aria-hidden="true">{cap.icon}</span>
              <b className="wu-paid__card-title">{cap.title}</b>
              <p className="wu-paid__card-desc">{cap.desc}</p>
              <span className={`wu-paid__card-check ${on ? 'on' : ''}`} aria-hidden="true">{on ? '✓' : '+'}</span>
            </button>
          );
        })}
      </div>
      <div className="wu-paid__foot">
        <span className="wu-paid__count">
          {selectedIds.length === 0
            ? 'Tap anything you want pricing on'
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
   9. Primary CTA — toned-down, brand-portal-aligned
   ========================================================= */
function PrimaryCTA({ hasContract, brandName }) {
  if (hasContract) {
    return (
      <section className="wu-card wu-brief-card wu-brief-card--next wu-promo">
        <BriefHead icon="→" title="Ready for round two?" sub="Brief in 5 minutes · re-invite your favorites · live in 7 days. Your contract covers it." />
        <div className="wu-promo__body">
          <div className="wu-promo__metrics">
            <span>12 creators ready</span>
            <span aria-hidden="true">·</span>
            <span>Avg. brief-to-live: 6 days</span>
          </div>
          <div className="wu-promo__cta">
            <button className="wu-promo__btn">Launch new campaign →</button>
            <span className="wu-promo__sub">or <a href="#">duplicate this campaign</a></span>
          </div>
        </div>
      </section>
    );
  }
  return (
    <section className="wu-card wu-brief-card wu-brief-card--next wu-promo">
      <BriefHead icon="✦" title="Loved this? Make it recurring." sub={`The creators you loved, fresh content every month — no per-campaign setup, predictable spend.`} />
      <div className="wu-promo__body">
        <div className="wu-promo__metrics">
          <span>Brands save ~40% vs ad hoc</span>
          <span aria-hidden="true">·</span>
          <span>Proposal in 48h</span>
        </div>
        <div className="wu-promo__cta">
          <button className="wu-promo__btn">Get a proposal for {brandName} →</button>
          <span className="wu-promo__sub">or <a href="mailto:katie@benable.com">email Katie</a></span>
        </div>
      </div>
    </section>
  );
}
