import React, { useEffect, useState } from "react";
import { Plus, Trash2, Check } from "lucide-react";
import { COLORS, FONTS, SPACING } from "../theme";
import EditField from "../components/EditField";
import CopyButton from "../components/CopyButton";
import { SectionHeader } from "./Cast";
import { supabase, hasSupabase } from "../supabase";
import { emitSave } from "../components/SaveBadge";

// Fixed, ordered set of categories. Items are grouped and copied in this order.
const CATEGORIES = [
  "Drinks",
  "Produce",
  "Snacks",
  "Meat & Seafood",
  "Pantry",
  "Household",
  "Other",
];

const CATEGORY_EMOJI = {
  Drinks: "🍹",
  Produce: "🥑",
  Snacks: "🍿",
  "Meat & Seafood": "🐟",
  Pantry: "🥫",
  Household: "🧽",
  Other: "📦",
};

const DEFAULT_ITEMS = [
  { item: "Tequila blanco", qty: "2 bottles", category: "Drinks" },
  { item: "Limes", qty: "3 bags", category: "Drinks" },
  { item: "Sparkling water", qty: "1 case", category: "Drinks" },
  { item: "Mexican lager", qty: "2 cases", category: "Drinks" },
  { item: "Avocados", qty: "8", category: "Produce" },
  { item: "Cilantro", qty: "2 bunches", category: "Produce" },
  { item: "Tomatoes & onions", qty: "", category: "Produce" },
  { item: "Tortilla chips", qty: "3 bags", category: "Snacks" },
  { item: "Salsa & guac", qty: "", category: "Snacks" },
  { item: "Fresh fish to grill", qty: "", category: "Meat & Seafood" },
  { item: "Shrimp", qty: "2 lbs", category: "Meat & Seafood" },
  { item: "Coffee", qty: "", category: "Pantry" },
  { item: "Sea salt & olive oil", qty: "", category: "Pantry" },
  { item: "Sunscreen", qty: "", category: "Household" },
  { item: "Trash bags & paper towels", qty: "", category: "Household" },
  { item: "Ziploc bags", qty: "", category: "Other" },
].map((row, i) => ({ id: `local-${i + 1}`, checked: false, sort: i, ...row }));

// Build the clean, email-friendly plain-text version of the list.
function buildClipboardText(items) {
  const lines = ["🛒 Cabo '26 — Grocery List", ""];
  CATEGORIES.forEach((cat) => {
    const inCat = items.filter((i) => i.category === cat && i.item.trim());
    if (!inCat.length) return;
    lines.push(cat);
    inCat.forEach((i) => {
      const marker = i.checked ? "✓" : "•";
      const qty = i.qty && i.qty.trim() ? ` (${i.qty.trim()})` : "";
      lines.push(`${marker} ${i.item.trim()}${qty}`);
    });
    lines.push("");
  });
  return lines.join("\n").trim();
}

