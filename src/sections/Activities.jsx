import React, { useEffect, useState, useMemo } from "react";
import { CheckCircle2, ChevronDown, Circle, ExternalLink, Heart, Plus, Trash2 } from "lucide-react";
import { COLORS, FONTS, SPACING } from "../theme";
import { SectionHeader } from "./Cast";
import EditField from "../components/EditField";
import VoterModal from "../components/VoterModal";
import VoterPills from "../components/VoterPills";
import CommentThread from "../components/CommentThread";
import { supabase, hasSupabase } from "../supabase";
import { emitSave } from "../components/SaveBadge";
import { useVoterIdentity } from "../hooks/useVoterIdentity";
import { useTouchDevice } from "../hooks/useBreakpoint";
import { parseCostNum } from "../utils/cost";
import { applyChange, sortBySort, sortByCreatedAt } from "../utils/realtime";

const DEFAULT_ACTIVITIES = [
  // ── Existing highlights ───────────────────────────────────────────────────
  { title: "Flora Farms Dinner", icon: "🌿", cost: "$80–120/pp", duration: "Evening", distance: "~20 min drive", description: "Michelin-recommended farm-to-table on a 25-acre organic farm in San José del Cabo. Dine under string lights with produce pulled from the ground that morning. One of the hardest reservations in Los Cabos — book 4+ weeks ahead.", tag: "Culinary", sort: 0, link: "https://www.sevenrooms.com/reservations/florafarms" },
  { title: "Cabo Arch Boat Tour", icon: "⛵", cost: "$25–40/pp", duration: "1–2 hrs", distance: "30 min to Cabo Marina", description: "Cruise to Land's End to see El Arco where the Pacific meets the Sea of Cortez. Stop at Lover's Beach, spot sea lions at Pelican Rock, and catch the postcard shot. Morning light is best. Mandatory $5 port fee paid at marina.", tag: "Sightseeing", sort: 1, link: "https://www.viator.com/Los-Cabos-attractions/Arch-of-Cabo-San-Lucas/d627-a979" },
  { title: "San José Art Walk", icon: "🎨", cost: "FREE", duration: "5–9 PM", distance: "10 min to downtown", description: "Thursday evenings through June, 12 certified galleries open their doors in the colonial Art District. Street musicians, artists, blown glass, and textiles — traffic closed, wine flowing. June 18 is the final walk of the season.", tag: "Culture", sort: 2, link: "https://www.artcabo.com/san-jose-del-cabo-art-walk.html" },
  { title: "Deep-Sea Fishing Charter", icon: "🎣", cost: "~$230/pp (8-hr boat)", duration: "Full day", distance: "10 min to Puerto Los Cabos", description: "June is peak season for marlin and dorado in the nutrient-rich waters off Baja. Picante Fleet runs a 100% company-owned fleet from Puerto Los Cabos marina — 30+ years of reputation. Split the full-day charter across the group.", tag: "Sea", sort: 3, link: "https://picantesportfishing.com/" },
  { title: "ATV + Camel + Tequila", icon: "🐪", cost: "$175+/pp", duration: "Half day", distance: "~30 min drive", description: "Rip through the Baja desert on automatic ATVs, ride a camel along Migriño Beach, then cap it with mezcal and tequila tasting plus a Mexican buffet. Cabo Adventures runs this combo — park entry ($25) and ATV insurance ($35) paid on-site.", tag: "Adventure", sort: 4, link: "https://www.cabo-adventures.com/en/tour/camel-atv-ecofarm" },

  // ── Beaches ───────────────────────────────────────────────────────────────
  { title: "Chileno Bay Beach", icon: "🏖️", cost: "FREE", duration: "Full day", distance: "15 min drive", description: "Blue Flag certified beach and one of the safest swimming spots on the Sea of Cortez. Pristine snorkeling, calm turquoise waters, and a sea turtle nesting area. No vendors, no music — pure beach. Bring your own gear.", tag: "Beach", sort: 5 },
  { title: "Santa Maria Bay", icon: "🐠", cost: "FREE", duration: "Half day", distance: "18 min drive", description: "Protected marine sanctuary and one of Cabo's top snorkeling spots. Colorful tropical fish, rays, and sea turtles in the coral reef. Arrive early — waters are calmest in the morning. No facilities, so bring everything you need.", tag: "Beach", sort: 6 },
  { title: "Palmilla Beach", icon: "🌊", cost: "FREE", duration: "Full day", distance: "2 min walk", description: "A mile-long, family-friendly beach steps from the villa. Calm Sea of Cortez waters, gentle waves, perfect for swimming. One of the few reliably swimmable beaches in Los Cabos. Watch for the One&Only beach club access nearby.", tag: "Beach", sort: 7 },
  { title: "Bagatelle Beach Club", icon: "🍹", cost: "$50 min/pp", duration: "Full day", distance: "30 min drive", description: "Upscale Medano Beach club with lounge beds ($500), private cabanas ($1000), DJ music, and bottle service. High energy — reserve ahead. Best for a lively group beach day. $50/person minimum consumption applies.", tag: "Beach", sort: 8 },
  { title: "Sur Beach House", icon: "🏄", cost: "$80–100 min/pp", duration: "Full day", distance: "30 min drive", description: "Medano Beach's most social spot with jet ski rentals, kayaks, SUP boards, and snorkel gear. Open 8 AM – 8 PM. Great for an active beach day. Minimum consumption applies. Private jet ski lessons and guided snorkels available.", tag: "Beach", sort: 9 },
  { title: "El Ganzo Beach Club", icon: "🌅", cost: "$45–80/pp", duration: "Full day", distance: "12 min drive", description: "Chic boutique beach club in San Jose del Cabo with a rooftop pool, lush gardens, and rotating art installations. Quieter and more intimate than Medano. 9 AM – 6 PM. Rooftop bar has some of the best views in the area.", tag: "Beach", sort: 10 },
  { title: "Taboo Beach Club", icon: "🎶", cost: "Varies", duration: "Full day", distance: "30 min drive", description: "Upscale Cabo beach club with VIP lounge setup, resident DJ, and stunning Pacific-meeting-Cortez views near Land's End. For groups wanting a full club experience by the sea. Reserve tables well in advance.", tag: "Beach", sort: 11 },
  { title: "Cerritos Beach", icon: "🏄‍♂️", cost: "FREE", duration: "Full day", distance: "45 min drive", description: "World-renowned surf break near Todos Santos with a classic beach break perfect for beginners and intermediates. Cerritos Beach Club restaurant on-site. Best November–March. A fun road trip addition to a surf day.", tag: "Beach", sort: 12 },
  { title: "Casa Dorada Beach Club", icon: "☀️", cost: "Day pass", duration: "9 AM – 6 PM", distance: "30 min drive", description: "Medano Beach club at Hotel Casa Dorada with pool access, lounge chairs, and beachfront service. One of the calmer, more relaxed clubs on the busy beach strip. Good for a mellower full beach day.", tag: "Beach", sort: 13 },

  // ── Golf ─────────────────────────────────────────────────────────────────
  { title: "Cabo del Sol Desert Course", icon: "⛳", cost: "Call for rates", duration: "4–5 hrs", distance: "20 min drive", description: "Tom Weiskopf's masterpiece winding through dramatic desert arroyos with ocean views from every hole. Book after 9:30 AM — on-property guests get priority early slots. Closed Tuesdays. Desert Course only (Ocean Course / Cove Club is private members-only).", tag: "Golf", sort: 14 },
  { title: "Puerto Los Cabos Golf", icon: "⛳", cost: "Call for rates", duration: "4–5 hrs", distance: "10 min drive", description: "27-hole resort just minutes from the villa designed by two legends: Greg Norman and Jack Nicklaus. Part of the Questro portfolio. One of the most prestigious layouts in all of Mexico — arguably the strongest golf day available.", tag: "Golf", sort: 15 },
  { title: "Club Campestre", icon: "⛳", cost: "Call for rates", duration: "4–5 hrs", distance: "15 min drive", description: "Nicklaus Design course tucked into the Sierra de la Laguna mountain foothills above San Jose del Cabo. Rolling desert fairways and Sea of Cortez views. Challenging, scenic, and a step above resort courses.", tag: "Golf", sort: 16 },
  { title: "Cabo Real Golf Club", icon: "⛳", cost: "Call for rates", duration: "4–5 hrs", distance: "20 min drive", description: "Robert Trent Jones Jr. design at a 2,800-acre resort with 3.2 miles of beachfront. Multi-themed target-style course along the Corridor. Part of the Questro group alongside Puerto Los Cabos and Club Campestre.", tag: "Golf", sort: 17 },
  { title: "Solmar Golf at Rancho San Lucas", icon: "⛳", cost: "Call for rates", duration: "4–5 hrs", distance: "40 min drive", description: "Greg Norman's dramatic layout at the centerpiece of an 834-acre Pacific Ocean community. 15 minutes from downtown Cabo San Lucas. Newer course poised to become the region's next great venue — worth the drive.", tag: "Golf", sort: 18 },

  // ── Sea & Water ───────────────────────────────────────────────────────────
  { title: "Sail Baja Catamaran", icon: "⛵", cost: "Contact for rates", duration: "4 hrs", distance: "30 min to Cabo Marina", description: "The Zig Zag and Blue Lagoon are considered the finest luxury catamarans in Cabo. Tours are 100% customizable — whale watching, snorkeling, or cruising. Guacamole, charcuterie, sandwiches, premium open bar, paddleboards, and snorkel gear included. Max 18 guests.", tag: "Sea", sort: 19 },
  { title: "Private Yacht Charter", icon: "🛥️", cost: "Varies by vessel", duration: "Half or full day", distance: "30 min to Cabo Marina", description: "Cabo Sails and Calvo Cabo Yachts both offer private yachts from 33' to 116'. Bilingual crew, departures from Cabo San Lucas or San Jose del Cabo. Up to 20 guests. Children 12 and under sail free (up to 5 kids). Perfect for the full group.", tag: "Sea", sort: 20 },
  { title: "Whale Watching", icon: "🐋", cost: "$80–120/pp", duration: "2–2.5 hrs", distance: "30 min to Cabo Marina", description: "December 15 – April 15, humpbacks and gray whales fill the waters off Cabo. Cabo Adventures runs certified luxury tours with zodiac boats for up-close encounters. Minimum 5 years. Book early in whale season — fills fast.", tag: "Sea", sort: 21 },
  { title: "Swim with Whale Sharks", icon: "🦈", cost: "$180–220/pp", duration: "10–12 hrs", distance: "Day trip to La Paz", description: "October–April, the world's largest fish gather in La Paz Bay. Cabo Expeditions runs the full-day trip with a Todos Santos stop on the way back. Home by 8:30 PM. Minimum 8 years. A genuinely once-in-a-lifetime experience.", tag: "Sea", sort: 22 },
  { title: "Dolphin Experience", icon: "🐬", cost: "$90–180/pp", duration: "20 min – 4.5 hrs", distance: "30 min drive", description: "Cabo Adventures runs multiple dolphin programs: 20-min Family Encounter (ages 1+), 30-min Swim Experience, 1-hr Premium Swim, or the 4.5-hr Dolphin Trainer for a Day (ages 12+). All supervised by marine professionals.", tag: "Sea", sort: 23 },
  { title: "Scuba Diving", icon: "🤿", cost: "$65–150/pp", duration: "1.5–6 hrs", distance: "30 min to Cabo Marina", description: "Manta Scuba runs multiple certified dives daily (8 AM & 1 PM). Options include Land's End Local Reserve, 2-tank Corridor combos, and a Scuba Refresher course. Cabo Adventures offers PADI Open Water certification (3 days) and Pulmo reef diving (8 hrs).", tag: "Sea", sort: 24 },
  { title: "Sport Fishing – Cabo Marlini", icon: "🎣", cost: "$230+/pp", duration: "5–8 hrs", distance: "30 min to Cabo Marina", description: "Full day (8hr) or half day (5hr) all-inclusive with Cabo Marlini. Water, beer, soft drinks, box lunch (beef burritos or chicken sandwich), fishing license, and live bait all included. June is peak marlin and dorado season.", tag: "Sea", sort: 25 },
  { title: "Parasailing", icon: "🪂", cost: "$70–90/pp", duration: "1.5 hrs total", distance: "30 min to Cabo Marina", description: "Float 300+ feet above Medano Beach and Land's End with Cabo Expeditions. Views of the Arch and the entire bay. Easy and safe — no experience needed. Year-round availability. Ages 7+. A classic Cabo bucket-list item.", tag: "Sea", sort: 26 },
  { title: "Surf Lessons", icon: "🏄", cost: "$80–120/pp", duration: "3–7 hrs", distance: "20–45 min drive", description: "High Tide runs guided surf tours at Costa Azul (March 15 – November 15) and Cerritos Beach (November 15 – March 15). Round-trip transport, soft board, rash guard, bilingual instructors included. Beginners ride their first wave sooner than they think.", tag: "Sea", sort: 27 },
  { title: "Glass Bottom Kayak & Snorkel", icon: "🚣", cost: "$75–95/pp", duration: "3 hrs", distance: "30 min drive", description: "High Tide runs glass-bottom kayak tours at the Arch every day (9am & 2pm) and at Two Bays — Santa Maria & Chileno Bay — Monday, Wednesday, Thursday, and Saturday at 9am. See the sea lion colony up close. Ages 6+.", tag: "Sea", sort: 28 },

  // ── Land & Adventure ──────────────────────────────────────────────────────
  { title: "Wild Canyon Adventures", icon: "🌵", cost: "$60–150/pp", duration: "Half–full day", distance: "30 min drive", description: "600-hectare adventure park with ATV, UTV, zipline, camel rides, giant swing (300ft), bungee from a glass gondola, and an animal sanctuary with macaws, crocodiles, and iguanas. Mandatory park entrance fee. Ages 3+ for sanctuary, 8+ for most activities.", tag: "Adventure", sort: 29 },
  { title: "Cabo Adventures Land Tours", icon: "🐪", cost: "$100–175+/pp", duration: "3–5 hrs", distance: "~30 min drive", description: "22-acre eco-park with ATV canyon trails, camel rides across the Baja Desert, E-Bikes on Pacific beach, UTV routes, and zipline with commando bridge. Camel combos available with lunch included. Hotel transport, ages 8+. Park entry ($25) + ATV insurance ($35) extra.", tag: "Adventure", sort: 30 },
  { title: "Cactus Tours", icon: "🏜️", cost: "$80–150/pp", duration: "3–5 hrs", distance: "~30 min drive", description: "ATV tours at Migrino Beach & Dunes, CAN-AM X3 side-by-sides (0–100 km/h in 4.5 sec), horseback riding on Pacific beaches, mountain biking, and AWD e-bikes. Tequila museum and tasting included in every tour. Free Kids Club for ages 6 months–12 years.", tag: "Adventure", sort: 31 },
  { title: "Horseback Riding – Cuadra San Francisco", icon: "🐎", cost: "Contact for rates", duration: "1–2 hrs", distance: "20 min drive", description: "Family-owned ranch with an internationally acclaimed trainer. Venado Blanco Tour (1hr, Cabo Real beach, daily except Sundays) and Hill/Canyon Tour (2hr, Arroyo San Carlos, daily except Sundays). Up to 18 people. Ages 4+, 250 lb limit. No experience needed.", tag: "Adventure", sort: 32 },
  { title: "Baja Jeep & Fox Canyon Hike", icon: "🏔️", cost: "$120–180/pp", duration: "7 hrs", distance: "~1 hr from coast", description: "High Tide runs two epic options: drive a 4x4 Jeep to Santiago's ancient mission town and Fox Canyon oasis (up to 3 people), or a hiking version through the same canyon with freshwater pools, natural water slides, and a waterfall. Authentic Mexican lunch at a local restaurant included.", tag: "Adventure", sort: 33 },
  { title: "Juan More Taco Food Tours", icon: "🌮", cost: "$60–120/pp", duration: "1.5–4.5 hrs", distance: "15 min to downtown", description: "Multiple formats: 3hr Cabo Taco Tour, 3.5hr Tacos + Cocktails + Tequila Walking Tour, 4.5hr Cooking Class with local market tour (private, 6–10 guests), and a San Jose del Cabo Mezcal & Mixology tasting (1.5hr, 1–6 guests). Cooking + dance class option available.", tag: "Culinary", sort: 34 },
  { title: "Wide Open Tours – Baja Race Cars", icon: "🏁", cost: "Contact for rates", duration: "3–9 hrs", distance: "~20 min drive", description: "Put yourself behind the wheel of a Baja Challenge race car. Three formats: Taste of Cabo 45mi/3hr, Baja Challenge 80mi/5hr, Cabo Lunch Run 120mi/9hr to Todos Santos and back. Monday, Wednesday, and Friday only. Ages 16+ with valid license (16–17 requires guardian).", tag: "Adventure", sort: 35 },
];

