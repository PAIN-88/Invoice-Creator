// All money is handled in paise (integers) so there are no floating-point errors.
export const inr = (p) => (p / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function calc(items, interstate) {
  const lines = items.map((i) => ({ ...i, amount: Math.round((+i.qty || 0) * (+i.rate || 0) * 100) }));
  const byRate = {};
  let sub = 0;
  lines.forEach((l) => { sub += l.amount; byRate[l.gst] = (byRate[l.gst] || 0) + l.amount; });
  let cgst = 0, sgst = 0, igst = 0;
  const summary = Object.entries(byRate).sort((a, b) => a[0] - b[0]).map(([r, taxable]) => {
    const rate = +r, tax = Math.round((taxable * rate) / 100), half = Math.round((taxable * rate) / 200);
    if (interstate) igst += tax; else { cgst += half; sgst += half; }
    return { rate, taxable, tax, half };
  });
  const grand = sub + cgst + sgst + igst;
  const total = Math.round(grand / 100) * 100;
  return { lines, sub, cgst, sgst, igst, tax: cgst + sgst + igst, round: total - grand, total, summary };
}

const ONES = "Zero One Two Three Four Five Six Seven Eight Nine Ten Eleven Twelve Thirteen Fourteen Fifteen Sixteen Seventeen Eighteen Nineteen".split(" ");
const TENS = "_ _ Twenty Thirty Forty Fifty Sixty Seventy Eighty Ninety".split(" ");
const below1000 = (n) => {
  const p = [];
  if (n >= 100) { p.push(ONES[Math.floor(n / 100)] + " Hundred"); n %= 100; }
  if (n >= 20) p.push(TENS[Math.floor(n / 10)] + (n % 10 ? " " + ONES[n % 10] : ""));
  else if (n > 0) p.push(ONES[n]);
  return p.join(" ");
};
const w = (n) => {
  if (!n) return "Zero";
  const out = [];
  for (const [d, name] of [[1e7, "Crore"], [1e5, "Lakh"], [1e3, "Thousand"]]) {
    if (n >= d) { out.push(below1000(Math.floor(n / d)) + " " + name); n %= d; }
  }
  if (n) out.push(below1000(n));
  return out.join(" ");
};
export const words = (paise) => {
  const r = Math.floor(paise / 100), ps = paise % 100;
  return "INR " + w(r) + (ps ? " and " + w(ps) + " Paise" : "") + " Only";
};

// GSTIN format + checksum check (works offline; does not prove the business exists)
const CH = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
export function isValidGstin(g) {
  g = (g || "").trim().toUpperCase();
  if (!/^(0[1-9]|[1-2][0-9]|3[0-9])[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(g)) return false;
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const p = CH.indexOf(g[i]) * (i % 2 === 0 ? 1 : 2);
    sum += Math.floor(p / 36) + (p % 36);
  }
  return CH[(36 - (sum % 36)) % 36] === g[14];
}