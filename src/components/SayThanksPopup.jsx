import { useEffect, useRef, useState } from 'react';
import { PolaroidPostcard } from './Postcards.jsx';
import {
  getCreatorState,
  savePostcard,
  setReCollab,
} from '../utils/postcardStorage.js';

const ANIM_DURATION_MS = 4600;
const PUBLIC_MAX = 80;
const PRIVATE_MAX = 180;

/**
 * v6 Say-thanks popup — three steps in one modal:
 *   1. View the creator's content (carousel of their posts)
 *   2. Send a postcard (public testimonial + private note, both pre-drafted)
 *   3. Re-collab question (decline / later / favorite)
 *
 * Triggered from the content tile *or* the dashboard row.
 */
export default function SayThanksPopup({
  campaignId,
  creator,        // { name, handle, avatarInitial }
  posts,          // [{ thumbnailUrl, platform, caption, timeAgo, postUrl }]
  brandName,
  onClose,
  onChanged,
}) {
  const existing = getCreatorState(campaignId, creator.handle);
  const firstName = creator.name.split(' ')[0];

  const [step, setStep] = useState(1);              // 1 | 2 | 3
  const [idx, setIdx] = useState(0);                 // carousel index for step 1
  const [sending, setSending] = useState(false);     // animation overlay
  const [postcard, setPostcard] = useState(existing.postcard);
  const [reCollab, setReCollabLocal] = useState(existing.reCollab);
  const post = posts[idx] || posts[0] || {};

  // pre-drafted messages
  const draftPublic = `${firstName} was a dream to work with — top-level content.`;
  const draftPrivate = `OMG ${firstName} you killed it — your captions had me laughing out loud. Thank you 🤍`;
  const [publicMessage, setPublicMessage] = useState(existing.postcard?.publicMessage ?? draftPublic);
  const [privateMessage, setPrivateMessage] = useState(existing.postcard?.privateMessage ?? draftPrivate);

  // Escape + body lock
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

  const send = () => {
    setSending(true);
    setTimeout(() => {
      const record = {
        style: 'polaroid',
        publicMessage,
        privateMessage,
        sentAt: new Date().toISOString(),
      };
      savePostcard(campaignId, creator.handle, record);
      setPostcard(record);
      setSending(false);
      onChanged && onChanged();
      setStep(3); // auto-advance to re-collab
    }, ANIM_DURATION_MS);
  };

  const pickReCollab = (value) => {
    setReCollabLocal(value);
    setReCollab(campaignId, creator.handle, value);
    onChanged && onChanged();
  };

  const done = () => onClose();

  // -------- send animation overlay --------
  if (sending) {
    return (
      <div className="stp-overlay" role="dialog" aria-label="Sending postcard">
        <div className="send-anim-stage">
          <div className="send-anim__envelope">
            <div className="send-anim__envelope-back" />
            <div className="send-anim__card-clip">
              <div className="send-anim__card">
                <PolaroidPostcard
                  thumbnailUrl={post.thumbnailUrl}
                  platform={post.platform}
                  brandName={brandName}
                  message={publicMessage}
                />
              </div>
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

  return (
    <div className="stp-overlay" role="dialog" aria-label={`Say thanks to ${creator.name}`} onClick={onBackdrop}>
      <div className="stp-modal">
        <header className="stp-top">
          <div className="stp-id">
            <span className="stp-av">{creator.avatarInitial}</span>
            <div>
              <div className="stp-name">{creator.name}</div>
              <div className="stp-handle">{creator.handle} · {posts.length} post{posts.length === 1 ? '' : 's'}</div>
            </div>
          </div>
          <Stepper step={step} setStep={setStep} />
          <button className="stp-close" onClick={onClose} aria-label="Close">×</button>
        </header>

        {step === 1 && (
          <StepView
            posts={posts} idx={idx} setIdx={setIdx} post={post}
            onNext={() => setStep(2)}
          />
        )}

        {step === 2 && (
          <StepThank
            firstName={firstName}
            brandName={brandName}
            post={post}
            postcardSent={postcard}
            publicMessage={publicMessage}
            setPublicMessage={setPublicMessage}
            privateMessage={privateMessage}
            setPrivateMessage={setPrivateMessage}
            onBack={() => setStep(1)}
            onSkip={() => setStep(3)}
            onSend={send}
          />
        )}

        {step === 3 && (
          <StepReCollab
            firstName={firstName}
            value={reCollab}
            onPick={pickReCollab}
            onBack={() => setStep(2)}
            onDone={done}
          />
        )}
      </div>
    </div>
  );
}

/* ---------- stepper ---------- */
function Stepper({ step, setStep }) {
  const labels = ['View', 'Say thanks', 'Re-collab'];
  return (
    <div className="stp-stepper" role="tablist" aria-label="Steps">
      {labels.map((lbl, i) => {
        const n = i + 1;
        return (
          <button
            key={lbl}
            type="button"
            className={`stp-stepper__btn ${step === n ? 'on' : ''} ${step > n ? 'done' : ''}`}
            onClick={() => setStep(n)}
            aria-selected={step === n}
            role="tab"
          >
            <span className="stp-stepper__n">{step > n ? '✓' : n}</span>
            <span className="stp-stepper__lbl">{lbl}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Step 1: View ---------- */
function StepView({ posts, idx, setIdx, post, onNext }) {
  const single = posts.length === 1;
  return (
    <div className="stp-step stp-step--view">
      <div className="stp-view-stage">
        <div
          className="stp-view-thumb"
          style={post.thumbnailUrl ? { backgroundImage: `url(${post.thumbnailUrl})` } : undefined}
        >
          {post.platform && <span className="stp-view-platform">{post.platform}</span>}
          {!single && (
            <div className="stp-view-arrows">
              <button aria-label="Previous post" onClick={() => setIdx((i) => (i - 1 + posts.length) % posts.length)}>‹</button>
              <button aria-label="Next post" onClick={() => setIdx((i) => (i + 1) % posts.length)}>›</button>
            </div>
          )}
          {!single && (
            <div className="stp-view-dots">
              {posts.map((_, i) => <span key={i} className={i === idx ? 'on' : ''} />)}
            </div>
          )}
        </div>
        <div className="stp-view-meta">
          <div className="stp-view-count">
            {post.platform || 'Post'} · {idx + 1} of {posts.length}{post.timeAgo ? ` · ${post.timeAgo}` : ''}
          </div>
          <p className="stp-view-caption">{post.caption || 'No caption.'}</p>
          {post.postUrl && (
            <a className="stp-view-link" href={post.postUrl} target="_blank" rel="noopener noreferrer">
              View original post ↗
            </a>
          )}
        </div>
      </div>
      <footer className="stp-foot">
        <span className="stp-foot-spacer" />
        <button className="stp-primary" onClick={onNext}>♥ Say thanks →</button>
      </footer>
    </div>
  );
}

/* ---------- Step 2: Thank (postcard + public + private) ---------- */
function StepThank({
  firstName, brandName, post,
  postcardSent, publicMessage, setPublicMessage, privateMessage, setPrivateMessage,
  onBack, onSkip, onSend,
}) {
  const viewOnly = !!postcardSent;
  return (
    <div className="stp-step stp-step--thank">
      <div className="stp-thank-row">
        <div className="stp-thank-card">
          <PolaroidPostcard
            thumbnailUrl={post.thumbnailUrl}
            platform={post.platform}
            brandName={brandName}
            message={publicMessage}
          />
        </div>
        <div className="stp-thank-fields">
          {viewOnly ? (
            <div className="stp-sent">
              <div className="stp-sent-badge">✓ Sent</div>
              <p>You sent {firstName} a postcard on{' '}
                {new Date(postcardSent.sentAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.</p>
              {postcardSent.privateMessage && (
                <div className="stp-private-recap">
                  <span className="stp-field-label">Private note</span>
                  <p>{postcardSent.privateMessage}</p>
                </div>
              )}
            </div>
          ) : (
            <>
              <label className="stp-field">
                <span className="stp-field-label">Public message <em>· shows on the postcard &amp; on {firstName}'s testimonials</em></span>
                <textarea
                  rows={2}
                  maxLength={PUBLIC_MAX}
                  value={publicMessage}
                  onChange={(e) => setPublicMessage(e.target.value)}
                  placeholder="e.g. Julia was a dream to work with — top-level content."
                />
                <small>{publicMessage.length} / {PUBLIC_MAX}</small>
              </label>
              <label className="stp-field">
                <span className="stp-field-label">Private note <em>· just for {firstName}, won't appear publicly</em></span>
                <textarea
                  rows={3}
                  maxLength={PRIVATE_MAX}
                  value={privateMessage}
                  onChange={(e) => setPrivateMessage(e.target.value)}
                  placeholder="The personal thing only she'll see."
                />
                <small>{privateMessage.length} / {PRIVATE_MAX}</small>
              </label>
            </>
          )}
        </div>
      </div>
      <footer className="stp-foot">
        <button className="stp-ghost" onClick={onBack}>← Back</button>
        <span className="stp-foot-spacer" />
        {viewOnly ? (
          <button className="stp-primary" onClick={onSkip}>Next →</button>
        ) : (
          <>
            <button className="stp-link" onClick={onSkip}>Skip</button>
            <button className="stp-primary" onClick={onSend} disabled={!publicMessage.trim()}>
              ♥ Send postcard
            </button>
          </>
        )}
      </footer>
    </div>
  );
}

/* ---------- Step 3: Re-collab ---------- */
const RECOLLAB_OPTIONS = [
  { id: 'decline',  label: 'Not a fit',          desc: "I'd prefer not to work with {first} again." },
  { id: 'later',    label: 'Yes, periodically',  desc: "Open to working with {first} again — just not the next campaign." },
  { id: 'favorite', label: 'Favorites',          desc: 'Auto-invite {first} to all my upcoming campaigns.' },
];
function StepReCollab({ firstName, value, onPick, onBack, onDone }) {
  return (
    <div className="stp-step stp-step--recollab">
      <div className="stp-rc-head">
        <h3>Work with {firstName} again?</h3>
        <p>Pick one — we'll use this to plan your next campaign.</p>
      </div>
      <div className="stp-rc-options" role="radiogroup">
        {RECOLLAB_OPTIONS.map((opt) => {
          const on = value === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              className={`stp-rc-opt ${on ? 'on' : ''} ${opt.id === 'favorite' ? 'stp-rc-opt--fav' : ''}`}
              aria-pressed={on}
              role="radio"
              aria-checked={on}
              onClick={() => onPick(opt.id)}
            >
              <span className="stp-rc-mark">{on ? '✓' : (opt.id === 'favorite' ? '★' : opt.id === 'later' ? '○' : '✕')}</span>
              <span className="stp-rc-copy">
                <b>{opt.label}</b>
                <em>{opt.desc.replace('{first}', firstName)}</em>
              </span>
            </button>
          );
        })}
      </div>
      <footer className="stp-foot">
        <button className="stp-ghost" onClick={onBack}>← Back</button>
        <span className="stp-foot-spacer" />
        <button className="stp-primary" onClick={onDone}>Done</button>
      </footer>
    </div>
  );
}
