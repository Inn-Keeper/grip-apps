import type { CSSProperties } from "react";
import { useId, useRef, useState } from "react";
import { t } from "@grip/core/i18n";
import { colors, tints, font } from "@grip/core/tokens";
import { BrandIcon } from "./BrandIcon";
import { filterGroups } from "./comboboxFilter.js";
import { fieldStyle } from "./fieldStyles";

const DEFAULT_MAX_HEIGHT = 178;

const labelStyle: CSSProperties = {
  fontSize: font.size.label,
  fontWeight: 600,
  color: colors.textFaint,
  letterSpacing: "0.03em",
};

// The shared field standard (40px, 8px corners); focus rings come from index.html.
const controlStyle: CSSProperties = fieldStyle;

// A disabled option is shown (with its reason in the label) but cannot be chosen.
type Option = { label: string; value: string; color?: string; disabled?: boolean };
type OptionGroup = { label: string | null; options: Option[] };

type ComboboxProps = {
  label?: string;
  value: string;
  options: Option[] | OptionGroup[];
  onChange: (value: string) => void;
  placeholder?: string;
  style?: CSSProperties;
  triggerStyle?: CSSProperties;
  maxHeight?: number;
  searchable?: boolean;
  /** A search field above a closed list: filters by option or group label, and only a real option can be chosen. */
  filterable?: boolean;
  /** Greys the trigger and refuses to open it, like a native select's disabled. */
  disabled?: boolean;
};

/**
 * Single-select dropdown with keyboard support and optional option groups.
 * Pass `searchable` to turn the trigger into a free-text typeahead: the typed
 * value filters the options, and any text the user types is kept (it doesn't
 * have to match an option) — used for fields like Role/Position where the list
 * is a set of suggestions rather than a closed enum.
 */
