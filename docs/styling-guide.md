# Styling Guide

This guide clarifies when and how to style components in the Grip design system.

## The Hybrid Approach

We use **two complementary strategies**:

1. **CSS Modules** for animation-heavy and state-driven components
2. **Inline React CSSProperties** for simple layout and dynamic values

This avoids over-engineering simple styles while keeping complex logic maintainable.

## CSS Modules

### When to Use

- Animations with @keyframes or complex transitions
- Media queries (responsive design)
- Pseudo-classes (:hover, :focus, :before, :after)
- 3D transforms and advanced CSS features
- Multiple state variants on a single element

### File Structure

Colocate the `.module.css` file with its component:

```
src/
  MyComponent.tsx
  MyComponent.module.css
```

### Example

**MyComponent.module.css:**

```css
@keyframes slideIn {
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
}

.card {
  animation: slideIn 0.3s ease-out;
  border-radius: 8px;
}

.card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

@media (max-width: 768px) {
  .card { width: 100%; }
}
```

**MyComponent.tsx:**

```tsx
import styles from "./MyComponent.module.css";

export function MyComponent() {
  return <div className={styles.card}>Content</div>;
}
```

## Inline Styles

### When to Use

- Flexbox or Grid layout setup
- Dynamic values from props
- One-off styling for a single element
- Simple properties (color, font-size, padding)

### Best Practices

- Import and use design tokens for all values
- Keep styles concise; if it spans multiple lines, consider CSS Modules
- Use TypeScript `React.CSSProperties` type for safety

### Example

**Inline with tokens:**

```tsx
import { colors, space, font } from "@grip/core/tokens";

export function Header() {
  return (
    <header
      style={{
        display: "flex",
        gap: space.md,
        padding: `${space.lg}px ${space.xl}px`,
        background: colors.bg,
        color: colors.text,
        fontSize: font.size.heading,
      }}
    >
      Logo
    </header>
  );
}
```

## Shared Style Objects

For repeated patterns, extract to shared component or object:

### Use Component Wrappers (Preferred)

**Instead of:**

```tsx
<input style={inputStyle} />
<input style={inputStyle} />
```

**Do this:**

```tsx
<FormInput />
<FormInput />
```

See `apps/web/src/components/FormInput.tsx`, `MiniButton.tsx`.

### Use Shared Objects (Legacy, Deprecated)

If a shared object is unavoidable, export from `apps/web/src/components/shared.tsx`:

```tsx
import { inputStyle, miniBtn } from "./shared.tsx";

// inputStyle is deprecated; use <FormInput /> instead
```

## Design Tokens

**Never hardcode values.** Always use tokens from `@grip/core/tokens`:

### Colors

```tsx
import { colors, tints } from "@grip/core/tokens";

// Correct
<div style={{ color: colors.text }}>Text</div>

// Wrong
<div style={{ color: "#E8ECF4" }}>Text</div>

// Opacity via concatenation
<div style={{ borderColor: `${colors.border}40` }}>Border</div>

// Pre-baked tints (8-digit hex)
<div style={{ background: tints.modalScrim }}>Scrim</div>
```

### Spacing

```tsx
import { space } from "@grip/core/tokens";

// Correct
<div style={{ gap: space.md, padding: `${space.lg}px` }}>Content</div>

// Wrong
<div style={{ gap: 12, padding: "16px" }}>Content</div>

// Token scale: xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28
```

### Typography

```tsx
import { font } from "@grip/core/tokens";

// Correct
<h1 style={{ fontSize: font.size.heading, fontWeight: "700" }}>Title</h1>

// Wrong
<h1 style={{ fontSize: 20, fontWeight: 700 }}>Title</h1>

// Font sizes: caption: 10, label: 11, small: 12, body: 13, bodyLg: 15, title: 17, heading: 20, display: 28
// Font weights: always string literals ("400", "600", "700", "800")
```

### Radius

```tsx
import { radius } from "@grip/core/tokens";

// Correct
<div style={{ borderRadius: radius.md }}>Card</div>

// Scale: sm: 8, md: 12, lg: 16, pill: 999
```

## Checklist: Before Committing Styles

- [ ] All colors from `colors` or `tints`?
- [ ] All spacing from `space`?
- [ ] All font sizes from `font.size`?
- [ ] All font weights string literals ("600", not 600)?
- [ ] All border radius from `radius`?
- [ ] Animations/media queries in CSS Modules, not inline?
- [ ] Pseudo-classes in CSS Modules, not inline?
- [ ] No hardcoded hex, px, or numeric weights?
- [ ] Shared styles in component wrappers or `shared.tsx`, not duplicated?

## Responsive Design

### Web: Media Queries in CSS Modules

Define breakpoints in your `.module.css`:

```css
@media (max-width: 1024px) {
  .layout { grid-template-columns: 1fr; }
}

@media (max-width: 640px) {
  .layout { padding: 8px; }
}
```

### Mobile: Safe-Area Insets

Use React Native safe-area context:

```tsx
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function Screen() {
  const insets = useSafeAreaInsets();
  return <View style={{ paddingTop: insets.top }}>Content</View>;
}
```

## Accessibility

- Use `prefers-reduced-motion` to disable animations for users who prefer it
- Ensure sufficient color contrast (WCAG AA minimum 4.5:1 for text)
- Test with screen readers for semantic structure

Example:

```css
@media (prefers-reduced-motion: reduce) {
  .card { animation: none; transition: none; }
}
```

---

For questions on style strategy, check `DESIGN.md` or open a discussion in the team channel.
