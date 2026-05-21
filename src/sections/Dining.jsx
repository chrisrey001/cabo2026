import React, { useEffect, useMemo, useState } from "react";
import { UtensilsCrossed, Clock, MapPin, Phone, Navigation, Heart, Plus, CheckCircle2, Circle } from "lucide-react";
import { COLORS, FONTS, SPACING } from "../theme";
import { SectionHeader } from "./Cast";
import EditField from "../components/EditField";
import CenteredGrid from "../components/CenteredGrid";
import VoterModal from "../components/VoterModal";
import VoterPills from "../components/VoterPills";
import { supabase, hasSupabase } from "../supabase";
import { emitSave } from "../components/SaveBadge";
import { useVoterIdentity } from "../hooks/useVoterIdentity";
import { parseCostNum } from "../utils/cost";
import { applyChange, sortBySort } from "../utils/realtime";

const AREAS = ["Cabo San Lucas", "Tourist Corridor", "San Jose del Cabo"];

const DEFAULT_DINING = [
  // ── Tourist Corridor ──────────────────────────────────────────────────────
  { name: "Nick-San Palmilla", cost: "$70–95/pp", cuisine: "Japanese-Mexican Fusion", area: "Tourist Corridor", distance: "2 min walk", hours: "12 – 10:30 PM", phone: "+52 624 144 6262", vibe: "Elevated sushi, walkable from villa", book: "Call ahead", cost_num: 82, sort: 0 },
  { name: "One&Only Restaurants", cost: "$80–130/pp", cuisine: "SUVICHE / Seared / Agua", area: "Tourist Corridor", distance: "Walkable", hours: "Varies by venue", phone: "+52 624 146 7000", vibe: "Resort dining, multiple options", book: "Resort reservation", cost_num: 105, sort: 1 },
  { name: "Sunset Monalisa", cost: "$135–200/pp", cuisine: "Mediterranean", area: "Tourist Corridor", distance: "20 min drive", hours: "4 – 11 PM", phone: "+52 624 145 8160", vibe: "Fine dining, cliffside sunset", book: "Reserve online", cost_num: 167, sort: 2 },
  { name: "Cayao by Richard Sandoval", cost: "$70–120/pp", cuisine: "Modern Mexican", area: "Tourist Corridor", distance: "10 min drive", hours: "6 – 10 PM", phone: "", vibe: "Four Seasons, sophisticated, Mexican-inspired", book: "Reserve ahead", cost_num: 95, sort: 3 },
  { name: "Coraluz", cost: "$75–130/pp", cuisine: "Mediterranean Seafood", area: "Tourist Corridor", distance: "10 min drive", hours: "5:30 – 10 PM", phone: "", vibe: "Four Seasons, stunning ocean views", book: "Reserve ahead", cost_num: 102, sort: 4 },
  { name: "Comal", cost: "$60–95/pp", cuisine: "Modern Mexican", area: "Tourist Corridor", distance: "15 min drive", hours: "6 – 10 PM", phone: "", vibe: "Chileno Bay Resort, open-air kitchen", book: "Reserve ahead", cost_num: 77, sort: 5 },
  { name: "Manta", cost: "$65–110/pp", cuisine: "Asian-Mexican Fusion", area: "Tourist Corridor", distance: "20 min drive", hours: "6 – 10:30 PM", phone: "", vibe: "The Cape Hotel, creative seafood fusion", book: "Reserve ahead", cost_num: 87, sort: 6 },
  { name: "Marea", cost: "$70–120/pp", cuisine: "Mediterranean Seafood", area: "Tourist Corridor", distance: "15 min drive", hours: "6 – 10 PM", phone: "", vibe: "Montage Los Cabos, oceanfront terrace", book: "Reserve ahead", cost_num: 95, sort: 7 },
  { name: "Talay", cost: "$65–105/pp", cuisine: "Thai-Asian", area: "Tourist Corridor", distance: "15 min drive", hours: "6 – 10 PM", phone: "", vibe: "Montage Los Cabos, authentic Thai flavors", book: "Reserve ahead", cost_num: 85, sort: 8 },
  { name: "Rosa Negra", cost: "$55–90/pp", cuisine: "Latin-Japanese Fusion", area: "Tourist Corridor", distance: "20 min drive", hours: "12 – 11 PM", phone: "", vibe: "Lively, fusion cuisine, DJ nights", book: "Reserve ahead", cost_num: 72, sort: 9 },
  { name: "Jazz on the Rocks", cost: "$60–95/pp", cuisine: "Seafood & Steak", area: "Tourist Corridor", distance: "15 min drive", hours: "5 – 10 PM", phone: "", vibe: "Iconic cliffside dining, live jazz, sunsets", book: "Reserve ahead", cost_num: 77, sort: 10 },
  { name: "Palmerio", cost: "$60–100/pp", cuisine: "Italian", area: "Tourist Corridor", distance: "15 min drive", hours: "6 – 10:30 PM", phone: "", vibe: "Elegant Italian, pasta, seafood, wine list", book: "Reserve ahead", cost_num: 80, sort: 11 },
  { name: "Metate", cost: "$55–90/pp", cuisine: "Modern Mexican", area: "Tourist Corridor", distance: "20 min drive", hours: "6:30 – 10:30 PM", phone: "", vibe: "Market-driven, creative Mexican cuisine", book: "Reserve ahead", cost_num: 72, sort: 12 },
  { name: "El Huerto", cost: "$50–80/pp", cuisine: "Farm-to-Table", area: "Tourist Corridor", distance: "20 min drive", hours: "12 – 10 PM", phone: "", vibe: "Garden setting, fresh local ingredients", book: "Walk-in OK", cost_num: 65, sort: 13 },
  { name: "Yaya", cost: "$55–85/pp", cuisine: "Mediterranean", area: "Tourist Corridor", distance: "15 min drive", hours: "6 – 10 PM", phone: "", vibe: "Chileno Bay Resort, poolside Mediterranean", book: "Reserve ahead", cost_num: 70, sort: 14 },
  { name: "TNT", cost: "$30–55/pp", cuisine: "Casual Dining", area: "Tourist Corridor", distance: "15 min drive", hours: "8 AM – 10 PM", phone: "", vibe: "Chileno Bay Resort, breakfast to dinner", book: "Walk-in OK", cost_num: 42, sort: 15 },
  { name: "The Rooftop at the Cape", cost: "$20–45/pp", cuisine: "Bar & Light Bites", area: "Tourist Corridor", distance: "20 min drive", hours: "2 PM – 1 AM", phone: "", vibe: "The Cape Hotel, 360° views, sunset ritual", book: "Walk-in OK", cost_num: 32, sort: 16 },
  { name: "The Ledge", cost: "$20–40/pp", cuisine: "Cocktail Bar", area: "Tourist Corridor", distance: "20 min drive", hours: "3 PM – 12 AM", phone: "", vibe: "The Cape Hotel rooftop, infinity pool views", book: "Walk-in OK", cost_num: 30, sort: 17 },
  { name: "Mezcal", cost: "$20–40/pp", cuisine: "Cocktail Lounge", area: "Tourist Corridor", distance: "15 min drive", hours: "4 PM – 12 AM", phone: "", vibe: "Montage Los Cabos bar, 100+ mezcals", book: "Walk-in OK", cost_num: 30, sort: 18 },

  // ── Cabo San Lucas ────────────────────────────────────────────────────────
  { name: "El Farallón", cost: "$135–315/pp", cuisine: "Cliffside Seafood", area: "Cabo San Lucas", distance: "30 min drive", hours: "5:30 – 10 PM", phone: "+52 624 163 0000", vibe: "Prix fixe, Waldorf Astoria, ocean drama", book: "Hotel concierge", cost_num: 225, sort: 19 },
  { name: "Harry's", cost: "$65–110/pp", cuisine: "Steakhouse", area: "Cabo San Lucas", distance: "30 min drive", hours: "5:30 – 11 PM", phone: "", vibe: "Upscale steakhouse, prime cuts, jazz vibe", book: "Reserve ahead", cost_num: 87, sort: 20 },
  { name: "Edith's", cost: "$55–85/pp", cuisine: "Mexican Grill", area: "Cabo San Lucas", distance: "30 min drive", hours: "5:30 – 10:30 PM", phone: "+52 624 143 0801", vibe: "Romantic, tableside guacamole, flambéed crepes", book: "Reserve ahead", cost_num: 70, sort: 21 },
  { name: "Bagatelle Los Cabos", cost: "$60–100/pp", cuisine: "French Mediterranean", area: "Cabo San Lucas", distance: "30 min drive", hours: "12 – 12 AM", phone: "", vibe: "Lively, party atmosphere, beachfront", book: "Reserve ahead", cost_num: 80, sort: 22 },
  { name: "Ilios", cost: "$50–80/pp", cuisine: "Greek Mediterranean", area: "Cabo San Lucas", distance: "30 min drive", hours: "12 – 11 PM", phone: "", vibe: "Beachfront, Greek classics, ocean views", book: "Walk-in OK", cost_num: 65, sort: 23 },
  { name: "Nicksan Sushi", cost: "$55–90/pp", cuisine: "Japanese Fusion", area: "Cabo San Lucas", distance: "30 min drive", hours: "12 – 10:30 PM", phone: "+52 624 143 4484", vibe: "Inventive Japanese-Baja fusion", book: "Walk-in OK", cost_num: 72, sort: 24 },
  { name: "Hacienda Cocina Y Cantina", cost: "$45–75/pp", cuisine: "Traditional Mexican", area: "Cabo San Lucas", distance: "30 min drive", hours: "11 AM – 11 PM", phone: "", vibe: "Hacienda-style, tequila list, lively courtyard", book: "Walk-in OK", cost_num: 60, sort: 25 },
  { name: "Los Tres Gallos", cost: "$40–70/pp", cuisine: "Traditional Mexican", area: "Cabo San Lucas", distance: "30 min drive", hours: "2 – 11 PM", phone: "", vibe: "Colorful, festive, colonial courtyard", book: "Walk-in OK", cost_num: 55, sort: 26 },
  { name: "Bar Esquina", cost: "$40–65/pp", cuisine: "Modern Mexican", area: "Cabo San Lucas", distance: "30 min drive", hours: "7 AM – 11 PM", phone: "", vibe: "Casual chic, Bahia Hotel, all-day dining", book: "Walk-in OK", cost_num: 52, sort: 27 },
  { name: "Don Manuel's", cost: "$30–60/pp", cuisine: "Mexican Breakfast & Brunch", area: "Cabo San Lucas", distance: "30 min drive", hours: "7 AM – 2 PM", phone: "", vibe: "Waldorf Astoria terrace, breezy breakfast", book: "Walk-in OK", cost_num: 45, sort: 28 },
  { name: "Maria Jimenez", cost: "$30–55/pp", cuisine: "Home-style Mexican", area: "Cabo San Lucas", distance: "30 min drive", hours: "8 AM – 10 PM", phone: "", vibe: "Beloved local spot, authentic flavors", book: "Walk-in OK", cost_num: 42, sort: 29 },
  { name: "Rooftop 360", cost: "$30–55/pp", cuisine: "Bar & Small Plates", area: "Cabo San Lucas", distance: "30 min drive", hours: "4 PM – 2 AM", phone: "", vibe: "Panoramic rooftop views, cocktails", book: "Walk-in OK", cost_num: 42, sort: 30 },
  { name: "SUR Beach House", cost: "$35–60/pp", cuisine: "Casual Beachfront", area: "Cabo San Lucas", distance: "30 min drive", hours: "8 AM – 8 PM", phone: "", vibe: "Medano Beach, jet ski & kayak rentals", book: "Walk-in OK", cost_num: 47, sort: 31 },

  // ── San Jose del Cabo ──────────────────────────────────────────────────────
  { name: "Flora Farms", cost: "$80–100/pp", cuisine: "Farm-to-Table", area: "San Jose del Cabo", distance: "20 min drive", hours: "5:30 – 10 PM", phone: "+52 624 355 4564", vibe: "Magical outdoor farm, string lights, garden", book: "OpenTable, 4+ weeks ahead", cost_num: 90, sort: 32 },
  { name: "ACRE Baja", cost: "$70–110/pp", cuisine: "Farm-to-Table", area: "San Jose del Cabo", distance: "20 min drive", hours: "6 – 10 PM", phone: "", vibe: "Treehouse dining, farm & orchard setting", book: "Reserve ahead", cost_num: 90, sort: 33 },
  { name: "Omakai", cost: "$80–130/pp", cuisine: "Japanese Omakase", area: "San Jose del Cabo", distance: "15 min drive", hours: "6 – 10 PM", phone: "", vibe: "Intimate chef's counter, premium sushi", book: "Reserve well ahead", cost_num: 105, sort: 34 },
  { name: "Jazamín's", cost: "$55–70/pp", cuisine: "Traditional Mexican", area: "San Jose del Cabo", distance: "10 min drive", hours: "5 – 11 PM", phone: "+52 624 105 2279", vibe: "Lively, Art Walk night pick", book: "Walk-in OK", cost_num: 62, sort: 35 },
  { name: "Arbol", cost: "$70–120/pp", cuisine: "Mediterranean", area: "San Jose del Cabo", distance: "25 min drive", hours: "6:30 – 10 PM", phone: "", vibe: "Las Ventanas al Paraiso, treeside fine dining", book: "Resort reservation", cost_num: 95, sort: 36 },
  { name: "Sea Grill", cost: "$65–100/pp", cuisine: "Seafood", area: "San Jose del Cabo", distance: "25 min drive", hours: "6 – 10 PM", phone: "", vibe: "Las Ventanas al Paraiso, open-fire seafood", book: "Resort reservation", cost_num: 82, sort: 37 },
  { name: "Alebrije", cost: "$60–100/pp", cuisine: "Contemporary Mexican", area: "San Jose del Cabo", distance: "25 min drive", hours: "6 – 10 PM", phone: "", vibe: "Las Ventanas al Paraiso, vibrant, festive", book: "Resort reservation", cost_num: 80, sort: 38 },
  { name: "Don Sanchez", cost: "$55–90/pp", cuisine: "Modern Mexican", area: "San Jose del Cabo", distance: "15 min drive", hours: "5 – 11 PM", phone: "", vibe: "Art Walk favorite, wine cellar, creative menu", book: "Reserve for Art Walk Thurs", cost_num: 72, sort: 39 },
  { name: "Equis", cost: "$60–100/pp", cuisine: "Seafood", area: "San Jose del Cabo", distance: "25 min drive", hours: "6 – 10 PM", phone: "", vibe: "Zadun Ritz Carlton, oceanfront seafood", book: "Resort reservation", cost_num: 80, sort: 40 },
  { name: "Humo", cost: "$55–90/pp", cuisine: "BBQ & Grill", area: "San Jose del Cabo", distance: "25 min drive", hours: "6 – 10 PM", phone: "", vibe: "Zadun Ritz Carlton, fire-kissed meats, open pit", book: "Resort reservation", cost_num: 72, sort: 41 },
  { name: "Lumbre", cost: "$50–85/pp", cuisine: "Modern Mexican", area: "San Jose del Cabo", distance: "15 min drive", hours: "5 – 11 PM", phone: "", vibe: "Fire-inspired cooking, local ingredients", book: "Reserve ahead", cost_num: 67, sort: 42 },
  { name: "Nao", cost: "$45–75/pp", cuisine: "Japanese-Mexican", area: "San Jose del Cabo", distance: "15 min drive", hours: "1 – 10:30 PM", phone: "", vibe: "Inventive fusion, poke, ceviche, omakase-lite", book: "Walk-in OK", cost_num: 60, sort: 43 },
  { name: "SAGE Baja", cost: "$45–75/pp", cuisine: "Modern Baja", area: "San Jose del Cabo", distance: "15 min drive", hours: "6 – 10 PM", phone: "", vibe: "Creative Baja cuisine, botanicals, herbs", book: "Reserve ahead", cost_num: 60, sort: 44 },
  { name: "Fiorenzia", cost: "$50–85/pp", cuisine: "Italian", area: "San Jose del Cabo", distance: "15 min drive", hours: "6 – 10:30 PM", phone: "", vibe: "Classic Italian, house-made pasta, cozy", book: "Walk-in OK", cost_num: 67, sort: 45 },
  { name: "Agave Handcrafted Kitchen", cost: "$45–75/pp", cuisine: "Modern Mexican", area: "San Jose del Cabo", distance: "15 min drive", hours: "2 – 10 PM", phone: "", vibe: "Artisanal cocktails, local produce, warm vibe", book: "Walk-in OK", cost_num: 60, sort: 46 },
  { name: "Zenna", cost: "$55–90/pp", cuisine: "Mediterranean", area: "San Jose del Cabo", distance: "25 min drive", hours: "12 – 10 PM", phone: "", vibe: "Palmilla Dunes Club, poolside Mediterranean", book: "Reserve ahead", cost_num: 72, sort: 47 },
  { name: "Ballena", cost: "$45–75/pp", cuisine: "Seafood", area: "San Jose del Cabo", distance: "15 min drive", hours: "1 – 10 PM", phone: "", vibe: "Fresh seafood, ocean views, relaxed", book: "Walk-in OK", cost_num: 60, sort: 48 },
  { name: "Casa Don Rodrigo", cost: "$40–70/pp", cuisine: "Traditional Mexican", area: "San Jose del Cabo", distance: "15 min drive", hours: "5 – 11 PM", phone: "", vibe: "Historic home, colonial courtyard, mezcal", book: "Walk-in OK", cost_num: 55, sort: 49 },
  { name: "CarbonCabron", cost: "$35–65/pp", cuisine: "BBQ & Steakhouse", area: "San Jose del Cabo", distance: "15 min drive", hours: "12 – 10 PM", phone: "", vibe: "Casual, wood-fired meats, local favorite", book: "Walk-in OK", cost_num: 50, sort: 50 },
  { name: "Guacamayas", cost: "$30–50/pp", cuisine: "Mexican Seafood", area: "San Jose del Cabo", distance: "15 min drive", hours: "10 AM – 10 PM", phone: "", vibe: "Casual ceviche & aguachile, colorful setting", book: "Walk-in OK", cost_num: 40, sort: 51 },
  { name: "El Barrio", cost: "$30–55/pp", cuisine: "Mexican Street Food", area: "San Jose del Cabo", distance: "25 min drive", hours: "12 – 10 PM", phone: "", vibe: "Zadun Ritz Carlton, casual tacos & cocktails", book: "Walk-in OK", cost_num: 42, sort: 52 },
  { name: "La Lupita", cost: "$25–50/pp", cuisine: "Tacos & Mezcal", area: "San Jose del Cabo", distance: "15 min drive", hours: "12 – 11 PM", phone: "", vibe: "Beloved taqueria, extensive mezcal list", book: "Walk-in OK", cost_num: 37, sort: 53 },
  { name: "Baja Brewing Company", cost: "$25–45/pp", cuisine: "American / Craft Beer", area: "San Jose del Cabo", distance: "15 min drive", hours: "12 – 12 AM", phone: "", vibe: "Laid-back brewpub, burgers, local craft beer", book: "Walk-in OK", cost_num: 35, sort: 54 },
  { name: "La Botica", cost: "$15–35/pp", cuisine: "Cocktail Bar", area: "San Jose del Cabo", distance: "25 min drive", hours: "4 PM – 12 AM", phone: "", vibe: "Las Ventanas al Paraiso, artisan cocktails", book: "Walk-in OK", cost_num: 25, sort: 55 },
];

