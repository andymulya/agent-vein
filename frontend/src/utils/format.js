/** US number formatting helpers (en-US locale throughout). */

export function fmt(n) {
  return Math.round(n).toLocaleString("en-US");
}

export function fmtBnb(n) {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 5,
  });
}