export default function GroceryList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!hasSupabase) {
        if (!alive) return;
        setItems(DEFAULT_ITEMS);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("grocery_items")
        .select("id, item, qty, category, checked, sort")
        .order("sort", { ascending: true });
      if (!alive) return;
      let rows;
      if (error) {
        rows = DEFAULT_ITEMS;
      } else if (!data || !data.length) {
        const seedRows = DEFAULT_ITEMS.map(({ id, ...rest }) => rest);
        const { data: seeded, error: seedError } = await supabase
          .from("grocery_items")
          .insert(seedRows)
          .select();
        if (!alive) return;
        if (seedError) console.error("[cabo2026] grocery seed failed:", seedError);
        rows =
          seedError || !seeded
            ? DEFAULT_ITEMS
            : [...seeded].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
      } else {
        rows = data;
      }
      setItems(rows);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const persist = async (row) => {
    if (!hasSupabase || String(row.id).startsWith("local-")) return;
    emitSave("saving");
    const { error } = await supabase.from("grocery_items").upsert(row);
    if (error) console.error("[cabo2026] grocery upsert failed:", error, "payload:", row);
    emitSave(error ? "error" : "saved");
  };

  const updateItem = (id, patch) => {
    const next = items.map((i) => (i.id === id ? { ...i, ...patch } : i));
    setItems(next);
    persist(next.find((i) => i.id === id));
  };

  const toggleChecked = (id) => {
    const current = items.find((i) => i.id === id);
    if (current) updateItem(id, { checked: !current.checked });
  };

  const addItem = async (category) => {
    const nextSort = items.length ? Math.max(...items.map((i) => i.sort ?? 0)) + 1 : 0;
    const draft = {
      id: `local-${Date.now()}`,
      item: "",
      qty: "",
      category,
      checked: false,
      sort: nextSort,
    };
    if (!hasSupabase) {
      setItems([...items, draft]);
      return;
    }
    emitSave("saving");
    const { data, error } = await supabase
      .from("grocery_items")
      .insert({ item: "", qty: "", category, checked: false, sort: nextSort })
      .select()
      .single();
    if (error) {
      console.error("[cabo2026] grocery insert failed:", error);
      setItems([...items, draft]);
      emitSave("error");
      return;
    }
    setItems([...items, data]);
    emitSave("saved");
  };

  const removeItem = async (id) => {
    setItems(items.filter((i) => i.id !== id));
    if (!hasSupabase || String(id).startsWith("local-")) return;
    emitSave("saving");
    const { error } = await supabase.from("grocery_items").delete().eq("id", id);
    if (error) console.error("[cabo2026] grocery delete failed:", error);
    emitSave(error ? "error" : "saved");
  };

  const remaining = items.filter((i) => i.item.trim() && !i.checked).length;
  const clipboardText = buildClipboardText(items);

  return (
    <section id="groceries" style={{ background: COLORS.sand, padding: SPACING.section }}>
      <div style={{ maxWidth: 820, margin: "0 auto" }}>
        <SectionHeader eyebrow="Stock the Villa" title="The Grocery List" />

        <p
          style={{
            textAlign: "center",
            fontFamily: FONTS.sans,
            fontSize: "0.9rem",
            color: COLORS.muted,
            margin: "14px 0 0",
            lineHeight: 1.5,
          }}
        >
          Tap any item to edit, check it off when it's in the cart, then copy the whole list to
          text or email.
        </p>

        <div style={{ marginTop: 18, display: "flex", justifyContent: "center" }}>
          <CopyButton value={clipboardText} label="Copy list" copiedLabel="Copied!" />
        </div>

        {loading ? (
          <div style={{ marginTop: 40, display: "grid", gap: 12 }}>
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton" style={{ height: 56 }} />
            ))}
          </div>
        ) : (
          <div style={{ marginTop: 36, display: "grid", gap: 18 }}>
            {CATEGORIES.map((cat) => {
              const catItems = items.filter((i) => i.category === cat);
              return (
                <div
                  key={cat}
                  style={{
                    background: "#fff",
                    borderRadius: 16,
                    border: "1px solid rgba(38,70,83,0.08)",
                    boxShadow: "0 4px 14px rgba(38,70,83,0.04)",
                    padding: "16px 18px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontFamily: FONTS.sans,
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                      color: COLORS.terracotta,
                      marginBottom: catItems.length ? 10 : 4,
                    }}
                  >
                    <span aria-hidden style={{ fontSize: "1rem" }}>
                      {CATEGORY_EMOJI[cat]}
                    </span>
                    {cat}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {catItems.map((it) => (
                      <GroceryRow
                        key={it.id}
                        item={it}
                        onToggle={() => toggleChecked(it.id)}
                        onChangeItem={(v) => updateItem(it.id, { item: v })}
                        onChangeQty={(v) => updateItem(it.id, { qty: v })}
                        onRemove={() => removeItem(it.id)}
                      />
                    ))}
                  </div>

                  <button
                    onClick={() => addItem(cat)}
                    style={{
                      marginTop: 8,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      fontFamily: FONTS.sans,
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      color: COLORS.teal,
                      padding: "6px 12px",
                      borderRadius: 999,
                      background: "rgba(42,157,143,0.08)",
                      transition: "background 0.2s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(42,157,143,0.16)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(42,157,143,0.08)")}
                  >
                    <Plus size={14} /> Add item
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {!loading && (
          <p
            style={{
              textAlign: "center",
              fontFamily: FONTS.mono,
              fontSize: "0.74rem",
              color: COLORS.muted,
              marginTop: 22,
              letterSpacing: "0.04em",
            }}
          >
            {remaining} {remaining === 1 ? "item" : "items"} still to grab
          </p>
        )}
      </div>
    </section>
  );
}

function GroceryRow({ item, onToggle, onChangeItem, onChangeQty, onRemove }) {
  const done = item.checked;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "8px 0",
        borderBottom: "1px solid rgba(38,70,83,0.06)",
      }}
    >
      <button
        onClick={onToggle}
        aria-label={done ? "Mark as not bought" : "Mark as bought"}
        style={{
          flexShrink: 0,
          width: 22,
          height: 22,
          borderRadius: "50%",
          border: `2px solid ${done ? COLORS.teal : "rgba(38,70,83,0.3)"}`,
          background: done ? COLORS.teal : "transparent",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.15s ease",
        }}
      >
        {done && <Check size={13} strokeWidth={3} />}
      </button>

      <div style={{ flex: 1, minWidth: 0, fontFamily: FONTS.sans, fontSize: "0.95rem", color: COLORS.night }}>
        <EditField
          value={item.item}
          onChange={onChangeItem}
          placeholder="Add an item…"
          ariaLabel="Grocery item"
          style={{
            textDecoration: done ? "line-through" : "none",
            color: done ? COLORS.muted : undefined,
          }}
        />
      </div>

      <div style={{ flexShrink: 0, fontFamily: FONTS.mono, fontSize: "0.82rem", color: COLORS.muted }}>
        <EditField
          value={item.qty}
          onChange={onChangeQty}
          placeholder="qty"
          ariaLabel="Quantity or note"
        />
      </div>

      <button
        onClick={onRemove}
        aria-label="Remove item"
        style={{
          flexShrink: 0,
          color: COLORS.muted,
          opacity: 0.5,
          padding: 6,
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          transition: "all 0.15s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = COLORS.terracotta;
          e.currentTarget.style.opacity = 1;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = COLORS.muted;
          e.currentTarget.style.opacity = 0.5;
        }}
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}
