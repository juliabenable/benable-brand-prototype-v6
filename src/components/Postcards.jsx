/**
 * Postcard renderers — two styles, both consume the same { message, signoff } pair.
 *
 * Polaroid: photo (from creator's post) + handwritten caption + signoff.
 * Vintage: GREETINGS FROM <brand> hero strip + handwritten body + signoff,
 *          stamp + postmark + sparkle accents auto-filled.
 */

export function PolaroidPostcard({ thumbnailUrl, platform, brandName, message, signoff, brandInitial }) {
  return (
    <div className="pc pc-polaroid">
      <div className="pc-polaroid__tape" />
      <div
        className="pc-polaroid__photo"
        style={thumbnailUrl ? { backgroundImage: `url(${thumbnailUrl})` } : undefined}
      >
        {platform && (
          <span className="pc-polaroid__platform-tag">{platformIcon(platform)} {platform}</span>
        )}
        {brandName && (
          <span className="pc-polaroid__brand" title={`from ${brandName}`}>
            <span className="pc-polaroid__brand-av" aria-hidden="true">
              {(brandInitial || brandName.charAt(0)).toUpperCase()}
            </span>
            <span className="pc-polaroid__brand-name">{brandName}</span>
          </span>
        )}
      </div>
      <div className="pc-polaroid__caption">{message || 'we love what you made!'}</div>
      <div className="pc-polaroid__signoff">{signoff || `from ${brandName}`}</div>
    </div>
  );
}

export function VintagePostcard({ brandName, message, signoff, date }) {
  const dateLabel = (date || new Date()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
  return (
    <div className="pc pc-vintage">
      <div className="pc-vintage__hero">
        <div className="pc-vintage__hero-sub">GREETINGS FROM</div>
        <div className="pc-vintage__hero-stars">✦ ✦ ✦</div>
        <div className="pc-vintage__hero-text">{brandName}</div>
      </div>
      <div className="pc-vintage__stamp" aria-hidden="true">♥</div>
      <div className="pc-vintage__postmark" aria-hidden="true">{dateLabel.split(' ')[0]}<br />{dateLabel.split(' ')[1]}</div>
      <div className="pc-vintage__body">
        <div className="pc-vintage__body-msg">{message || 'we love what you made!'}</div>
        <div className="pc-vintage__body-sig">{signoff || `— ${brandName}`}</div>
      </div>
      <div className="pc-vintage__confetti-1" aria-hidden="true">✦</div>
      <div className="pc-vintage__confetti-2" aria-hidden="true">·*✧</div>
    </div>
  );
}

function platformIcon(platform) {
  const p = platform.toLowerCase();
  if (p.includes('reel') || p.includes('instagram')) return '▶';
  if (p.includes('tiktok')) return '♪';
  if (p.includes('stor')) return '○';
  return '▶';
}
