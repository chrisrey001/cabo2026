export function parseCostNum(cost) {
  if (!cost) return 0;
  if (cost.toUpperCase().includes("FREE")) return 0;
  const m = cost.match(/\d+/);
  return m ? parseInt(m[0], 10) : 0;
}
