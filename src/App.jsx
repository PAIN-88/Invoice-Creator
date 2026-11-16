import { useState } from "react";
import { calc, inr, words, isValidGstin } from "./gst.js";

const party = (name, address, gstin, state, code) => ({ name, address, gstin, state, code });
const SAMPLE = {
  seller: party("Tiwari Automobiles(26-27)", "Jawaharchak Nausar\nGorakhpur, U.P.\n273016", "09BOJPT0716A1Z4", "Uttar Pradesh", "09"),
  buyer: party("Shine Groups Engineering Service", "Sahjanwa, Gorakhpur", "09EHBPS5841H1ZZ", "Uttar Pradesh", "09"),
  no: "94", date: "2026-08-16", terms: "", remarks: "Being Goods Sold",
  items: [
    { desc: 'Coach Fan 9" 24V', hsn: "8414", gst: 18, qty: 7, unit: "Pc", rate: 467.1 },
    { desc: "S/M Signa Big BS6", hsn: "7009", gst: 18, qty: 15, unit: "Pc", rate: 67.8 },
    { desc: "S/M Signa Small", hsn: "7009", gst: 18, qty: 10, unit: "Pc", rate: 63 },
    { desc: "S/M TV Cantor", hsn: "7009", gst: 18, qty: 10, unit: "Pc", rate: 50 },
  ],
};
const BLANK_ITEM = { desc: "", hsn: "", gst: 18, qty: 1, unit: "Pc", rate: "" };
const EMPTY = {
  seller: party("", "", "", "Uttar Pradesh", "09"), buyer: party("", "", "", "Uttar Pradesh", "09"),
  no: "1", date: new Date().toISOString().slice(0, 10), terms: "", remarks: "Being Goods Sold", items: [{ ...BLANK_ITEM }],
};
const fmtDate = (d) => (d ? d.split("-").reverse().join("-") : "");

function PartyForm({ title, p, onChange }) {
  const f = (k, label, area) => (
    <label>{label}
      {area ? <textarea rows={3} value={p[k]} onChange={(e) => onChange(k, e.target.value)} />
            : <input value={p[k]} onChange={(e) => onChange(k, e.target.value)} />}
    </label>
  );
  const g = p.gstin;
  const sameCode = (x, y) => x.replace(/^0+/, "") === y.trim().replace(/^0+/, ""); // "9" and "09" are the same
  let note = null;
  if (g.length > 0 && g.length < 15) note = <span className="hint">{g.length}/15 characters</span>;
  else if (g.length === 15) {
    if (!isValidGstin(g)) note = <span className="bad">Check this GSTIN: the format or check digit is wrong.</span>;
    else if (!sameCode(g.slice(0, 2), p.code)) note = <span className="bad">GSTIN starts with {g.slice(0, 2)} but the state code is {p.code || "empty"}.</span>;
    else note = <span className="ok">GSTIN format is valid.</span>;
  }
  return (
    <fieldset><legend>{title}</legend>
      {f("name", "Name")}{f("address", "Address", true)}
      <label>GSTIN
        <input maxLength={15} value={p.gstin} onChange={(e) => onChange("gstin", e.target.value.replace(/\s/g, "").toUpperCase())} aria-invalid={note?.props.className === "bad"} />
        {note}
      </label>
      <div className="row">{f("state", "State")}{f("code", "State code")}</div>
    </fieldset>
  );
}

