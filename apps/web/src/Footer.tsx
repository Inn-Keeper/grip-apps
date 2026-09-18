import React, { type CSSProperties } from "react";
import { t } from "@grip/core/i18n";
import { brand, colors, font } from "@grip/core/tokens";
import { BrandMark } from "./components/BrandMark";

type FooterLink = { label: string; action: (() => void) | null; href?: never } | { label: string; href: string; action?: never };

export function Footer({ pages, onNavigate }: { pages: { id: string; label: string }[]; onNavigate: ((page: string) => void) | null }) {
  const productLinks: FooterLink[] = pages.map((page) => ({
    label: page.label,
    action: onNavigate ? () => onNavigate(page.id) : null,
  }));

  return (
    <footer
      style={{
        borderTop: `1px solid ${colors.borderSoft}`,
        background: colors.bgDeep,
        padding: "24px 24px 22px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 22,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 260, flex: "2 1 360px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11, flex: "0 0 auto", minWidth: 112 }}>
            <BrandMark size={28} />
            <div>
              <div style={{ fontSize: font.size.bodyLg, fontWeight: 800, color: colors.textBright, lineHeight: 1, whiteSpace: "nowrap" }}>{brand.productName}</div>
              <div style={{ fontSize: font.size.label, fontWeight: 700, color: colors.textFaint, marginTop: 3, whiteSpace: "nowrap" }}>{brand.tagline}</div>
            </div>
          </div>
          <p style={{ margin: 0, color: colors.textDim, fontSize: font.size.body, lineHeight: 1.55, maxWidth: 720 }}>
            {t("footer.promiseSuffix")}
          </p>
        </div>

        <FooterLinkGroup title={t("footer.menu")} links={productLinks} />
      </div>

      <div
        style={{
          marginTop: 20,
          paddingTop: 14,
          borderTop: `1px solid ${colors.surface}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
          color: colors.textFaint,
          fontSize: font.size.small,
          fontWeight: 600,
        }}
      >
        <span>{t("footer.builtBy", { year: new Date().getFullYear() })}</span>
        <span>{t("footer.location")}</span>
      </div>
    </footer>
  );
}

function FooterLinkGroup({ title, links }: { title: string; links: FooterLink[] }) {
  const linkStyle: CSSProperties = {
    padding: "6px 0",
    background: "transparent",
    border: "none",
    color: colors.textDim,
    textDecoration: "none",
    fontSize: font.size.small,
    fontWeight: 800,
    cursor: "pointer",
    whiteSpace: "nowrap",
  };

  return (
    <nav
      aria-label={title}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: 14,
        flex: "0 1 auto",
        flexWrap: "wrap",
      }}
    >
      {/* A label, not a link: faint caps so it doesn't read as clickable. */}
      <h2 style={{ margin: 0, color: colors.textFaint, fontSize: font.size.caption, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>{title}</h2>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "4px 14px", flexWrap: "wrap" }}>
        {links.map((link) =>
          link.href ? (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              style={linkStyle}
            >
              {link.label}
            </a>
          ) : (
            <button
              key={link.label}
              type="button"
              onClick={link.action ?? undefined}
              disabled={!link.action}
              style={{
                ...linkStyle,
                color: link.action ? colors.textDim : colors.textFaint,
                cursor: link.action ? "pointer" : "default",
              }}
            >
              {link.label}
            </button>
          )
        )}
      </div>
    </nav>
  );
}