const SORTS = [
  { id: "name", label: "Name" },
  { id: "cost", label: "Cost" },
  { id: "distance", label: "Distance" },
  { id: "votes", label: "Votes" },
];

const BLANK_FORM = { name: "", cost: "", cuisine: "", area: "", distance: "", hours: "", phone: "", vibe: "", book: "" };

export default function Dining() {
  const { voterId, voterName, setVoterName, hasName } = useVoterIdentity();
  const [restaurants, setRestaurants] = useState([]);
  const [rvotes, setRvotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState("name");
  const [areaFilter, setAreaFilter] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [pendingVote, setPendingVote] = useState(null);
  const [pendingBook, setPendingBook] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(BLANK_FORM);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!hasSupabase) {
      setRestaurants(DEFAULT_DINING.map((r, i) => ({ ...r, id: `local-${i}`, added_by: null })));
      setLoading(false);
      return;
    }
    (async () => {
      const [{ data: rData, error: rErr }, { data: vData, error: vErr }] = await Promise.all([
        supabase.from("restaurants").select("*").order("sort", { ascending: true }),
        supabase.from("restaurant_votes").select("*"),
      ]);
      if (rErr) console.error("[cabo2026] restaurants load failed:", rErr);
      if (vErr) console.error("[cabo2026] restaurant_votes load failed:", vErr);

      let rows = rData || [];
      if (!rows.length) {
        const { data: seeded, error: seedErr } = await supabase
          .from("restaurants").insert(DEFAULT_DINING).select();
        if (seedErr) console.error("[cabo2026] restaurants seed failed:", seedErr);
        rows = seeded || DEFAULT_DINING.map((r, i) => ({ ...r, id: `local-${i}` }));
      }
      setRestaurants(rows);
      setRvotes(vData || []);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!hasSupabase) return;
    const ch = supabase
      .channel("dining-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "restaurants" }, (p) =>
        applyChange(setRestaurants, p, { sort: sortBySort })
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "restaurant_votes" }, (p) =>
        applyChange(setRvotes, p, { keyFields: ["restaurant_id", "voter_id"] })
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const persist = async (row) => {
    if (!hasSupabase || String(row.id).startsWith("local-")) return;
    emitSave("saving");
    const { error } = await supabase.from("restaurants").upsert(row);
    if (error) { console.error("[cabo2026] restaurants upsert failed:", error); emitSave("error"); }
    else emitSave("saved");
  };

  const updateOne = (id, patch) => {
    setRestaurants((prev) => {
      const next = prev.map((r) => (r.id === id ? { ...r, ...patch } : r));
      const row = next.find((r) => r.id === id);
      persist(row);
      return next;
    });
  };

  const voteCount = (id) => rvotes.filter((v) => v.restaurant_id === id).length;
  const myVoted = (id) => rvotes.some((v) => v.restaurant_id === id && v.voter_id === voterId);

  const castVote = async (restaurantId, name) => {
    const already = myVoted(restaurantId);
    if (already) {
      setRvotes((prev) => prev.filter((v) => !(v.restaurant_id === restaurantId && v.voter_id === voterId)));
      if (!hasSupabase) return;
      await supabase.from("restaurant_votes").delete().match({ restaurant_id: restaurantId, voter_id: voterId });
    } else {
      const row = { restaurant_id: restaurantId, voter_id: voterId, voter_name: name || null };
      setRvotes((prev) => [...prev, { ...row, id: `local-${Date.now()}` }]);
      if (!hasSupabase) return;
      const { error } = await supabase.from("restaurant_votes").insert(row);
      if (error) {
        console.error("[cabo2026] restaurant_votes insert failed:", error);
        setRvotes((prev) => prev.filter((v) => !(v.restaurant_id === restaurantId && v.voter_id === voterId)));
      }
    }
  };

  const handleVoteClick = (id) => {
    if (!hasName && !myVoted(id)) { setPendingVote(id); setShowModal(true); }
    else castVote(id, voterName);
  };

  const toggleBooking = (id, name) => {
    const row = restaurants.find((r) => r.id === id);
    if (!row) return;
    updateOne(id, row.confirmed_by ? { confirmed_by: null, confirmed_at: null } : { confirmed_by: name || "Anonymous", confirmed_at: new Date().toISOString() });
  };

  const handleBookClick = (id) => {
    const row = restaurants.find((r) => r.id === id);
    if (row?.confirmed_by) { toggleBooking(id); return; }
    if (!hasName) { setPendingBook(id); setShowModal(true); }
    else toggleBooking(id, voterName);
  };

  const handleModalConfirm = (name) => {
    setShowModal(false);
    if (name) setVoterName(name);
    if (pendingVote) { castVote(pendingVote, name || voterName || null); setPendingVote(null); }
    if (pendingBook) { toggleBooking(pendingBook, name || voterName || null); setPendingBook(null); }
  };

  const addRestaurant = async () => {
    if (!form.name.trim()) return;
    setSubmitting(true);
    const nextSort = restaurants.length ? Math.max(...restaurants.map((r) => r.sort ?? 0)) + 1 : 0;
    const draft = { ...form, cost_num: parseCostNum(form.cost), sort: nextSort, added_by: voterName || null };

    if (!hasSupabase) {
      setRestaurants((prev) => [...prev, { ...draft, id: `local-${Date.now()}` }]);
    } else {
      emitSave("saving");
      const { data, error } = await supabase.from("restaurants").insert(draft).select().single();
      if (error) { console.error("[cabo2026] restaurant insert failed:", error); emitSave("error"); }
      else { setRestaurants((prev) => [...prev, data]); emitSave("saved"); }
    }
    setForm(BLANK_FORM); setShowForm(false); setSubmitting(false);
  };

  const sorted = useMemo(() => {
    let arr = [...restaurants];
    if (areaFilter) arr = arr.filter((r) => r.area === areaFilter);
    if (sortKey === "cost") arr.sort((a, b) => (a.cost_num || 0) - (b.cost_num || 0));
    else if (sortKey === "distance") arr.sort((a, b) => a.distance.localeCompare(b.distance));
    else if (sortKey === "votes") arr.sort((a, b) => voteCount(b.id) - voteCount(a.id));
    else arr.sort((a, b) => a.name.localeCompare(b.name));
    return arr;
  }, [restaurants, rvotes, sortKey, areaFilter]);

  const chipBase = { fontFamily: FONTS.sans, fontSize: "0.82rem", fontWeight: 500, padding: "7px 16px", borderRadius: 999, transition: "all 0.2s ease", cursor: "pointer" };

  return (
    <>
      {showModal && (
        <VoterModal onConfirm={handleModalConfirm} onDismiss={() => { setShowModal(false); setPendingVote(null); setPendingBook(null); }} />
      )}
      <section id="dining" style={{ background: COLORS.warmWhite, padding: SPACING.section }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <SectionHeader eyebrow="Where We'll Eat" title="The Dining Guide" />

          {/* Area filter */}
          <div style={{ marginTop: 28, display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
            <button
              onClick={() => setAreaFilter(null)}
              style={{ ...chipBase, fontWeight: !areaFilter ? 700 : 500, color: !areaFilter ? "#fff" : COLORS.indigo, background: !areaFilter ? COLORS.indigo : "rgba(38,70,83,0.06)" }}
            >
              All Areas
            </button>
            {AREAS.map((area) => {
              const active = areaFilter === area;
              return (
                <button
                  key={area}
                  onClick={() => setAreaFilter(active ? null : area)}
                  style={{ ...chipBase, fontWeight: active ? 700 : 500, color: active ? "#fff" : COLORS.coral, background: active ? COLORS.coral : "rgba(244,132,95,0.08)" }}
                >
                  {area}
                </button>
              );
            })}
          </div>

          {/* Sort row */}
          <div style={{ marginTop: 14, display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontFamily: FONTS.sans, fontSize: "0.78rem", color: COLORS.muted, alignSelf: "center", marginRight: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.14em" }}>Sort by</span>
            {SORTS.map((s) => {
              const active = sortKey === s.id;
              return (
                <button key={s.id} onClick={() => setSortKey(s.id)} style={{ ...chipBase, fontWeight: active ? 700 : 500, color: active ? "#fff" : COLORS.indigo, background: active ? COLORS.indigo : "rgba(38,70,83,0.06)" }}>
                  {s.label}
                </button>
              );
            })}
          </div>

          {/* Count */}
          {areaFilter && (
            <p style={{ textAlign: "center", fontFamily: FONTS.sans, fontSize: "0.8rem", color: COLORS.muted, marginTop: 10 }}>
              {sorted.length} restaurant{sorted.length !== 1 ? "s" : ""} in {areaFilter}
            </p>
          )}

          {loading ? (
            <CenteredGrid minWidth={320} gap={16} style={{ marginTop: 32 }}>
              {[0, 1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 260 }} />)}
            </CenteredGrid>
          ) : (
            <CenteredGrid minWidth={300} gap={16} style={{ marginTop: 24 }}>
              {sorted.map((r) => (
                <DiningCard
                  key={r.id}
                  r={r}
                  voteCount={voteCount(r.id)}
                  myVoted={myVoted(r.id)}
                  voters={rvotes.filter((v) => v.restaurant_id === r.id)}
                  onUpdate={(patch) => updateOne(r.id, patch)}
                  onVote={() => handleVoteClick(r.id)}
                  onBook={() => handleBookClick(r.id)}
                />
              ))}
            </CenteredGrid>
          )}

          {showForm ? (
            <div style={{ marginTop: 24, background: "#fff", borderRadius: 16, border: "1px solid rgba(38,70,83,0.1)", padding: "22px 24px", maxWidth: 600, margin: "24px auto 0" }}>
              <p style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: "1rem", color: COLORS.night, margin: "0 0 14px" }}>Add a restaurant</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[["name", "Name *"], ["cuisine", "Cuisine"], ["cost", "Cost (e.g. $60–80/pp)"], ["hours", "Hours"], ["distance", "Distance"], ["phone", "Phone"], ["vibe", "Vibe"], ["book", "How to Book"]].map(([k, label]) => (
                  <input key={k} type="text" placeholder={label} value={form[k]} onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))} style={{ fontFamily: FONTS.sans, fontSize: "0.88rem", padding: "9px 12px", borderRadius: 8, border: "1.5px solid rgba(38,70,83,0.15)", outline: "none", color: COLORS.night, gridColumn: k === "name" ? "span 2" : undefined }} />
                ))}
                <select value={form.area} onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))} style={{ fontFamily: FONTS.sans, fontSize: "0.88rem", padding: "9px 12px", borderRadius: 8, border: "1.5px solid rgba(38,70,83,0.15)", outline: "none", color: form.area ? COLORS.night : COLORS.muted, gridColumn: "span 2" }}>
                  <option value="">Area (optional)</option>
                  {AREAS.map((a) => <option key={a}>{a}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 14, justifyContent: "flex-end" }}>
                <button onClick={() => { setShowForm(false); setForm(BLANK_FORM); }} style={{ fontFamily: FONTS.sans, fontSize: "0.82rem", color: COLORS.muted, padding: "8px 14px" }}>Cancel</button>
                <button onClick={addRestaurant} disabled={submitting || !form.name.trim()} style={{ fontFamily: FONTS.sans, fontWeight: 700, fontSize: "0.82rem", padding: "8px 18px", borderRadius: 999, background: COLORS.teal, color: "#fff", opacity: submitting ? 0.6 : 1 }}>
                  {submitting ? "Adding…" : "Add"}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ marginTop: 24, display: "flex", justifyContent: "center" }}>
              <button onClick={() => setShowForm(true)} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 22px", border: `2px dashed ${COLORS.coral}`, borderRadius: 999, color: COLORS.coral, fontFamily: FONTS.sans, fontWeight: 600, fontSize: "0.9rem", background: "transparent", transition: "background 0.2s ease" }} onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(244,132,95,0.08)")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                <Plus size={16} /> Add a Restaurant
              </button>
            </div>
          )}

          <p style={{ marginTop: 20, textAlign: "center", fontFamily: FONTS.sans, fontStyle: "italic", fontSize: "0.82rem", color: COLORS.muted }}>
            Verify phone numbers before booking — they change.
          </p>
        </div>
      </section>
    </>
  );
}

