import { useEffect, type CSSProperties } from "react";
import { colors, font, space } from "@grip/core/tokens";

const DISMISS_MS = 2100;

// Deterministic spread so the burst looks the same every time.
const PARTICLE_COLORS = [colors.deco1, colors.deco2, colors.deco3, colors.deco4, colors.deco5, colors.deco6];
const PARTICLES = Array.from({ length: 36 }, (_, index) => ({
  angle: (Math.PI * 2 * index) / 36 + (index % 5) * 0.1,
  distance: 90 + (index % 9) * 22,
  size: 5 + (index % 4) * 2,
  delay: (index % 6) * 45,
  color: PARTICLE_COLORS[index % PARTICLE_COLORS.length] as string,
}));

// Reduced motion drops the burst and pop but keeps the card visible.
const KEYFRAMES = `
  @keyframes celebration-burst {
    from { transform: translate(0, 0); opacity: 1; }
    to { transform: translate(var(--dx), var(--dy)); opacity: 0; }
  }
  @keyframes celebration-pop {
    from { transform: scale(0.6); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
  @media (prefers-reduced-motion: reduce) {
    .celebration-particle { display: none; }
    .celebration-card { animation: none !important; }
  }
`;

// Click-through backdrop so the overlay never blocks the page underneath.
const backdropStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 50,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: `${colors.bg}a8`,
  pointerEvents: "none",
};

const titleStyle: CSSProperties = { color: colors.textBright, fontSize: font.size.heading, fontWeight: "800" };
const subtitleStyle: CSSProperties = { color: colors.textDim, fontSize: font.size.body, marginTop: space.xs, lineHeight: 1.4 };

function particleStyle(particle: (typeof PARTICLES)[number]): CSSProperties {
  return {
    position: "absolute",
    width: particle.size,
    height: particle.size,
    borderRadius: "50%",
    background: particle.color,
    // Burst target read by the keyframes; +50 adds a slight downward fall.
    ["--dx" as string]: `${Math.cos(particle.angle) * particle.distance}px`,
    ["--dy" as string]: `${Math.sin(particle.angle) * particle.distance + 50}px`,
    animation: `celebration-burst 1.1s cubic-bezier(0.16, 1, 0.3, 1) ${particle.delay}ms forwards`,
  };
}

function cardStyle(accent: string): CSSProperties {
  return {
    minWidth: 260,
    maxWidth: 360,
    padding: `${space.xl}px ${space.xxl}px`,
    // Deliberately tighter than radius.sm; reads better on this small card.
    borderRadius: 6,
    border: `1px solid ${accent}90`,
    background: `${colors.surface}f2`,
    textAlign: "center",
    animation: "celebration-pop 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
  };
}

type Props = { title: string; subtitle: string; accent?: string; onDone: () => void };

// Short milestone celebration that dismisses itself after DISMISS_MS.
export function CelebrationOverlay({ title, subtitle, accent = colors.accent as string, onDone }: Props) {
  useEffect(() => {
    const done = setTimeout(onDone, DISMISS_MS);
    return () => clearTimeout(done);
  }, [onDone]);

  return (
    <div style={backdropStyle}>
      <style>{KEYFRAMES}</style>

      {PARTICLES.map((particle, index) => (
        <span
          key={index}
          className="celebration-particle"
          aria-hidden="true"
          style={particleStyle(particle)}
        />
      ))}

      {/* Announced to screen readers without stealing focus. */}
      <div
        className="celebration-card"
        role="status"
        aria-live="polite"
        style={cardStyle(accent)}
      >
        <div style={titleStyle}>{title}</div>
        <div style={subtitleStyle}>{subtitle}</div>
      </div>
    </div>
  );
}
