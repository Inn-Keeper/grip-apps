import { useEffect } from "react";
import { colors, font } from "@grip/core/tokens";

const DISMISS_MS = 2100;

const PARTICLE_COLORS = [colors.deco1, colors.deco2, colors.deco3, colors.deco4, colors.deco5, colors.deco6];
const PARTICLES = Array.from({ length: 36 }, (_, index) => ({
  angle: (Math.PI * 2 * index) / 36 + (index % 5) * 0.1,
  distance: 90 + (index % 9) * 22,
  size: 5 + (index % 4) * 2,
  delay: (index % 6) * 45,
  color: PARTICLE_COLORS[index % PARTICLE_COLORS.length] as string,
}));

type Props = { title: string; subtitle: string; accent?: string; onDone: () => void };

export function CelebrationOverlay({ title, subtitle, accent = colors.accent, onDone }: Props) {
  useEffect(() => {
    const done = setTimeout(onDone, DISMISS_MS);
    return () => clearTimeout(done);
  }, [onDone]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `${colors.bg}a8`,
        pointerEvents: "none",
      }}
    >
      <style>{`
        @keyframes celebration-burst {
          from { transform: translate(0, 0); opacity: 1; }
          to { transform: translate(var(--dx), var(--dy)); opacity: 0; }
        }
        @keyframes celebration-pop {
          from { transform: scale(0.6); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>

      {PARTICLES.map((particle, index) => (
        <span
          key={index}
          style={{
            position: "absolute",
            width: particle.size,
            height: particle.size,
            borderRadius: "50%",
            background: particle.color,
            ["--dx" as string]: `${Math.cos(particle.angle) * particle.distance}px`,
            ["--dy" as string]: `${Math.sin(particle.angle) * particle.distance + 50}px`,
            animation: `celebration-burst 1.1s cubic-bezier(0.16, 1, 0.3, 1) ${particle.delay}ms forwards`,
          } as React.CSSProperties}
        />
      ))}

      <div
        style={{
          minWidth: 260,
          maxWidth: 360,
          padding: "20px 26px",
          borderRadius: 14,
          border: `1px solid ${accent}90`,
          background: `${colors.surface}f2`,
          textAlign: "center",
          animation: "celebration-pop 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <div style={{ color: colors.textBright, fontSize: font.size.heading, fontWeight: 800 }}>{title}</div>
        <div style={{ color: colors.textDim, fontSize: font.size.body, marginTop: 6, lineHeight: 1.4 }}>{subtitle}</div>
      </div>
    </div>
  );
}
