# Poe — Mascot Spec

**Version:** 2.0.0
**Status:** Active — supersedes the mascot prompt in `BRAND.md` Phase 3.
**Reference art:** `assets/brand/source/poe_the_guide_to_perseverance.png`

Poe is Grip's guide through the job hunt. This document is the single
source of truth for how he looks. Tone and voice stay in `BRAND.md`.

---

## 1. Canonical identity

Never varies between renders, poses, or media.

- **Species:** common raven (*Corvus corax*). Heavy beak, shaggy throat
  hackles, wedge tail. Not a crow — the hackles are the tell.
- **Plumage:** black base with cool **teal-green** structural iridescence on
  the nape, scapulars, and wing coverts. Never blue-violet.
- **Eye:** dark, one small specular highlight. Alert and calm. Never enlarged,
  never anthropomorphic.
- **Beak:** matte charcoal, nasal bristles over the base.
- **Wardrobe:** narrow teal silk collar with thin gold trim, and a small oval
  gold locket engraved with the letter **P** at the throat. Nothing else — no
  hat, no glasses, no clothing.

### Palette

| Role | Hex | Use |
|---|---|---|
| Base | `#0A0F0F` | feathers, background void |
| Teal accent | `#14B8A6` | iridescence, collar |
| Teal bright | `#2DD4BF` | rim light, celebration glow |
| Poe Gold | `#D4A574` | locket, collar trim only |

Gold appears only on metal. Tinting anything else gold breaks the read.

---

## 2. Photoreal build (Blender) — primary

The hero treatment. Use for marketing, the About page, and any large render.

### Feathers

Four hair-curve systems, plus hand-placed geometry:

1. Contour body coat
2. Nape and throat hackles — give these real length, they carry the silhouette
3. Wing coverts
4. Primaries and secondaries as instanced mesh feathers on the wing

Feather cards do not hold up at hero scale. Use curves.

### Shading

- Base albedo **0.02–0.04 linear**. Never pure black, or unlit feathers
  collapse to dead pixels.
- Iridescence via thin-film or a Fresnel-driven color ramp, deep teal to
  green, masked to nape and coverts. Drive it with the layer weight node so it
  only fires at grazing angles.
- Do **not** tint the base color teal. That is the single most common failure
  and reads immediately as fake.
- Body matte, satin sheen only on lit edges.

### Locket and collar

Hard-surface, modeled separately. Gold at metallic `1.0`, roughness `~0.25`.
The engraved **P** is geometry or a normal map, never a flat decal. Silk collar
carries a sheen value — that material contrast against feathers sells the scale.

### Lighting

- Large cool key, upper left.
- Thin bright rim behind camera-right, to pull the silhouette off the dark
  background.
- One small warm area light aimed only at the locket.
- Near-black seamless background, subtle vignette, no environment detail.

### Renderer

Cycles with hair curves. Eevee Next does not resolve grazing-angle
iridescence convincingly.

### Reference-plate prompt

For generating modeling reference. Run front, side, three-quarter, and back at
identical lens and lighting so the plates line up.

```
Photorealistic common raven (Corvus corax), studio wildlife photography,
three-quarter portrait, shot on 85mm at f/4, shallow depth of field falling
off behind the head. Black plumage with cool teal-green structural
iridescence across the nape, scapulars and wing coverts; individual barbs
and shaft lines readable, matte body with satin sheen only on lit edges.
Heavy matte-charcoal beak with nasal bristles over the base. Dark eye with
one small specular. Narrow teal silk collar with gold trim and a small oval
gold locket engraved "P". Near-black seamless background, cool key from
upper left, faint warm gold bounce on the locket only. No stylization.
```

**Negative:** `cartoon, chibi, cute, big eyes, smiling, human hands, hat,
scarf, clothing, bright background, daylight, purple or blue iridescence,
glossy plastic, sticker, thick outline, watermark, text`

---

## 3. Icon mark — secondary

A separate asset, not a downscaled hero render. Detail at 20px is noise.

Flat silhouette, teal on transparent, head-and-shoulders only, locket reduced
to a single gold dot. Must read at 16px. Ships as SVG.

---

## 4. Poses

One line each, appended to the base identity. Matches the four panels in the
reference art.

| Pose | Description |
|---|---|
| Neutral / wise | Perched on a stack of old books, wings folded, head level. |
| Rank-up | Wings spread wide, beak open, teal arrow and paper confetti behind. |
| Analytical | Leaning over a parchment map, teal quill held in one claw, books beside. |
| Supportive | Head tilted down and inward, softened posture, broken teal arrow on the ground. |

---

## 5. Version history

| Version | Date | Change |
|---|---|---|
| 2.0.0 | 2026-09-10 | Photoreal Blender build becomes the primary treatment. Split the icon mark into its own asset. Dropped "not photo-real", "modern minimalism", and the single-prompt-serves-all-sizes constraint from v1 — all three contradicted the reference art. |
| 1.0.0 | — | Original Midjourney mascot prompt, `BRAND.md` Phase 3. Illustrated, minimalist, explicitly non-photoreal. |

Bump minor for a new pose or treatment. Bump major when the canonical identity
in section 1 changes, since that invalidates existing renders.