const TAG_COLORS = {
  Culinary: COLORS.coral,
  Sightseeing: COLORS.teal,
  Culture: COLORS.terracotta,
  Adventure: COLORS.indigo,
  Beach: COLORS.gold,
  Sea: "#2196A8",
  Golf: "#4A8B57",
  Other: COLORS.muted,
};

const TAGS = ["Culinary", "Sightseeing", "Culture", "Adventure", "Beach", "Sea", "Golf", "Other"];

const CATEGORY_FILTERS = [
  { id: null, label: "All" },
  { id: "Beach", label: "Beaches" },
  { id: "Sea", label: "Sea & Water" },
  { id: "Adventure", label: "Land & Adventure" },
  { id: "Golf", label: "Golf" },
  { id: "Culinary", label: "Food & Culture" },
];

const SORTS = [
  { id: "votes", label: "Votes" },
  { id: "tag", label: "Type" },
  { id: "cost", label: "Cost" },
];

const BLANK_FORM = { icon: "✨", title: "", tag: "Adventure", cost: "", duration: "", distance: "", description: "", link: "" };

export default function Activities() {
  const { voterId, voterName, setVoterName, hasName } = useVoterIdentity();
  const [activities, setActivities] = useState([]);
  const [avotes, setAvotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null);
  const [sortKey, setSortKey] = useState("votes");
  const [catFilter, setCatFilter] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [pendingVote, setPendingVote] = useState(null);
  const [pendingBook, setPendingBook] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(BLANK_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [comments, setComments] = useState([]);
  const isTouch = useTouchDevice();
  const [confirmingDelete, setConfirmingDelete] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);

  useEffect(() => {
    if (!hasSupabase) {
      setActivities(DEFAULT_ACTIVITIES.map((a, i) => ({ ...a, id: `local-${i}`, added_by: null })));
      setLoading(false);
      return;
    }
    (async () => {
      const [{ data: aData, error: aErr }, { data: vData, error: vErr }, { data: cData, error: cErr }] = await Promise.all([
        supabase.from("activities").select("*").order("sort", { ascending: true }),
        supabase.from("activity_votes").select("*"),
        supabase.from("activity_comments").select("*").order("created_at", { ascending: true }),
      ]);
      if (aErr) console.error("[cabo2026] activities load failed:", aErr);
      if (vErr) console.error("[cabo2026] activity_votes load failed:", vErr);
      if (cErr) console.error("[cabo2026] activity_comments load failed:", cErr);

      let rows = aData || [];
      if (!rows.length) {
        const { data: seeded, error: seedErr } = await supabase.from("activities").insert(DEFAULT_ACTIVITIES).select();
        if (seedErr) console.error("[cabo2026] activities seed failed:", seedErr);
        rows = seeded || DEFAULT_ACTIVITIES.map((a, i) => ({ ...a, id: `local-${i}` }));
      }
      setActivities(rows);
      setAvotes(vData || []);
      setComments(cData || []);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!hasSupabase) return;
    const ch = supabase
      .channel("activities-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "activities" }, (p) =>
        applyChange(setActivities, p, { sort: sortBySort })
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "activity_votes" }, (p) =>
        applyChange(setAvotes, p, { keyFields: ["activity_id", "voter_id"] })
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "activity_comments" }, (p) =>
        applyChange(setComments, p, { sort: sortByCreatedAt, keyFields: ["activity_id", "author", "body"] })
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const persist = async (row) => {
    if (!hasSupabase || String(row.id).startsWith("local-")) return;
    emitSave("saving");
    const { error } = await supabase.from("activities").upsert(row);
    if (error) { console.error("[cabo2026] activities upsert failed:", error); emitSave("error"); }
    else emitSave("saved");
  };

  const updateOne = (id, patch) => {
    setActivities((prev) => {
      const next = prev.map((a) => (a.id === id ? { ...a, ...patch } : a));
      persist(next.find((a) => a.id === id));
      return next;
    });
  };

  const voteCount = (id) => avotes.filter((v) => v.activity_id === id).length;
  const myVoted = (id) => avotes.some((v) => v.activity_id === id && v.voter_id === voterId);

  const castVote = async (activityId, name) => {
    const already = myVoted(activityId);
    if (already) {
      setAvotes((prev) => prev.filter((v) => !(v.activity_id === activityId && v.voter_id === voterId)));
      if (!hasSupabase) return;
      await supabase.from("activity_votes").delete().match({ activity_id: activityId, voter_id: voterId });
    } else {
      const row = { activity_id: activityId, voter_id: voterId, voter_name: name || null };
      setAvotes((prev) => [...prev, { ...row, id: `local-${Date.now()}` }]);
      if (!hasSupabase) return;
      const { error } = await supabase.from("activity_votes").insert(row);
      if (error) {
        console.error("[cabo2026] activity_votes insert failed:", error);
        setAvotes((prev) => prev.filter((v) => !(v.activity_id === activityId && v.voter_id === voterId)));
      }
    }
  };

  const handleVoteClick = (id) => {
    if (!hasName && !myVoted(id)) { setPendingVote(id); setShowModal(true); }
    else castVote(id, voterName);
  };

  const toggleBooking = (id, name) => {
    const row = activities.find((a) => a.id === id);
    if (!row) return;
    updateOne(id, row.confirmed_by ? { confirmed_by: null, confirmed_at: null } : { confirmed_by: name || "Anonymous", confirmed_at: new Date().toISOString() });
  };

  const handleBookClick = (id) => {
    const row = activities.find((a) => a.id === id);
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

  const addActivity = async () => {
    if (!form.title.trim()) return;
    setSubmitting(true);
    const nextSort = activities.length ? Math.max(...activities.map((a) => a.sort ?? 0)) + 1 : 0;
    const draft = { ...form, sort: nextSort, added_by: voterName || null };

    if (!hasSupabase) {
      setActivities((prev) => [...prev, { ...draft, id: `local-${Date.now()}` }]);
    } else {
      emitSave("saving");
      const { data, error } = await supabase.from("activities").insert(draft).select().single();
      if (error) { console.error("[cabo2026] activity insert failed:", error); emitSave("error"); }
      else { setActivities((prev) => [...prev, data]); emitSave("saved"); }
    }
    setForm(BLANK_FORM); setShowForm(false); setSubmitting(false);
  };

  const deleteActivity = async (id) => {
    const prev = activities;
    setActivities((a) => a.filter((x) => x.id !== id));
    if (openId === id) setOpenId(null);
    setConfirmingDelete(null);
    if (!hasSupabase || String(id).startsWith("local-")) return;
    const { error } = await supabase.from("activities").delete().match({ id });
    if (error) { console.error("[cabo2026] activity delete failed:", error); setActivities(prev); }
  };

  const addComment = async (activityId, body) => {
    const author = voterName || null;
    const draft = { activity_id: activityId, author, body, created_at: new Date().toISOString() };
    const optimisticId = `local-${Date.now()}`;
    setComments((prev) => [...prev, { ...draft, id: optimisticId }]);
    if (!hasSupabase) return;
    const { data, error } = await supabase.from("activity_comments").insert({ activity_id: activityId, author, body }).select().single();
    if (error) {
      console.error("[cabo2026] activity_comments insert failed:", error);
      setComments((prev) => prev.filter((c) => c.id !== optimisticId));
    } else {
      setComments((prev) => prev.map((c) => (c.id === optimisticId ? data : c)));
    }
  };

  const sorted = useMemo(() => {
    let arr = [...activities];
    if (catFilter === "Culinary") {
      arr = arr.filter((a) => a.tag === "Culinary" || a.tag === "Culture");
    } else if (catFilter) {
      arr = arr.filter((a) => a.tag === catFilter);
    }
    if (sortKey === "votes") arr.sort((a, b) => voteCount(b.id) - voteCount(a.id));
    else if (sortKey === "tag") arr.sort((a, b) => (a.tag || "").localeCompare(b.tag || ""));
    else if (sortKey === "cost") arr.sort((a, b) => parseCostNum(a.cost) - parseCostNum(b.cost));
    return arr;
  }, [activities, avotes, sortKey, catFilter]);

  const chipBase = { fontFamily: FONTS.sans, fontSize: "0.82rem", padding: "7px 16px", borderRadius: 999, transition: "all 0.2s ease", cursor: "pointer" };

  return (
    <>
      {showModal && (
        <VoterModal onConfirm={handleModalConfirm} onDismiss={() => { setShowModal(false); setPendingVote(null); setPendingBook(null); }} />
      )}
      <section id="activities" style={{ background: COLORS.warmWhite, padding: SPACING.section }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <SectionHeader eyebrow="Experiences & Adventures" title="Experiences & Adventures" />

          {/* Category filter */}
          <div style={{ marginTop: 28, display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
            {CATEGORY_FILTERS.map((f) => {
              const active = catFilter === f.id;
              return (
                <button
                  key={String(f.id)}
                  onClick={() => setCatFilter(active ? null : f.id)}
                  style={{ ...chipBase, fontWeight: active ? 700 : 500, color: active ? "#fff" : COLORS.indigo, background: active ? COLORS.indigo : "rgba(38,70,83,0.06)" }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          {/* Sort row */}
          <div style={{ marginTop: 12, display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontFamily: FONTS.sans, fontSize: "0.78rem", color: COLORS.muted, alignSelf: "center", marginRight: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.14em" }}>Sort by</span>
            {SORTS.map((s) => {
              const active = sortKey === s.id;
              return (
                <button key={s.id} onClick={() => setSortKey(s.id)} style={{ ...chipBase, fontWeight: active ? 700 : 500, color: active ? "#fff" : COLORS.teal, background: active ? COLORS.teal : "rgba(42,157,143,0.06)" }}>
                  {s.label}
                </button>
              );
            })}
          </div>

          {catFilter && (
            <p style={{ textAlign: "center", fontFamily: FONTS.sans, fontSize: "0.8rem", color: COLORS.muted, marginTop: 8 }}>
              {sorted.length} experience{sorted.length !== 1 ? "s" : ""} · <button onClick={() => setCatFilter(null)} style={{ color: COLORS.teal, fontFamily: FONTS.sans, fontSize: "0.8rem", textDecoration: "underline" }}>Clear filter</button>
            </p>
          )}

          {loading ? (
            <div style={{ marginTop: 32, display: "grid", gap: 14 }}>
              {[0, 1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 80 }} />)}
            </div>
          ) : (
            <div style={{ marginTop: 24, display: "grid", gap: 14 }}>
              {sorted.map((a) => {
                const open = openId === a.id;
                const tagColor = TAG_COLORS[a.tag] || COLORS.teal;
                const vc = voteCount(a.id);
                const mv = myVoted(a.id);
                const voters = avotes.filter((v) => v.activity_id === a.id);
                const cc = comments.filter((c) => c.activity_id === a.id).length;

                return (
                  <div
                    key={a.id}
                    style={{ background: "#fff", borderRadius: 16, border: "1px solid rgba(38,70,83,0.08)", boxShadow: open ? "0 16px 40px rgba(38,70,83,0.12)" : "0 6px 18px rgba(38,70,83,0.05)", overflow: "hidden", transition: "box-shadow 0.25s ease" }}
                    onMouseEnter={() => setHoveredCard(a.id)}
                    onMouseLeave={() => { setHoveredCard(null); if (confirmingDelete === a.id) setConfirmingDelete(null); }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "20px 22px" }}>
                      <span style={{ fontSize: "1.8rem", lineHeight: 1, flexShrink: 0 }}>
                        <EditField value={a.icon} onChange={(v) => updateOne(a.id, { icon: v })} placeholder="✨" ariaLabel="Icon" style={{ fontSize: "1.8rem" }} />
                      </span>
                      <button onClick={() => setOpenId(open ? null : a.id)} aria-expanded={open} style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                        <div style={{ fontFamily: FONTS.display, fontSize: "1.2rem", fontWeight: 700, color: COLORS.night, letterSpacing: "-0.01em", marginBottom: 4 }}>
                          <EditField value={a.title} onChange={(v) => updateOne(a.id, { title: v })} placeholder="Experience title" ariaLabel="Title" />
                        </div>
                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", fontFamily: FONTS.sans, fontSize: "0.78rem", color: COLORS.muted }}>
                          <span style={{ fontFamily: FONTS.mono, color: COLORS.teal, fontWeight: 500 }}>
                            <EditField value={a.cost} onChange={(v) => updateOne(a.id, { cost: v })} placeholder="Cost" ariaLabel="Cost" />
                          </span>
                          <span aria-hidden>·</span>
                          <EditField value={a.duration} onChange={(v) => updateOne(a.id, { duration: v })} placeholder="Duration" ariaLabel="Duration" />
                          <span aria-hidden>·</span>
                          <span style={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.16em", fontSize: "0.68rem", color: tagColor }}>
                            <EditField value={a.tag} onChange={(v) => updateOne(a.id, { tag: v })} placeholder="Tag" ariaLabel="Tag" />
                          </span>
                          {!open && cc > 0 && (
                            <><span aria-hidden>·</span><span style={{ fontFamily: FONTS.sans, fontSize: "0.72rem", color: COLORS.muted }}>💬 {cc}</span></>
                          )}
                          {!open && a.confirmed_by && (
                            <><span aria-hidden>·</span><span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: FONTS.sans, fontSize: "0.72rem", color: COLORS.teal, fontWeight: 600 }}><CheckCircle2 size={12} /> Booked by {a.confirmed_by}</span></>
                          )}
                        </div>
                      </button>

                      {/* Vote button */}
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, flexShrink: 0 }}>
                        <button onClick={() => handleVoteClick(a.id)} aria-label={mv ? "Remove vote" : "Vote"} style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 10px", borderRadius: 999, background: mv ? "rgba(231,111,81,0.12)" : "rgba(38,70,83,0.05)", transition: "all 0.15s ease" }}>
                          <Heart size={14} color={mv ? COLORS.terracotta : COLORS.muted} fill={mv ? COLORS.terracotta : "none"} />
                          <span style={{ fontFamily: FONTS.mono, fontSize: "0.75rem", color: mv ? COLORS.terracotta : COLORS.muted, fontWeight: 600 }}>{vc}</span>
                        </button>
                      </div>

                      {/* Delete */}
                      {confirmingDelete === a.id ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                          <span style={{ fontFamily: FONTS.sans, fontSize: "0.75rem", color: COLORS.muted, whiteSpace: "nowrap" }}>Delete?</span>
                          <button onClick={() => deleteActivity(a.id)} style={{ fontFamily: FONTS.sans, fontSize: "0.75rem", fontWeight: 700, color: "#fff", background: COLORS.terracotta, padding: "4px 10px", borderRadius: 999 }}>Yes</button>
                          <button onClick={() => setConfirmingDelete(null)} style={{ fontFamily: FONTS.sans, fontSize: "0.75rem", color: COLORS.muted, padding: "4px 8px" }}>Cancel</button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); setConfirmingDelete(a.id); }}
                          aria-label="Delete activity"
                          style={{ flexShrink: 0, opacity: (isTouch || hoveredCard === a.id) ? 1 : 0, transition: "opacity 0.15s ease", padding: 8, borderRadius: 6, lineHeight: 0, minWidth: 32, minHeight: 32, display: "flex", alignItems: "center", justifyContent: "center" }}
                        >
                          <Trash2 size={15} color={COLORS.muted} />
                        </button>
                      )}
                      <ChevronDown size={20} color={COLORS.muted} onClick={() => setOpenId(open ? null : a.id)} style={{ transition: "transform 0.25s ease", transform: open ? "rotate(180deg)" : "rotate(0deg)", flexShrink: 0, cursor: "pointer" }} />
                    </div>

                    {open && (
                      <div className="fade-up" style={{ padding: "0 22px 22px 62px", color: COLORS.indigo, fontFamily: FONTS.sans, fontSize: "0.95rem", lineHeight: 1.6 }}>
                        <EditField value={a.description} onChange={(v) => updateOne(a.id, { description: v })} placeholder="Description…" ariaLabel="Description" multiline />
                        <div style={{ fontSize: "0.82rem", color: COLORS.muted, fontWeight: 600, marginTop: 10 }}>
                          📍 <EditField value={a.distance} onChange={(v) => updateOne(a.id, { distance: v })} placeholder="Distance" ariaLabel="Distance" />
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
                          <span style={{ fontSize: "0.82rem", color: COLORS.muted, fontWeight: 600, flexShrink: 0 }}>🔗</span>
                          <EditField value={a.link || ""} onChange={(v) => updateOne(a.id, { link: v })} placeholder="Add booking URL…" ariaLabel="Booking link" />
                          {a.link && (
                            <a href={a.link} target="_blank" rel="noreferrer" style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 5, fontFamily: FONTS.sans, fontSize: "0.78rem", fontWeight: 700, color: "#fff", background: COLORS.teal, padding: "5px 12px", borderRadius: 999 }}>
                              <ExternalLink size={11} /> Book
                            </a>
                          )}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
                          <button
                            onClick={() => handleBookClick(a.id)}
                            aria-label={a.confirmed_by ? `Unmark booked` : "Mark as booked"}
                            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 999, background: a.confirmed_by ? "rgba(42,157,143,0.12)" : "rgba(38,70,83,0.05)", color: a.confirmed_by ? COLORS.teal : COLORS.muted, fontFamily: FONTS.sans, fontSize: "0.8rem", fontWeight: 600 }}
                          >
                            {a.confirmed_by ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                            {a.confirmed_by ? `Booked by ${a.confirmed_by}` : "Mark as booked"}
                          </button>
                          {a.confirmed_at && a.confirmed_by && (
                            <span style={{ fontFamily: FONTS.mono, fontSize: "0.72rem", color: COLORS.muted }}>
                              {new Date(a.confirmed_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                            </span>
                          )}
                        </div>
                        {voters.length > 0 && <div style={{ marginTop: 12 }}><VoterPills voters={voters} /></div>}
                        <CommentThread
                          comments={comments.filter((c) => c.activity_id === a.id)}
                          onAdd={(body) => addComment(a.id, body)}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {showForm ? (
            <div style={{ marginTop: 20, background: "#fff", borderRadius: 16, border: "1px solid rgba(38,70,83,0.1)", padding: "22px 24px" }}>
              <p style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: "1rem", color: COLORS.night, margin: "0 0 14px" }}>Add an experience</p>
              <div style={{ display: "grid", gridTemplateColumns: "60px 1fr", gap: 10, marginBottom: 10 }}>
                <input type="text" placeholder="Icon" value={form.icon} onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))} style={{ ...formInputStyle, textAlign: "center", fontSize: "1.4rem" }} />
                <input type="text" placeholder="Title *" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} style={formInputStyle} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <select value={form.tag} onChange={(e) => setForm((f) => ({ ...f, tag: e.target.value }))} style={formInputStyle}>
                  {TAGS.map((t) => <option key={t}>{t}</option>)}
                </select>
                <input type="text" placeholder="Cost (e.g. $50/pp or FREE)" value={form.cost} onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))} style={formInputStyle} />
                <input type="text" placeholder="Duration" value={form.duration} onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))} style={formInputStyle} />
                <input type="text" placeholder="Distance / location" value={form.distance} onChange={(e) => setForm((f) => ({ ...f, distance: e.target.value }))} style={formInputStyle} />
              </div>
              <textarea placeholder="Description…" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} style={{ ...formInputStyle, width: "100%", marginTop: 10, resize: "vertical", boxSizing: "border-box" }} />
              <input type="url" placeholder="Booking URL (optional)" value={form.link} onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))} style={{ ...formInputStyle, width: "100%", marginTop: 10, boxSizing: "border-box" }} />
              <div style={{ display: "flex", gap: 8, marginTop: 14, justifyContent: "flex-end" }}>
                <button onClick={() => { setShowForm(false); setForm(BLANK_FORM); }} style={{ fontFamily: FONTS.sans, fontSize: "0.82rem", color: COLORS.muted, padding: "8px 14px" }}>Cancel</button>
                <button onClick={addActivity} disabled={submitting || !form.title.trim()} style={{ fontFamily: FONTS.sans, fontWeight: 700, fontSize: "0.82rem", padding: "8px 18px", borderRadius: 999, background: COLORS.teal, color: "#fff", opacity: submitting ? 0.6 : 1 }}>
                  {submitting ? "Adding…" : "Add"}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ marginTop: 20, display: "flex", justifyContent: "center" }}>
              <button onClick={() => setShowForm(true)} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 22px", border: `2px dashed ${COLORS.teal}`, borderRadius: 999, color: COLORS.teal, fontFamily: FONTS.sans, fontWeight: 600, fontSize: "0.9rem", background: "transparent", transition: "background 0.2s ease" }} onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(42,157,143,0.08)")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                <Plus size={16} /> Add Activity
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

const formInputStyle = {
  fontFamily: FONTS.sans,
  fontSize: "0.88rem",
  padding: "9px 12px",
  borderRadius: 8,
  border: "1.5px solid rgba(38,70,83,0.15)",
  outline: "none",
  color: "#1A1F3A",
};
