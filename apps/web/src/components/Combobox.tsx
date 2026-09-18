import type { CSSProperties } from "react";
import { useId, useState } from "react";
import { colors, tints } from "@grip/core/tokens";
import { BrandIcon } from "./BrandIcon";

const DEFAULT_MAX_HEIGHT = 178;

const labelStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: colors.textFaint,
  letterSpacing: "0.03em",
};

const controlStyle: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "8px 10px",
  background: colors.bgDeep,
  border: `1px solid ${colors.borderSoft}`,
  borderRadius: 8,
  color: colors.text,
  fontSize: 13,
  outline: "none",
  fontFamily: "inherit",
};

type Option = { label: string; value: string; color?: string };
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
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const listboxId = useId();

  const flatOptions = flattenOptions(options);
  const selected = flatOptions.find((option) => option.value === value);

  const query = searchable ? (value ?? "").trim().toLowerCase() : "";
  const visibleOptions = query
    ? flatOptions.filter((option) => option.label.toLowerCase().includes(query))
    : flatOptions;
  const groups = searchable ? [{ label: null, options: visibleOptions }] : normalizeGroups(options);
  const activeOption = visibleOptions[Math.min(activeIndex, Math.max(visibleOptions.length - 1, 0))];

  const choose = (nextValue: string) => {
    onChange(nextValue);
    setOpen(false);
    setActiveIndex(0);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    const openKeys = searchable ? ["ArrowDown", "ArrowUp"] : ["ArrowDown", "ArrowUp", "Enter", " "];
    if (!open && openKeys.includes(event.key)) {
      event.preventDefault();
      setOpen(true);
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
    if ((event.key === "Enter" || (!searchable && event.key === " ")) && open && activeOption) {
      event.preventDefault();
      choose(activeOption.value);
    }
    if (event.key === "Escape") {
      setOpen(false);
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
            type="button"
            role="combobox"
            aria-expanded={open}
            aria-controls={listboxId}
            onClick={() => setOpen((v) => !v)}
            onKeyDown={handleKeyDown}
            style={{ ...controlStyle, cursor: "pointer", ...triggerOverrides }}
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
            id={listboxId}
            role="listbox"
            style={{
              position: "absolute",
              zIndex: 50,
              left: 0,
              right: 0,
              top: "calc(100% + 6px)",
              maxHeight,
              overflowY: "auto",
              background: colors.bgDeep,
              border: `1px solid ${colors.borderSoft}`,
              borderRadius: 8,
              boxShadow: "0 16px 36px rgba(0, 0, 0, 0.28)",
              padding: 4,
            }}
          >
            {groups.map((group) => (
              <div key={group.label ?? "options"}>
                {group.label && (
                  <div style={{ padding: "7px 10px 5px", color: colors.textFaint, fontSize: 10, fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase" }}>
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
                        fontSize: 12.5,
                        fontWeight: selectedOption || active ? 800 : 650,
                        cursor: "pointer",
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
