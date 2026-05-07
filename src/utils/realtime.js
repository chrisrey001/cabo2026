// Apply a Supabase Realtime postgres_changes payload to a useState setter.
//
// Handles INSERT / UPDATE / DELETE with id-based dedupe. For tables where
// the optimistic local row uses a temp id (e.g. `local-${Date.now()}`),
// pass a `keyFields` array — the helper will replace the local row with
// the real one when the composite key matches.

export function applyChange(setter, payload, opts = {}) {
  const { sort, keyFields } = opts;
  setter((prev) => {
    if (payload.eventType === "INSERT") {
      const incoming = payload.new;
      if (!incoming) return prev;

      // Real row already present (from another channel echo)? Skip.
      if (prev.some((r) => r.id === incoming.id)) return prev;

      // Optimistic local row with matching composite key? Replace it.
      if (keyFields && keyFields.length) {
        const matchIdx = prev.findIndex(
          (r) => String(r.id || "").startsWith("local-") &&
                 keyFields.every((k) => r[k] === incoming[k])
        );
        if (matchIdx !== -1) {
          const next = prev.slice();
          next[matchIdx] = incoming;
          return sort ? next.slice().sort(sort) : next;
        }
      }

      const next = [...prev, incoming];
      return sort ? next.sort(sort) : next;
    }

    if (payload.eventType === "UPDATE") {
      const incoming = payload.new;
      if (!incoming) return prev;
      const next = prev.map((r) => (r.id === incoming.id ? { ...r, ...incoming } : r));
      return sort ? next.slice().sort(sort) : next;
    }

    if (payload.eventType === "DELETE") {
      const removed = payload.old;
      if (!removed) return prev;
      // For optimistic local rows, the "old" here will have a real DB id —
      // any local-prefixed rows that don't have a real-id twin are left alone.
      return prev.filter((r) => r.id !== removed.id);
    }

    return prev;
  });
}

export const sortBySort = (a, b) => (a.sort ?? 0) - (b.sort ?? 0);
export const sortByCreatedAt = (a, b) =>
  new Date(a.created_at || 0) - new Date(b.created_at || 0);