function DiningCard({ r, voteCount, myVoted, voters, onUpdate, onVote, onBook }) {
  const [showVoters, setShowVoters] = useState(false);
  const telHref = `tel:${(r.phone || "").replace(/[^+\d]/g, "")}`;
  const mapHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${r.name} Los Cabos`)}`;

  return (
    <article style={{ background: "#fff", borderRadius: 16, border: "1px solid rgba(38,70,83,0.08)", boxShadow: "0 8px 22px rgba(38,70,83,0.07)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ padding: "20px 22px 16px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <UtensilsCrossed size={18} color={COLORS.coral} style={{ flexShrink: 0 }} />
            <h3 style={{ fontFamily: FONTS.display, fontSize: "1.1rem", fontWeight: 700, color: COLORS.night, margin: 0, letterSpacing: "-0.01em", lineHeight: 1.2 }}>
              <EditField value={r.name} onChange={(v) => onUpdate({ name: v })} placeholder="Restaurant name" ariaLabel="Restaurant name" />
            </h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, flexShrink: 0 }}>
            <button onClick={onVote} aria-label={myVoted ? "Remove vote" : "Vote for this restaurant"} style={{ display: "flex", alignItems: "center", gap: 4, padding: "8px 12px", borderRadius: 999, background: myVoted ? "rgba(231,111,81,0.12)" : "rgba(38,70,83,0.05)", transition: "all 0.15s ease" }}>
              <Heart size={14} color={myVoted ? COLORS.terracotta : COLORS.muted} fill={myVoted ? COLORS.terracotta : "none"} />
              <span style={{ fontFamily: FONTS.mono, fontSize: "0.75rem", color: myVoted ? COLORS.terracotta : COLORS.muted, fontWeight: 600 }}>{voteCount}</span>
            </button>
            {voters.length > 0 && (
              <button onClick={() => setShowVoters((v) => !v)} style={{ fontFamily: FONTS.sans, fontSize: "0.75rem", color: COLORS.muted, textDecoration: "underline", textUnderlineOffset: 2 }}>
                {showVoters ? "hide" : "who?"}
              </button>
            )}
          </div>
        </div>
        <div style={{ fontFamily: FONTS.sans, fontSize: "0.82rem", color: COLORS.muted, marginLeft: 28 }}>
          <EditField value={r.cuisine} onChange={(v) => onUpdate({ cuisine: v })} placeholder="Cuisine type" ariaLabel="Cuisine" />
        </div>
        {r.area && (
          <div style={{ marginLeft: 28, marginTop: 3 }}>
            <span style={{ fontFamily: FONTS.sans, fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: COLORS.coral, background: "rgba(244,132,95,0.1)", padding: "2px 8px", borderRadius: 999 }}>
              {r.area}
            </span>
          </div>
        )}
        <span style={{ display: "block", fontFamily: FONTS.mono, fontSize: "0.85rem", color: COLORS.teal, fontWeight: 500, marginLeft: 28, marginTop: 4 }}>
          <EditField value={r.cost} onChange={(v) => onUpdate({ cost: v })} placeholder="$00–00/pp" ariaLabel="Cost" />
        </span>
        {showVoters && voters.length > 0 && (
          <div style={{ marginLeft: 28, marginTop: 8 }}>
            <VoterPills voters={voters} />
          </div>
        )}
      </div>

      <div style={{ padding: "14px 22px 18px", borderTop: "1px solid rgba(38,70,83,0.06)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 14px", fontFamily: FONTS.sans, fontSize: "0.85rem", color: COLORS.indigo, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Clock size={14} color={COLORS.teal} style={{ flexShrink: 0 }} />
          <EditField value={r.hours} onChange={(v) => onUpdate({ hours: v })} placeholder="Hours" ariaLabel="Hours" />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <MapPin size={14} color={COLORS.teal} style={{ flexShrink: 0 }} />
          <EditField value={r.distance} onChange={(v) => onUpdate({ distance: v })} placeholder="Distance" ariaLabel="Distance" />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span aria-hidden style={{ fontSize: "0.9rem" }}>✨</span>
          <EditField value={r.vibe} onChange={(v) => onUpdate({ vibe: v })} placeholder="Vibe" ariaLabel="Vibe" />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontStyle: "italic", color: COLORS.muted }}>
          <span aria-hidden style={{ fontSize: "0.9rem" }}>📋</span>
          <EditField value={r.book} onChange={(v) => onUpdate({ book: v })} placeholder="How to book" ariaLabel="How to book" />
        </div>
      </div>

      <div style={{ padding: "10px 22px 14px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <button
          onClick={onBook}
          aria-label={r.confirmed_by ? `Unmark booked` : "Mark this restaurant as booked"}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 999, background: r.confirmed_by ? "rgba(42,157,143,0.12)" : "rgba(38,70,83,0.05)", color: r.confirmed_by ? COLORS.teal : COLORS.muted, fontFamily: FONTS.sans, fontSize: "0.8rem", fontWeight: 600, transition: "all 0.15s ease" }}
        >
          {r.confirmed_by ? <CheckCircle2 size={14} /> : <Circle size={14} />}
          {r.confirmed_by ? `Booked by ${r.confirmed_by}` : "Mark as booked"}
        </button>
        {r.confirmed_at && r.confirmed_by && (
          <span style={{ fontFamily: FONTS.mono, fontSize: "0.72rem", color: COLORS.muted }}>
            {new Date(r.confirmed_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </span>
        )}
      </div>

      <div style={{ borderTop: "1px solid rgba(38,70,83,0.08)", display: "grid", gridTemplateColumns: "1fr 1px 1fr", alignItems: "stretch" }}>
        <a href={telHref} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px 12px", fontFamily: FONTS.sans, fontSize: "0.82rem", fontWeight: 600, color: COLORS.teal, transition: "background 0.2s ease" }} onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(42,157,143,0.08)")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
          <Phone size={14} />
          <EditField value={r.phone} onChange={(v) => onUpdate({ phone: v })} placeholder="+52 …" ariaLabel="Phone number" />
        </a>
        <span aria-hidden style={{ background: "rgba(38,70,83,0.08)" }} />
        <a href={mapHref} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px 12px", fontFamily: FONTS.sans, fontSize: "0.82rem", fontWeight: 600, color: COLORS.coral, transition: "background 0.2s ease" }} onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(244,132,95,0.09)")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
          <Navigation size={14} />
          Directions
        </a>
      </div>
    </article>
  );
}
