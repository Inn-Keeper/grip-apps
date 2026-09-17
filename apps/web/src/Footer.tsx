import React, { type CSSProperties } from "react";
import { t } from "@grip/core/i18n";
import { brand, colors } from "@grip/core/tokens";
import { BrandIcon } from "./components/BrandIcon";

type FooterLink = { label: string; action: (() => void) | null; href?: never } | { label: string; href: string; action?: never };

export function Footer({ pages, onNavigate }: { pages: { id: string; label: string }[]; onNavigate: ((page: string) => void) | null }) {
  const productLinks: FooterLink[] = pages.map((page) => ({
    label: page.label,
    action: onNavigate ? () => onNavigate(page.id) : null,
  }));

  return (
    <footer
      style={{
        borderTop: `1px solid ${colors.border}`,
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
        <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 260, flex: "1 1 360px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11, flex: "0 0 auto", minWidth: 112 }}>
            <BrandIcon name="spark" color={colors.accentBright} size={28} />
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: colors.textBright, lineHeight: 1, whiteSpace: "nowrap" }}>{brand.productName}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: colors.textFaint, marginTop: 3, whiteSpace: "nowrap" }}>{brand.tagline}</div>
            </div>
          </div>
          <p style={{ margin: 0, color: colors.textDim, fontSize: 12.5, lineHeight: 1.55, maxWidth: 560 }}>
            {brand.promise} {t("footer.promiseSuffix")}
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
          fontSize: 11.5,
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
    fontSize: 12,
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
        flex: "1 1 420px",
        flexWrap: "wrap",
      }}
    >
      <h2 style={{ margin: 0, color: colors.textBright, fontSize: 12, fontWeight: 800 }}>{title}</h2>
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