export default function App() {
  const [inv, setInv] = useState(EMPTY);
  const set = (k, v) => setInv((s) => ({ ...s, [k]: v }));
  const setParty = (who) => (k, v) => setInv((s) => ({ ...s, [who]: { ...s[who], [k]: v } }));
  const setItem = (i, k, v) => set("items", inv.items.map((it, j) => (j === i ? { ...it, [k]: v } : it)));

  const norm = (c) => c.trim().replace(/^0+/, "");
  const inter = norm(inv.seller.code) !== norm(inv.buyer.code);
  const t = calc(inv.items, inter);
  const qty = inv.items.reduce((s, i) => s + (+i.qty || 0), 0);

  return (
    <div className="app">
      <aside className="editor no-print">
        <div className="head">
          <h1>Live GST invoice</h1>
          <p className="muted">Nothing is saved. Refreshing or closing this page erases everything.</p>
          <div className="row">
            <button className="primary" onClick={() => window.print()}>Print or save as PDF</button>
            <button className="ghost" onClick={() => setInv(EMPTY)}>Clear all</button>
            <button className="ghost" onClick={() => setInv(SAMPLE)}>Load sample</button>
          </div>
        </div>

        <PartyForm title="Seller (you)" p={inv.seller} onChange={setParty("seller")} />
        <PartyForm title="Buyer (bill to)" p={inv.buyer} onChange={setParty("buyer")} />

        <fieldset><legend>Invoice</legend>
          <div className="row">
            <label>Invoice no.<input value={inv.no} onChange={(e) => set("no", e.target.value)} /></label>
            <label>Date<input type="date" value={inv.date} onChange={(e) => set("date", e.target.value)} /></label>
          </div>
          <label>Payment terms<input value={inv.terms} onChange={(e) => set("terms", e.target.value)} /></label>
          <label>Remarks<input value={inv.remarks} onChange={(e) => set("remarks", e.target.value)} /></label>
        </fieldset>

        <fieldset><legend>Items</legend>
          {inv.items.map((it, i) => (
            <div className="item" key={i}>
              <label>Description<input value={it.desc} onChange={(e) => setItem(i, "desc", e.target.value)} /></label>
              <div className="row">
                <label>HSN<input value={it.hsn} onChange={(e) => setItem(i, "hsn", e.target.value)} /></label>
                <label>GST %<select value={it.gst} onChange={(e) => setItem(i, "gst", +e.target.value)}>{[0, 5, 12, 18, 28].map((r) => <option key={r}>{r}</option>)}</select></label>
                <label>Qty<input type="number" min="0" step="any" value={it.qty} onChange={(e) => setItem(i, "qty", e.target.value)} /></label>
                <label>Unit<input value={it.unit} onChange={(e) => setItem(i, "unit", e.target.value)} /></label>
                <label>Rate<input type="number" min="0" step="any" value={it.rate} onChange={(e) => setItem(i, "rate", e.target.value)} /></label>
                <button className="ghost x" aria-label={`Remove item ${i + 1}`} disabled={inv.items.length === 1}
                  onClick={() => set("items", inv.items.filter((_, j) => j !== i))}>×</button>
              </div>
            </div>
          ))}
          <button className="link" onClick={() => set("items", [...inv.items, { ...BLANK_ITEM }])}>Add item</button>
        </fieldset>
      </aside>

      <main className="preview">
        <article className="sheet">
          <h2>Tax Invoice</h2>
          <div className="grid2">
            <div>
              <b>{inv.seller.name || "Your business name"}</b>
              <pre>{inv.seller.address}</pre>
              <div>GSTIN/UIN: {inv.seller.gstin}</div>
              <div>State Name : {inv.seller.state}, Code : {inv.seller.code}</div>
              <hr /><div className="muted">Buyer (Bill to)</div>
              <b>{inv.buyer.name || "Buyer name"}</b>
              <pre>{inv.buyer.address}</pre>
              <div>GSTIN/UIN : {inv.buyer.gstin}</div>
              <div>State Name : {inv.buyer.state}, Code : {inv.buyer.code}</div>
            </div>
            <div>
              <div>Invoice No.: <b>{inv.no}</b></div>
              <div>Dated: <b>{fmtDate(inv.date)}</b></div>
              {inv.terms && <div>Terms of Payment: {inv.terms}</div>}
              <div className="muted small">{inter ? "Different states: IGST" : "Same state: CGST + SGST"}</div>
            </div>
          </div>

          <table>
            <thead><tr><th>Sl</th><th>Description of Goods</th><th>HSN/SAC</th><th>GST</th><th className="num">Quantity</th><th className="num">Rate</th><th className="num">Amount</th></tr></thead>
            <tbody>
              {t.lines.map((l, i) => (
                <tr key={i}><td>{i + 1}</td><td>{l.desc}</td><td>{l.hsn}</td><td>{l.gst}%</td>
                  <td className="num">{(+l.qty || 0).toFixed(2)} {l.unit}</td><td className="num">{(+l.rate || 0).toFixed(2)}</td><td className="num">{inr(l.amount)}</td></tr>
              ))}
              <tr className="sum"><td colSpan="6" className="num">Taxable value</td><td className="num">{inr(t.sub)}</td></tr>
              {inter
                ? <tr className="sum"><td colSpan="6" className="num">IGST</td><td className="num">{inr(t.igst)}</td></tr>
                : <><tr className="sum"><td colSpan="6" className="num">CGST</td><td className="num">{inr(t.cgst)}</td></tr>
                    <tr className="sum"><td colSpan="6" className="num">SGST</td><td className="num">{inr(t.sgst)}</td></tr></>}
              <tr className="sum"><td colSpan="6" className="num">Round off</td><td className="num">{inr(t.round)}</td></tr>
              <tr className="total"><td colSpan="4">Total</td><td className="num">{qty.toFixed(2)} Pc</td><td /><td className="num">₹ {inr(t.total)}</td></tr>
            </tbody>
          </table>
          <p>Amount chargeable (in words): <b>{words(t.total)}</b></p>

          <table>
            <thead><tr><th>Taxable value</th><th>Rate</th><th className="num">{inter ? "IGST" : "CGST"}</th>{!inter && <th className="num">SGST/UTGST</th>}<th className="num">Total tax</th></tr></thead>
            <tbody>{t.summary.map((r) => (
              <tr key={r.rate}><td>{inr(r.taxable)}</td><td>{inter ? r.rate : r.rate / 2}%</td>
                <td className="num">{inr(inter ? r.tax : r.half)}</td>{!inter && <td className="num">{inr(r.half)}</td>}<td className="num">{inr(r.tax)}</td></tr>))}
              <tr className="total"><td>Total: {inr(t.sub)}</td><td /><td className="num">{inr(inter ? t.igst : t.cgst)}</td>{!inter && <td className="num">{inr(t.sgst)}</td>}<td className="num">{inr(t.tax)}</td></tr>
            </tbody>
          </table>
          <p>Tax amount (in words): <b>{words(t.tax)}</b></p>
          {inv.remarks && <p>Remarks: {inv.remarks}</p>}
          <div className="grid2 foot">
            <p className="muted small">Declaration: We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.</p>
            <div className="sign">for {inv.seller.name}<br /><br /><br />Authorised Signatory</div>
          </div>
          <p className="center muted small">This is a Computer Generated Invoice</p>
        </article>
      </main>
    </div>
  );
}