export function Combobox({
  label,
  value,
  options,
  onChange,
  placeholder = "Select...",
  style,
  triggerStyle: triggerOverrides,
  maxHeight = DEFAULT_MAX_HEIGHT,
  searchable = false,
  filterable = false,
  disabled = false,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [filter, setFilter] = useState("");
  const listboxId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);

  const flatOptions = flattenOptions(options);
  const selected = flatOptions.find((option) => option.value === value);

  const query = searchable ? (value ?? "").trim().toLowerCase() : "";
  const searchOptions = query
    ? flatOptions.filter((option) => option.label.toLowerCase().includes(query))
    : flatOptions;
  const groups = searchable
    ? [{ label: null, options: searchOptions }]
    : filterable
      ? filterGroups(normalizeGroups(options), filter.trim().toLowerCase())
      : normalizeGroups(options);
  // Keyboard order follows what's on screen.
  const visibleOptions = searchable ? searchOptions : groups.flatMap((group) => group.options);
  const activeOption = visibleOptions[Math.min(activeIndex, Math.max(visibleOptions.length - 1, 0))];

  // The filter starts empty on every open, so a closed list never hides options.
  const openList = () => {
    setFilter("");
    setActiveIndex(0);
    setOpen(true);
  };
  const close = () => {
    setOpen(false);
    // The filter field unmounts with the list; hand focus back to the trigger.
    if (filterable) triggerRef.current?.focus();
  };

  const choose = (nextValue: string) => {
    if (flatOptions.find((option) => option.value === nextValue)?.disabled) return;
    onChange(nextValue);
    close();
    setActiveIndex(0);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    const openKeys = searchable ? ["ArrowDown", "ArrowUp"] : ["ArrowDown", "ArrowUp", "Enter", " "];
    if (!open && openKeys.includes(event.key)) {
      event.preventDefault();
      openList();
      return;
    }
    if (event.key === "Escape") {
      close();
      return;
    }
    if (!visibleOptions.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % visibleOptions.length);
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + visibleOptions.length) % visibleOptions.length);
    }
    // Space types in a text field and picks everywhere else.
    const typing = event.target instanceof HTMLInputElement;
    if ((event.key === "Enter" || (!typing && event.key === " ")) && open && activeOption) {
      event.preventDefault();
      choose(activeOption.value);
    }
  };

  return (
    <div
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0, ...style }}
    >
      {label && <span style={labelStyle}>{label}</span>}
      <div style={{ position: "relative" }}>
        {searchable ? (
          <input
            role="combobox"
            aria-expanded={open}
            aria-controls={listboxId}
            aria-autocomplete="list"
            value={value ?? ""}
            onChange={(event) => {
              onChange(event.target.value);
              setOpen(true);
              setActiveIndex(0);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoComplete="off"
            style={{ ...controlStyle, cursor: "text", ...triggerOverrides }}
          />
        ) : (
          <button
            ref={triggerRef}
            type="button"
            role="combobox"
            aria-expanded={open}
            aria-controls={listboxId}
            disabled={disabled}
            onClick={() => !disabled && (open ? setOpen(false) : openList())}
            onKeyDown={handleKeyDown}
            style={{
              ...controlStyle,
              cursor: disabled ? "default" : "pointer",
              color: disabled ? colors.textFaint : controlStyle.color,
              ...triggerOverrides,
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              {selected?.color && <span style={{ width: 8, height: 8, borderRadius: 4, background: selected.color, flex: "0 0 auto" }} />}
              <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "left" }}>
                {selected?.label ?? placeholder}
              </span>
              <BrandIcon name="arrowDown" color={colors.textFaint} size={12} />
            </span>
          </button>
        )}
        {open && (!searchable || visibleOptions.length > 0) && (
          <div
            style={{
              position: "absolute",
              zIndex: 50,
              left: 0,
              right: 0,
              top: "calc(100% + 6px)",
              background: colors.bgDeep,
              border: `1px solid ${colors.borderSoft}`,
              borderRadius: 8,
              boxShadow: "0 16px 36px rgba(0, 0, 0, 0.28)",
              padding: 4,
            }}
          >
            {filterable && (
              <input
                type="search"
                aria-label={label ?? t("common.search")}
                aria-controls={listboxId}
                value={filter}
                onChange={(event) => {
                  setFilter(event.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder={t("common.search")}
                autoComplete="off"
                autoFocus
                style={{ ...controlStyle, minHeight: 34, padding: "6px 10px", marginBottom: 4, cursor: "text" }}
              />
            )}
            {filterable && visibleOptions.length === 0 && (
              <p style={{ margin: 0, padding: "8px 10px", fontSize: font.size.small, color: colors.textFaint }}>{t("common.noMatches")}</p>
            )}
            <div id={listboxId} role="listbox" style={{ maxHeight, overflowY: "auto" }}>
              {groups.map((group) => (
                <div key={group.label ?? "options"}>
                  {group.label && (
                    <div style={{ padding: "7px 10px 5px", color: colors.textFaint, fontSize: font.size.caption, fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase" }}>
                      {group.label}
                    </div>
                  )}
                  {group.options.map((option) => {
                    const index = visibleOptions.findIndex((item) => item.value === option.value);
                    const active = index === activeIndex;
                    const selectedOption = option.value === value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        role="option"
                        aria-selected={selectedOption}
                        aria-disabled={option.disabled || undefined}
                        tabIndex={-1}
                        onPointerDown={(event) => {
                          event.preventDefault();
                          choose(option.value);
                        }}
                        onMouseEnter={() => setActiveIndex(index)}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "8px 10px",
                          background: selectedOption || active ? tints.accentSoft : "transparent",
                          border: "none",
                          borderRadius: 6,
                          color: selectedOption || active ? colors.accentBright : colors.textDim,
                          textAlign: "left",
                          fontSize: font.size.body,
                          fontWeight: selectedOption || active ? 800 : 650,
                          cursor: option.disabled ? "not-allowed" : "pointer",
                          opacity: option.disabled ? 0.5 : 1,
                        }}
                      >
                        {option.color && <span style={{ width: 8, height: 8, borderRadius: 4, background: option.color, flex: "0 0 auto" }} />}
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function normalizeGroups(options: Option[] | OptionGroup[]): OptionGroup[] {
  if (!options.length) return [];
  return "options" in options[0]! ? (options as OptionGroup[]) : [{ label: null, options: options as Option[] }];
}

function flattenOptions(options: Option[] | OptionGroup[]): Option[] {
  return normalizeGroups(options).flatMap((group) => group.options);
}
