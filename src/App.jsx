import { useState, useEffect, useCallback } from "react";
import {
  LayoutDashboard, PlusCircle, List, BarChart3,
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  Radio, Trash2, X, Check, ChevronUp, ChevronDown,
  Target, Zap, Shield, Activity, RefreshCw, Search,
  AlertTriangle, Award, Clock, Edit3
} from "lucide-react";

// ─── Seed Data ────────────────────────────────────────────────────────────────
const initialTrades = [
  { id: "TRD-001", symbol: "RELIANCE", exchange: "NSE", direction: "Long", setup: "Breakout", entryPrice: 2850.00, exitPrice: 2980.00, stopLoss: 2800.00, target: 2990.00, quantity: 100, marginRequired: null, pnl: 13000, status: "Closed", date: "2026-05-01", rMultiple: 2.6, mistake: "None", notes: "Clean breakout above 200 DMA with volume surge.", tranches: [] },
  { id: "TRD-002", symbol: "TCS", exchange: "NSE", direction: "Long", setup: "Pullback", entryPrice: 3900.00, exitPrice: 3985.00, stopLoss: 3860.00, target: 4020.00, quantity: 50, marginRequired: null, pnl: 4250, status: "Closed", date: "2026-05-03", rMultiple: 1.5, mistake: "None", notes: "Textbook pullback to 20 EMA in uptrend.", tranches: [] },
  { id: "TRD-003", symbol: "INFY", exchange: "NSE", direction: "Long", setup: "Trend Continuation", entryPrice: 1620.00, exitPrice: 1580.00, stopLoss: 1590.00, target: 1700.00, quantity: 150, marginRequired: null, pnl: -6000, status: "Closed", date: "2026-05-07", rMultiple: -2.0, mistake: "Entry too late", notes: "Stop hit. News event reversed trend.", tranches: [] },
  { id: "TRD-004", symbol: "BAJFINANCE", exchange: "NSE", direction: "Short", setup: "Resistance Rejection", entryPrice: 7200.00, exitPrice: 7050.00, stopLoss: 7280.00, target: 7000.00, quantity: 30, marginRequired: null, pnl: 4500, status: "Closed", date: "2026-05-10", rMultiple: 1.9, mistake: "None", notes: "Double top rejection at key resistance.", tranches: [] },
  { id: "TRD-006", symbol: "ZOMATO", exchange: "NSE", direction: "Long", setup: "Momentum", entryPrice: 195.50, exitPrice: null, stopLoss: 188.00, target: 215.00, quantity: 1000, marginRequired: null, pnl: 0, status: "Open", date: "2026-05-17", rMultiple: 0, mistake: "None", notes: "Momentum play after strong Q4 results.", tranches: [] },
  { id: "TRD-007", symbol: "HDFCBANK", exchange: "BSE", direction: "Short", setup: "Resistance Rejection", entryPrice: 1520.00, exitPrice: null, stopLoss: 1545.00, target: 1475.00, quantity: 200, marginRequired: null, pnl: 0, status: "Open", date: "2026-05-18", rMultiple: 0, mistake: "None", notes: "Supply zone + bearish engulfing candle.", tranches: [] },
];

const SETUPS = ["Breakout", "Pullback", "Momentum", "Trend Continuation", "Resistance Rejection", "Gap Fill", "Mean Reversion", "Reversal"];
const MISTAKES = ["None", "Entry too early", "Entry too late", "Oversized position", "Moved stop to breakeven early", "Chased entry", "Ignored market context", "FOMO", "Revenge trade"];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => n?.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtPnl = (n) => n >= 0 ? `+₹${fmt(n)}` : `-₹${fmt(Math.abs(n))}`;

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color = "emerald", ping = false, icon: Icon }) {
  const colorMap = {
    emerald: { val: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", ping: "bg-emerald-400" },
    blue: { val: "text-sky-400", bg: "bg-sky-500/10 border-sky-500/20", ping: "bg-sky-400" },
    rose: { val: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20", ping: "bg-rose-400" },
    amber: { val: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", ping: "bg-amber-400" },
    violet: { val: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20", ping: "bg-violet-400" },
  };
  const c = colorMap[color];
  return (
    <div className={`relative bg-slate-900 rounded-2xl border border-slate-800 p-5 overflow-hidden group hover:border-slate-700 transition-all duration-300`}>
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl ${c.bg}`} style={{ filter: "blur(20px)" }} />
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{label}</p>
          {Icon && <Icon className={`h-4 w-4 ${c.val} opacity-60`} />}
        </div>
        <p className={`text-2xl font-bold tracking-tight ${c.val}`}>{value}</p>
        {sub && <p className="text-xs text-slate-500 mt-1.5">{sub}</p>}
        {ping && <span className={`absolute top-4 right-4 h-2 w-2 rounded-full ${c.ping} animate-ping`} />}
      </div>
    </div>
  );
}

function Badge({ children, variant = "default" }) {
  const styles = {
    default: "bg-slate-800 text-slate-300 border-slate-700",
    long: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    short: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    open: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    closed: "bg-slate-800/80 text-slate-500 border-slate-700",
    win: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    loss: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    mistake: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  };
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${styles[variant]}`}>
      {children}
    </span>
  );
}

// ─── LTP Engine: Multi-proxy cascade ─────────────────────────────────────────
// NSE's quote-equity endpoint requires cookies + User-Agent (server-side only).
// We cascade through 3 public CORS proxies each wrapping Yahoo Finance.
// If all 3 fail, the manual override is used. Source shown per-symbol in UI.

const WORKER_URL = "https://little-dawn-4310.losser997.workers.dev/";

async function fetchLTPCascade(symbolList) {
  const map = {};
  for (const s of symbolList) {
    try {
      const nseUrl = `https://www.nseindia.com/api/quote-equity?symbol=${encodeURIComponent(s.raw)}`;
      const res = await fetch(`${WORKER_URL}?url=${encodeURIComponent(nseUrl)}`, {
        signal: AbortSignal.timeout(6000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const ltp = data?.priceInfo?.lastPrice;
      const change = data?.priceInfo?.change;
      const changePct = data?.priceInfo?.pChange;
      const high = data?.priceInfo?.intraDayHighLow?.max;
      const low = data?.priceInfo?.intraDayHighLow?.min;
      if (!ltp) throw new Error("No price");
      map[s.raw] = { price: ltp, change, changePct, source: "NSE", high, low };
    } catch (e) {
      // skip this symbol
    }
  }
  if (Object.keys(map).length === 0) return { map: {}, source: null, error: "All proxies failed" };
  return { map, source: "NSE", error: null };
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [trades, setTrades] = useState(() => {
    try { const s = localStorage.getItem("alphajournal_v4"); return s ? JSON.parse(s) : initialTrades; }
    catch { return initialTrades; }
  });
  const [ltpMap, setLtpMap] = useState({});       // { SYMBOL: { price, change, changePct, source, high, low } }
  const [manualLtp, setManualLtp] = useState({});  // { SYMBOL: number } — user overrides
  const [fetching, setFetching] = useState(false);
  const [ltpSource, setLtpSource] = useState(null);  // which proxy succeeded last
  const [ltpError, setLtpError] = useState(false);
  const [showLtpPanel, setShowLtpPanel] = useState(false); // manual override panel
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterDir, setFilterDir] = useState("All");
  const [sortField, setSortField] = useState("date");
  const [sortDir, setSortDir] = useState("desc");
  const [deleteId, setDeleteId] = useState(null);
  const [editingTrade, setEditingTrade] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);
  const [formError, setFormError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [duplicateModal, setDuplicateModal] = useState(null); // { existingTrade, newTradeData }

  const blankForm = {
    symbol: "", exchange: "NSE", direction: "Long", setup: "Breakout",
    entryPrice: "", exitPrice: "", stopLoss: "", target: "",
    quantity: "", marginRequired: "", status: "Open",
    date: new Date().toISOString().split("T")[0],
    mistake: "None", notes: "",
  };
  const [form, setForm] = useState(blankForm);

  // ── Persist ────────────────────────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem("alphajournal_v4", JSON.stringify(trades));
  }, [trades]);

  // ── Live LTP (cascade engine) ─────────────────────────────────────────────
  const fetchLTP = useCallback(async () => {
    const open = trades.filter((t) => t.status === "Open");
    if (!open.length) return;
    const symbolList = [...new Map(open.map((t) => [t.symbol, { raw: t.symbol, yahoo: `${t.symbol}${t.exchange === "BSE" ? ".BO" : ".NS"}` }])).values()];
    setFetching(true); setLtpError(false);
    const { map, source, error } = await fetchLTPCascade(symbolList);
    if (error) {
      setLtpError(true);
      setLtpSource(null);
    } else {
      setLtpMap((prev) => ({ ...prev, ...map }));
      setLtpSource(source);
    }
    setFetching(false);
  }, [trades]);

  useEffect(() => {
    fetchLTP();
    const id = setInterval(fetchLTP, 20000);
    return () => clearInterval(id);
  }, [fetchLTP]);

  // Resolve effective LTP for a symbol (manual override > API > entryPrice)
  const getLtp = (symbol, entryPrice) => {
    if (manualLtp[symbol] != null) return { price: manualLtp[symbol], source: "Manual" };
    if (ltpMap[symbol]) return { price: ltpMap[symbol].price, source: ltpMap[symbol].source };
    return { price: entryPrice, source: "Entry" };
  };

  // ── Analytics ──────────────────────────────────────────────────────────────
  const closed = trades.filter((t) => t.status === "Closed");
  const open = trades.filter((t) => t.status === "Open");
  const wins = closed.filter((t) => t.pnl > 0);
  const losses = closed.filter((t) => t.pnl <= 0);
  const winRate = closed.length ? ((wins.length / closed.length) * 100).toFixed(1) : 0;
  const realizedPnl = closed.reduce((s, t) => s + t.pnl, 0);
  const avgWin = wins.length ? wins.reduce((s, t) => s + t.pnl, 0) / wins.length : 0;
  const avgLoss = losses.length ? losses.reduce((s, t) => s + t.pnl, 0) / losses.length : 0;
  const profitFactor = avgLoss !== 0 ? Math.abs(avgWin / avgLoss).toFixed(2) : "∞";
  const unrealizedPnl = open.reduce((s, t) => {
    const { price } = getLtp(t.symbol, t.entryPrice);
    return s + (t.direction === "Long" ? (price - t.entryPrice) : (t.entryPrice - price)) * t.quantity;
  }, 0);
  const totalPnl = realizedPnl + unrealizedPnl;
  const avgRMultiple = closed.length ? (closed.reduce((s, t) => s + parseFloat(t.rMultiple || 0), 0) / closed.length).toFixed(2) : 0;

  // ── Filtered / sorted trades ───────────────────────────────────────────────
  const filteredTrades = trades
    .filter((t) => {
      if (search && !t.symbol.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterStatus !== "All" && t.status !== filterStatus) return false;
      if (filterDir !== "All" && t.direction !== filterDir) return false;
      return true;
    })
    .sort((a, b) => {
      let aVal = a[sortField], bVal = b[sortField];
      if (sortField === "date") { aVal = new Date(a.date); bVal = new Date(b.date); }
      if (sortField === "pnl") { aVal = a.pnl; bVal = b.pnl; }
      return sortDir === "desc" ? (bVal > aVal ? 1 : -1) : (aVal > bVal ? 1 : -1);
    });

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSort = (field) => {
    if (sortField === field) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else { setSortField(field); setSortDir("desc"); }
  };

  const buildTradeObject = (formData, id, existingTranches) => {
    const entry = parseFloat(formData.entryPrice);
    const exit = formData.exitPrice ? parseFloat(formData.exitPrice) : null;
    const sl = formData.stopLoss ? parseFloat(formData.stopLoss) : null;
    const qty = parseInt(formData.quantity);
    const margin = formData.marginRequired ? parseFloat(formData.marginRequired) : null;
    const calcPnl = formData.status === "Closed" && exit != null
      ? (formData.direction === "Long" ? (exit - entry) : (entry - exit)) * qty : 0;
    const risk = sl ? Math.abs(entry - sl) * qty : 2000;
    const rMul = formData.status === "Closed" && exit != null ? (calcPnl / risk).toFixed(1) : 0;
    // ROI: if margin provided (MTF), ROI = pnl / margin; else ROI = pnl / (entry * qty)
    const roiBase = margin ? margin : entry * qty;
    const roi = formData.status === "Closed" && exit != null && roiBase > 0
      ? ((calcPnl / roiBase) * 100).toFixed(2) : null;
    // First tranche = this entry itself
    const tranche = { price: entry, qty, date: formData.date, margin };
    return {
      id: id || `TRD-${Date.now().toString().slice(-5)}`,
      symbol: formData.symbol.toUpperCase().trim(),
      exchange: formData.exchange, direction: formData.direction, setup: formData.setup,
      entryPrice: entry, exitPrice: exit, stopLoss: sl, target: formData.target ? parseFloat(formData.target) : null,
      quantity: qty, marginRequired: margin, pnl: calcPnl, roi, status: formData.status,
      date: formData.date, rMultiple: parseFloat(rMul), mistake: formData.mistake, notes: formData.notes,
      tranches: existingTranches ? [...existingTranches, tranche] : [tranche],
    };
  };

  const commitTrade = (trade) => {
    if (editingTrade) {
      setTrades((prev) => prev.map((t) => (t.id === trade.id ? trade : t)));
      setEditingTrade(null);
    } else {
      setTrades((prev) => [trade, ...prev]);
    }
    setForm(blankForm);
    setShowSuccess(true);
    setTimeout(() => { setShowSuccess(false); setTab("log"); }, 1200);
  };

  const handleSubmit = () => {
    setFormError("");
    if (!form.symbol.trim()) return setFormError("Symbol is required.");
    if (!form.entryPrice || isNaN(form.entryPrice)) return setFormError("Valid entry price is required.");
    if (!form.quantity || isNaN(form.quantity)) return setFormError("Valid quantity is required.");
    if (form.status === "Closed" && (!form.exitPrice || isNaN(form.exitPrice))) return setFormError("Exit price is required for closed trades.");

    const newTrade = buildTradeObject(form, editingTrade?.id);

    // Check for existing open trade with same symbol (only for new trades, not edits)
    if (!editingTrade) {
      const existing = trades.find(
        (t) => t.status === "Open" && t.symbol === newTrade.symbol && t.direction === newTrade.direction
      );
      if (existing) {
        setDuplicateModal({ existingTrade: existing, newTradeData: newTrade });
        return;
      }
    }

    commitTrade(newTrade);
  };

  const handleAddToExisting = () => {
    const { existingTrade, newTradeData } = duplicateModal;
    const totalQty = existingTrade.quantity + newTradeData.quantity;
    const avgEntry = ((existingTrade.entryPrice * existingTrade.quantity) + (newTradeData.entryPrice * newTradeData.quantity)) / totalQty;
    const newSl = newTradeData.stopLoss || existingTrade.stopLoss;
    const newTarget = newTradeData.target || existingTrade.target;
    const risk = newSl ? Math.abs(avgEntry - newSl) * totalQty : 2000;
    // Aggregate margin: sum existing + new (if both provided), else null
    const existingMargin = existingTrade.marginRequired;
    const newMargin = newTradeData.marginRequired;
    const aggregatedMargin = (existingMargin != null && newMargin != null)
      ? existingMargin + newMargin
      : (existingMargin != null ? existingMargin + (newMargin || 0) : (newMargin != null ? newMargin : null));
    // Build new tranche entry
    const newTranche = { price: newTradeData.entryPrice, qty: newTradeData.quantity, date: newTradeData.date, margin: newMargin };
    const updatedTranches = [...(existingTrade.tranches || [{ price: existingTrade.entryPrice, qty: existingTrade.quantity, date: existingTrade.date, margin: existingMargin }]), newTranche];
    // Recalc ROI if closed
    const calcPnl = existingTrade.status === "Closed" && existingTrade.exitPrice
      ? (existingTrade.direction === "Long" ? existingTrade.exitPrice - avgEntry : avgEntry - existingTrade.exitPrice) * totalQty
      : existingTrade.pnl;
    const roiBase = aggregatedMargin ? aggregatedMargin : avgEntry * totalQty;
    const roi = existingTrade.status === "Closed" && existingTrade.exitPrice && roiBase > 0
      ? ((calcPnl / roiBase) * 100).toFixed(2) : existingTrade.roi;
    const updatedTrade = {
      ...existingTrade,
      entryPrice: parseFloat(avgEntry.toFixed(2)),
      quantity: totalQty,
      stopLoss: newSl,
      target: newTarget,
      marginRequired: aggregatedMargin,
      roi,
      tranches: updatedTranches,
      notes: existingTrade.notes
        ? `${existingTrade.notes}\n[Tranche @ ₹${newTradeData.entryPrice} × ${newTradeData.quantity} on ${newTradeData.date}${newMargin ? ` · Margin ₹${fmt(newMargin)}` : ""}]`
        : `[Tranche @ ₹${newTradeData.entryPrice} × ${newTradeData.quantity} on ${newTradeData.date}${newMargin ? ` · Margin ₹${fmt(newMargin)}` : ""}]`,
    };
    setTrades((prev) => prev.map((t) => (t.id === existingTrade.id ? updatedTrade : t)));
    setDuplicateModal(null);
    setForm(blankForm);
    setShowSuccess(true);
    setTimeout(() => { setShowSuccess(false); setTab("log"); }, 1200);
  };

  const handleSeparateTrade = () => {
    commitTrade(duplicateModal.newTradeData);
    setDuplicateModal(null);
  };

  const handleDelete = (id) => { setTrades((prev) => prev.filter((t) => t.id !== id)); setDeleteId(null); };

  const startEdit = (trade) => {
    setEditingTrade(trade);
    setForm({
      symbol: trade.symbol, exchange: trade.exchange, direction: trade.direction,
      setup: trade.setup, entryPrice: trade.entryPrice, exitPrice: trade.exitPrice || "",
      stopLoss: trade.stopLoss || "", target: trade.target || "",
      quantity: trade.quantity, marginRequired: trade.marginRequired || "", status: trade.status, date: trade.date,
      mistake: trade.mistake, notes: trade.notes || "",
    });
    setTab("add-trade");
  };

  // ── Equity Curve (simple) ──────────────────────────────────────────────────
  const equityCurve = closed.slice().sort((a, b) => new Date(a.date) - new Date(b.date));
  let running = 0;
  const equityPoints = equityCurve.map((t) => { running += t.pnl; return running; });
  const maxEq = Math.max(...equityPoints, 1);
  const minEq = Math.min(...equityPoints, 0);
  const eqRange = maxEq - minEq || 1;
  const eqH = 80;
  const eqW = equityPoints.length > 1 ? equityPoints.length : 2;
  const polyline = equityPoints.map((v, i) => {
    const x = (i / (eqW - 1)) * 340;
    const y = eqH - ((v - minEq) / eqRange) * eqH;
    return `${x},${y}`;
  }).join(" ");

  // ── Setup Performance ──────────────────────────────────────────────────────
  const setupStats = SETUPS.map((s) => {
    const st = closed.filter((t) => t.setup === s);
    const wn = st.filter((t) => t.pnl > 0);
    return { setup: s, count: st.length, wr: st.length ? ((wn.length / st.length) * 100).toFixed(0) : null, pnl: st.reduce((sum, t) => sum + t.pnl, 0) };
  }).filter((s) => s.count > 0).sort((a, b) => b.pnl - a.pnl);

  // ── Render ─────────────────────────────────────────────────────────────────
  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ChevronUp className="h-3 w-3 text-slate-600" />;
    return sortDir === "desc" ? <ChevronDown className="h-3 w-3 text-emerald-400" /> : <ChevronUp className="h-3 w-3 text-emerald-400" />;
  };

  return (
    <div className="flex h-screen bg-[#080c12] text-slate-100 overflow-hidden" style={{ fontFamily: "'DM Sans', 'Sora', system-ui, sans-serif" }}>

      {/* ── Sidebar ── */}
      <aside className="w-60 bg-[#0d1117] border-r border-slate-800/60 flex flex-col py-6 px-4 gap-8 z-10 shrink-0">
        <div className="flex items-center gap-2.5 px-2">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <TrendingUp className="h-4 w-4 text-slate-950" />
          </div>
          <div>
            <p className="font-bold text-sm tracking-tight text-slate-100">AlphaJournal</p>
            <p className="text-[10px] text-slate-500 font-medium">Swing Trader</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1">
          {[
            { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
            { id: "add-trade", label: editingTrade ? "Edit Trade" : "Add Trade", icon: PlusCircle },
            { id: "log", label: "Trade Log", icon: List },
            { id: "analytics", label: "Analytics", icon: BarChart3 },
          ].map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => { setTab(id); if (id !== "add-trade") { setEditingTrade(null); setForm(blankForm); } }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${tab === id ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm" : "text-slate-500 hover:text-slate-200 hover:bg-slate-800/50"}`}>
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        {/* Mini Stats */}
        <div className="mt-auto space-y-2">
          <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-800/60">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Total P&L</p>
            <p className={`text-base font-bold ${totalPnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{fmtPnl(totalPnl)}</p>
          </div>
          <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-800/60 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-0.5">Live Sync</p>
              <p className={`text-xs font-semibold ${ltpError ? "text-rose-400" : fetching ? "text-amber-400" : "text-emerald-400"}`}>
                {ltpError ? "All proxies failed" : fetching ? "Fetching…" : ltpSource ? ltpSource : "Ready"}
              </p>
            </div>
            <div className="flex gap-1">
              <button onClick={() => setShowLtpPanel((v) => !v)} title="Manual LTP Override" className={`p-1.5 rounded-lg hover:bg-slate-700 transition-colors ${showLtpPanel ? "text-amber-400" : "text-slate-400 hover:text-slate-200"}`}>
                <Edit3 className="h-3.5 w-3.5" />
              </button>
              <button onClick={fetchLTP} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors">
                <RefreshCw className={`h-3.5 w-3.5 ${fetching ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Manual LTP Override Panel */}
          {showLtpPanel && (
            <div className="bg-slate-800/40 rounded-xl p-3 border border-amber-500/20 space-y-2">
              <p className="text-[10px] uppercase tracking-widest text-amber-400 font-semibold mb-2">Manual Override</p>
              {open.length === 0 ? (
                <p className="text-[10px] text-slate-600">No open positions</p>
              ) : open.map((t) => (
                <div key={t.id} className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 w-16 truncate font-mono">{t.symbol}</span>
                  <input
                    type="number"
                    step="any"
                    placeholder={`₹${t.entryPrice}`}
                    value={manualLtp[t.symbol] ?? ""}
                    onChange={(e) => setManualLtp((prev) => ({ ...prev, [t.symbol]: e.target.value ? parseFloat(e.target.value) : undefined }))}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-[10px] text-slate-100 focus:outline-none focus:border-amber-500 w-0"
                  />
                  {manualLtp[t.symbol] != null && (
                    <button onClick={() => setManualLtp((prev) => { const n = {...prev}; delete n[t.symbol]; return n; })} className="text-slate-500 hover:text-rose-400">
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
              <p className="text-[10px] text-slate-600 pt-1">Type a price to override. API resumes when cleared.</p>
            </div>
          )}
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 overflow-y-auto p-8 space-y-6">

        {/* ════════════════ DASHBOARD ════════════════ */}
        {tab === "dashboard" && (
          <div className="space-y-7 animate-in fade-in duration-300">
            <div className="flex items-end justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Performance Overview</h1>
                <p className="text-sm text-slate-500 mt-0.5">Your swing trading command centre · live via Yahoo Finance</p>
              </div>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${ltpError ? "bg-rose-500/10 border-rose-500/20 text-rose-400" : fetching ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"}`}>
                <Radio className={`h-3.5 w-3.5 ${fetching ? "animate-spin" : "animate-pulse"}`} />
                {ltpError ? "All Proxies Failed — Use Manual Override" : fetching ? "Fetching via cascade…" : ltpSource ? `Live · ${ltpSource}` : "Awaiting fetch"}
              </div>
            </div>

            {/* API failure banner */}
            {ltpError && (
              <div className="flex items-start gap-3 bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 text-sm">
                <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-rose-400">All LTP proxies failed</p>
                  <p className="text-slate-400 text-xs mt-0.5">The 3 CORS proxies (AllOrigins → corsproxy.io → ThingProxy) all returned errors. This usually means the proxies are rate-limited or down. Your P&L is showing entry price as LTP. <button onClick={() => setShowLtpPanel(true)} className="text-amber-400 hover:underline">Use Manual Override ↗</button> in the sidebar to enter current prices manually.</p>
                </div>
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Net P&L" value={fmtPnl(totalPnl)} sub={`Realized ${fmtPnl(realizedPnl)}`} color={totalPnl >= 0 ? "emerald" : "rose"} icon={totalPnl >= 0 ? TrendingUp : TrendingDown} />
              <StatCard label="Unrealized P&L" value={fmtPnl(unrealizedPnl)} sub={`${open.length} open position${open.length !== 1 ? "s" : ""}`} color="blue" icon={Activity} ping />
              <StatCard label="Win Rate" value={`${winRate}%`} sub={`${wins.length}W / ${losses.length}L from ${closed.length} trades`} color="violet" icon={Target} />
              <StatCard label="Profit Factor" value={profitFactor} sub={`Avg R: ${avgRMultiple}R per trade`} color="amber" icon={Shield} />
            </div>

            {/* Equity Curve + Open Positions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Equity Curve */}
              <div className="lg:col-span-2 bg-[#0d1117] rounded-2xl border border-slate-800/60 p-5">
                <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-4">Equity Curve · Closed Trades</p>
                {equityPoints.length > 1 ? (
                  <svg viewBox={`0 0 340 ${eqH}`} className="w-full" preserveAspectRatio="none" style={{ height: 120 }}>
                    <defs>
                      <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={running >= 0 ? "#34d399" : "#f43f5e"} stopOpacity="0.3" />
                        <stop offset="100%" stopColor={running >= 0 ? "#34d399" : "#f43f5e"} stopOpacity="0.02" />
                      </linearGradient>
                    </defs>
                    <polyline points={polyline} fill="none" stroke={running >= 0 ? "#34d399" : "#f43f5e"} strokeWidth="1.5" strokeLinejoin="round" />
                    <polygon points={`0,${eqH} ${polyline} ${340},${eqH}`} fill="url(#eqGrad)" />
                  </svg>
                ) : (
                  <div className="flex items-center justify-center h-28 text-slate-600 text-sm">Add closed trades to see your equity curve</div>
                )}
                <div className="flex justify-between text-[10px] text-slate-600 mt-2">
                  <span>{equityCurve[0]?.date || ""}</span>
                  <span>{equityCurve[equityCurve.length - 1]?.date || ""}</span>
                </div>
              </div>

              {/* Open Positions */}
              <div className="bg-[#0d1117] rounded-2xl border border-slate-800/60 p-5">
                <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-4">Open Positions</p>
                {open.length === 0 ? (
                  <div className="flex items-center justify-center h-28 text-slate-600 text-sm">No open positions</div>
                ) : (
                  <div className="space-y-3">
                    {open.map((t) => {
                      const { price: ltp, source } = getLtp(t.symbol, t.entryPrice);
                      const upnl = (t.direction === "Long" ? ltp - t.entryPrice : t.entryPrice - ltp) * t.quantity;
                      const pct = (((ltp - t.entryPrice) / t.entryPrice) * 100 * (t.direction === "Long" ? 1 : -1)).toFixed(2);
                      const isManual = source === "Manual";
                      const isEntry = source === "Entry";
                      return (
                        <div key={t.id} className="flex items-center justify-between p-3 bg-slate-800/40 rounded-xl border border-slate-800/60">
                          <div>
                            <p className="font-bold text-sm text-slate-200">{t.symbol}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <p className="text-[10px] text-slate-500">{t.direction} · {t.quantity} qty</p>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${isManual ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : isEntry ? "bg-slate-700/50 text-slate-500 border-slate-700" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"}`}>
                                {isManual ? "MANUAL" : isEntry ? "NO DATA" : source}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-sky-300">₹{fmt(ltp)}</p>
                            <p className={`text-[10px] font-bold ${upnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{fmtPnl(upnl)} ({pct}%)</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Recent Trades */}
            <div className="bg-[#0d1117] rounded-2xl border border-slate-800/60 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-800/60 flex items-center justify-between">
                <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold">Recent Activity</p>
                <button onClick={() => setTab("log")} className="text-xs text-emerald-400 hover:underline">View all →</button>
              </div>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-slate-800/40">
                  {trades.slice(0, 5).map((t) => {
                    const { price: ltp } = getLtp(t.symbol, t.entryPrice);
                    const displayPnl = t.status === "Open"
                      ? (t.direction === "Long" ? ltp - t.entryPrice : t.entryPrice - ltp) * t.quantity
                      : t.pnl;
                    return (
                      <tr key={t.id} className="hover:bg-slate-800/20 transition-colors">
                        <td className="px-5 py-3 text-slate-500 text-xs whitespace-nowrap">{t.date}</td>
                        <td className="px-5 py-3 font-bold text-slate-200 whitespace-nowrap">{t.symbol} <span className="text-[9px] text-slate-600 border border-slate-700 rounded px-1 ml-1">{t.exchange}</span></td>
                        <td className="px-5 py-3 whitespace-nowrap"><Badge variant={t.direction.toLowerCase()}>{t.direction}</Badge></td>
                        <td className="px-5 py-3 text-xs text-slate-400 whitespace-nowrap">{t.setup}</td>
                        <td className="px-5 py-3 whitespace-nowrap"><Badge variant={t.status.toLowerCase()}>{t.status}</Badge></td>
                        <td className={`px-5 py-3 font-semibold text-right whitespace-nowrap ${displayPnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{fmtPnl(displayPnl)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ════════════════ ADD / EDIT TRADE ════════════════ */}
        {tab === "add-trade" && (
          <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{editingTrade ? "Edit Trade" : "Log New Trade"}</h1>
              <p className="text-sm text-slate-500 mt-0.5">{editingTrade ? `Editing ${editingTrade.id}` : "Record a new setup in your system ledger"}</p>
            </div>

            {showSuccess && (
              <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-emerald-400 font-semibold text-sm">
                <Check className="h-5 w-5" /> Trade saved successfully!
              </div>
            )}

            {formError && (
              <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 text-rose-400 text-sm">
                <AlertTriangle className="h-4 w-4 shrink-0" /> {formError}
              </div>
            )}

            <div className="bg-[#0d1117] rounded-2xl border border-slate-800/60 p-6 space-y-5">
              {/* Row 1 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Symbol *</label>
                  <input type="text" value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })} placeholder="e.g. RELIANCE" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Exchange</label>
                  <select value={form.exchange} onChange={(e) => setForm({ ...form, exchange: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors">
                    <option>NSE</option><option>BSE</option>
                  </select>
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Direction</label>
                  <div className="flex rounded-xl overflow-hidden border border-slate-700">
                    {["Long", "Short"].map((d) => (
                      <button key={d} onClick={() => setForm({ ...form, direction: d })} className={`flex-1 py-2.5 text-sm font-semibold transition-all ${form.direction === d ? (d === "Long" ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400") : "bg-slate-900 text-slate-500 hover:bg-slate-800"}`}>
                        {d === "Long" ? <ArrowUpRight className="inline h-3.5 w-3.5 mr-1" /> : <ArrowDownRight className="inline h-3.5 w-3.5 mr-1" />}{d}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Status</label>
                  <div className="flex rounded-xl overflow-hidden border border-slate-700">
                    {["Open", "Closed"].map((s) => (
                      <button key={s} onClick={() => setForm({ ...form, status: s })} className={`flex-1 py-2.5 text-sm font-semibold transition-all ${form.status === s ? "bg-sky-500/20 text-sky-400" : "bg-slate-900 text-slate-500 hover:bg-slate-800"}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Row 3 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Entry Price *</label>
                  <input type="number" step="any" value={form.entryPrice} onChange={(e) => setForm({ ...form, entryPrice: e.target.value })} placeholder="₹0.00" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Exit Price {form.status === "Closed" && "*"}</label>
                  <input type="number" step="any" value={form.exitPrice} onChange={(e) => setForm({ ...form, exitPrice: e.target.value })} placeholder="₹0.00" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Stop Loss</label>
                  <input type="number" step="any" value={form.stopLoss} onChange={(e) => setForm({ ...form, stopLoss: e.target.value })} placeholder="₹0.00" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Target</label>
                  <input type="number" step="any" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} placeholder="₹0.00" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors" />
                </div>
              </div>

              {/* Row 4 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Quantity *</label>
                  <input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} placeholder="100" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Date</label>
                  <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors" />
                </div>
              </div>

              {/* MTF Margin Row */}
              <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-5 w-5 rounded-md bg-violet-500/20 flex items-center justify-center">
                    <Zap className="h-3 w-3 text-violet-400" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-violet-400">MTF / Margin Trade</span>
                  <span className="text-[10px] text-slate-500 ml-1">— leave blank for full-capital trade</span>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Margin Required (Capital Deployed) ₹</label>
                  <input
                    type="number"
                    step="any"
                    value={form.marginRequired}
                    onChange={(e) => setForm({ ...form, marginRequired: e.target.value })}
                    placeholder={form.entryPrice && form.quantity ? `Full value: ₹${fmt(parseFloat(form.entryPrice || 0) * parseInt(form.quantity || 0))}` : "e.g. 50000"}
                    className="w-full bg-slate-900 border border-violet-500/30 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-500 transition-colors"
                  />
                  {form.marginRequired && form.entryPrice && form.quantity && (
                    <p className="text-[10px] text-violet-400 mt-1.5">
                      Leverage: {(parseFloat(form.entryPrice) * parseInt(form.quantity) / parseFloat(form.marginRequired)).toFixed(1)}× · Full position value: ₹{fmt(parseFloat(form.entryPrice) * parseInt(form.quantity))}
                    </p>
                  )}
                </div>
              </div>

              {/* Row 5 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Setup</label>
                  <select value={form.setup} onChange={(e) => setForm({ ...form, setup: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors">
                    {SETUPS.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Mistake Tag</label>
                  <select value={form.mistake} onChange={(e) => setForm({ ...form, mistake: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors">
                    {MISTAKES.map((m) => <option key={m}>{m}</option>)}
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Notes / Thesis</label>
                <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Why did you take this trade? What was the thesis?" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors resize-none" />
              </div>

              {/* Live P&L Preview */}
              {form.entryPrice && form.exitPrice && form.quantity && form.status === "Closed" && (
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/60">
                  {(() => {
                    const ep = parseFloat(form.entryPrice), xp = parseFloat(form.exitPrice), q = parseInt(form.quantity);
                    const margin = form.marginRequired ? parseFloat(form.marginRequired) : null;
                    const pnl = (form.direction === "Long" ? xp - ep : ep - xp) * q;
                    const roiBase = margin ? margin : ep * q;
                    const roi = ((pnl / roiBase) * 100).toFixed(2);
                    return (
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Calculated P&L</span>
                          <p className={`font-bold text-lg ${pnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{fmtPnl(pnl)}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">ROI {margin ? "(on Margin)" : "(on Capital)"}</span>
                          <p className={`font-bold text-lg ${parseFloat(roi) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{roi}%</p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button onClick={handleSubmit} className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 rounded-xl transition-colors shadow-lg shadow-emerald-500/10 text-sm">
                  {editingTrade ? "Save Changes" : "Log Trade"}
                </button>
                {editingTrade && (
                  <button onClick={() => { setEditingTrade(null); setForm(blankForm); setTab("log"); }} className="px-5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-3 rounded-xl transition-colors text-sm border border-slate-700">
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════ LOG ════════════════ */}
        {tab === "log" && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div className="flex items-end justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Trade Log</h1>
                <p className="text-sm text-slate-500 mt-0.5">{filteredTrades.length} of {trades.length} trades · live pricing for open positions</p>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 bg-[#0d1117] border border-slate-800 rounded-xl px-3 py-2 text-sm">
                <Search className="h-3.5 w-3.5 text-slate-500" />
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search symbol…" className="bg-transparent text-slate-100 placeholder-slate-600 outline-none w-32 text-sm" />
              </div>
              <div className="flex rounded-xl overflow-hidden border border-slate-800 text-xs font-semibold">
                {["All", "Open", "Closed"].map((f) => (
                  <button key={f} onClick={() => setFilterStatus(f)} className={`px-3 py-2 transition-all ${filterStatus === f ? "bg-emerald-500/10 text-emerald-400" : "bg-[#0d1117] text-slate-500 hover:bg-slate-800"}`}>{f}</button>
                ))}
              </div>
              <div className="flex rounded-xl overflow-hidden border border-slate-800 text-xs font-semibold">
                {["All", "Long", "Short"].map((f) => (
                  <button key={f} onClick={() => setFilterDir(f)} className={`px-3 py-2 transition-all ${filterDir === f ? "bg-emerald-500/10 text-emerald-400" : "bg-[#0d1117] text-slate-500 hover:bg-slate-800"}`}>{f}</button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="bg-[#0d1117] rounded-2xl border border-slate-800/60 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800/60 bg-slate-950/30 text-[10px] uppercase tracking-widest text-slate-600">
                      {[["date", "Date"], ["symbol", "Symbol"], [null, "Direction"], [null, "Setup"], ["entryPrice", "Entry"], [null, "LTP / Exit"], ["pnl", "P&L"], [null, "R"], [null, ""]].map(([field, label]) => (
                        <th key={label} className="px-4 py-3 text-left font-semibold">
                          {field ? (
                            <button onClick={() => handleSort(field)} className="flex items-center gap-1 hover:text-slate-300 transition-colors">
                              {label} <SortIcon field={field} />
                            </button>
                          ) : label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {filteredTrades.map((t) => {
                      const isOpen = t.status === "Open";
                      const { price: ltp, source: ltpSrc } = getLtp(t.symbol, t.entryPrice);
                      const displayPnl = isOpen ? (t.direction === "Long" ? ltp - t.entryPrice : t.entryPrice - ltp) * t.quantity : t.pnl;
                      const isManual = ltpSrc === "Manual";
                      const isNoData = ltpSrc === "Entry";
                      const isExpanded = expandedRow === t.id;
                      return (
                        <>
                          <tr key={t.id} onClick={() => setExpandedRow(isExpanded ? null : t.id)} className="hover:bg-slate-800/20 transition-colors cursor-pointer group">
                            <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{t.date}</td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="font-bold text-slate-200">{t.symbol}</span>
                              <span className="text-[9px] ml-1.5 text-slate-600 border border-slate-700 rounded px-1">{t.exchange}</span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <Badge variant={t.direction.toLowerCase()}>
                                {t.direction === "Long" ? <ArrowUpRight className="h-2.5 w-2.5" /> : <ArrowDownRight className="h-2.5 w-2.5" />}
                                {t.direction}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-400">{t.setup}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-slate-300 text-xs">₹{fmt(t.entryPrice)}</td>
                            <td className={`px-4 py-3 whitespace-nowrap text-xs font-medium ${isOpen ? "text-sky-300" : "text-slate-300"}`}>
                              {isOpen ? (
                                <span className="flex items-center gap-1.5">
                                  <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${isManual ? "bg-amber-400" : isNoData ? "bg-slate-600" : "bg-sky-400 " + (fetching ? "animate-ping" : "")}`} />
                                  ₹{fmt(ltp)}
                                  <span className={`text-[9px] px-1 rounded border font-bold ${isManual ? "text-amber-400 border-amber-500/30 bg-amber-500/10" : isNoData ? "text-slate-600 border-slate-700" : "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"}`}>
                                    {isManual ? "M" : isNoData ? "–" : ltpSrc?.slice(0, 3).toUpperCase()}
                                  </span>
                                </span>
                              ) : `₹${fmt(t.exitPrice)}`}
                            </td>
                            <td className={`px-4 py-3 whitespace-nowrap font-bold text-xs ${displayPnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{fmtPnl(displayPnl)}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-xs">
                              {t.status === "Closed" && (
                                <span className={`font-semibold ${parseFloat(t.rMultiple) >= 1 ? "text-emerald-400" : "text-rose-400"}`}>{t.rMultiple > 0 ? "+" : ""}{t.rMultiple}R</span>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                <button onClick={() => startEdit(t)} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-emerald-400 transition-colors">
                                  <Edit3 className="h-3.5 w-3.5" />
                                </button>
                                <button onClick={() => setDeleteId(t.id)} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-rose-400 transition-colors">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr key={`${t.id}-expand`} className="bg-slate-900/30">
                              <td colSpan={9} className="px-6 py-4">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs mb-4">
                                  <div><p className="text-slate-600 uppercase tracking-wider mb-1">Stop Loss</p><p className="text-slate-300 font-medium">{t.stopLoss ? `₹${fmt(t.stopLoss)}` : "—"}</p></div>
                                  <div><p className="text-slate-600 uppercase tracking-wider mb-1">Target</p><p className="text-slate-300 font-medium">{t.target ? `₹${fmt(t.target)}` : "—"}</p></div>
                                  <div>
                                    <p className="text-slate-600 uppercase tracking-wider mb-1">Margin Deployed</p>
                                    <p className={`font-medium ${t.marginRequired ? "text-violet-400" : "text-slate-500"}`}>
                                      {t.marginRequired ? `₹${fmt(t.marginRequired)}` : "Full Capital"}
                                    </p>
                                    {t.marginRequired && <p className="text-[10px] text-slate-600 mt-0.5">{(t.entryPrice * t.quantity / t.marginRequired).toFixed(1)}× leverage</p>}
                                  </div>
                                  <div>
                                    <p className="text-slate-600 uppercase tracking-wider mb-1">ROI {t.marginRequired ? "(MTF)" : ""}</p>
                                    <p className={`font-bold ${t.roi != null ? (parseFloat(t.roi) >= 0 ? "text-emerald-400" : "text-rose-400") : "text-slate-500"}`}>
                                      {t.roi != null ? `${t.roi}%` : t.status === "Open" ? (() => {
                                        const { price: ltp } = getLtp(t.symbol, t.entryPrice);
                                        const upnl = (t.direction === "Long" ? ltp - t.entryPrice : t.entryPrice - ltp) * t.quantity;
                                        const base = t.marginRequired ? t.marginRequired : t.entryPrice * t.quantity;
                                        return `${((upnl / base) * 100).toFixed(2)}% (live)`;
                                      })() : "—"}
                                    </p>
                                  </div>
                                  <div><p className="text-slate-600 uppercase tracking-wider mb-1">Mistake</p><p className={`font-medium ${t.mistake !== "None" ? "text-amber-400" : "text-slate-400"}`}>{t.mistake}</p></div>
                                  <div><p className="text-slate-600 uppercase tracking-wider mb-1">Trade ID</p><p className="text-slate-400 font-mono">{t.id}</p></div>
                                  {t.notes && <div className="col-span-2 md:col-span-4"><p className="text-slate-600 uppercase tracking-wider mb-1">Notes</p><p className="text-slate-300 leading-relaxed whitespace-pre-line">{t.notes}</p></div>}
                                </div>
                                {/* Tranches breakdown */}
                                {t.tranches && t.tranches.length > 1 && (
                                  <div className="mt-2">
                                    <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-2">Entry Tranches ({t.tranches.length})</p>
                                    <div className="bg-slate-800/40 rounded-xl border border-slate-700/40 overflow-hidden">
                                      <table className="w-full text-xs">
                                        <thead>
                                          <tr className="border-b border-slate-700/40 text-[10px] text-slate-600 uppercase tracking-wider">
                                            <th className="px-3 py-2 text-left font-semibold">#</th>
                                            <th className="px-3 py-2 text-left font-semibold">Date</th>
                                            <th className="px-3 py-2 text-right font-semibold">Price</th>
                                            <th className="px-3 py-2 text-right font-semibold">Qty</th>
                                            <th className="px-3 py-2 text-right font-semibold">Value</th>
                                            <th className="px-3 py-2 text-right font-semibold">Margin</th>
                                            <th className="px-3 py-2 text-right font-semibold">Weight</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-700/30">
                                          {t.tranches.map((tr, i) => {
                                            const val = tr.price * tr.qty;
                                            const totalVal = t.tranches.reduce((s, x) => s + x.price * x.qty, 0);
                                            const weight = ((val / totalVal) * 100).toFixed(1);
                                            return (
                                              <tr key={i} className="hover:bg-slate-700/20 transition-colors">
                                                <td className="px-3 py-2 text-slate-500">T{i + 1}</td>
                                                <td className="px-3 py-2 text-slate-400">{tr.date}</td>
                                                <td className="px-3 py-2 text-right text-slate-300 font-medium">₹{fmt(tr.price)}</td>
                                                <td className="px-3 py-2 text-right text-slate-300">{tr.qty}</td>
                                                <td className="px-3 py-2 text-right text-slate-400">₹{fmt(val)}</td>
                                                <td className="px-3 py-2 text-right">
                                                  {tr.margin ? <span className="text-violet-400">₹{fmt(tr.margin)}</span> : <span className="text-slate-600">—</span>}
                                                </td>
                                                <td className="px-3 py-2 text-right">
                                                  <div className="flex items-center justify-end gap-1.5">
                                                    <div className="h-1.5 rounded-full bg-emerald-500/60" style={{ width: `${parseFloat(weight) * 0.5}px`, minWidth: 4 }} />
                                                    <span className="text-slate-500">{weight}%</span>
                                                  </div>
                                                </td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                        <tfoot className="border-t border-slate-700/40">
                                          <tr className="text-[10px] text-slate-500 font-semibold">
                                            <td colSpan={2} className="px-3 py-2 uppercase tracking-wider text-emerald-400">Avg Entry</td>
                                            <td className="px-3 py-2 text-right text-emerald-400">₹{fmt(t.entryPrice)}</td>
                                            <td className="px-3 py-2 text-right text-emerald-400">{t.quantity}</td>
                                            <td className="px-3 py-2 text-right text-slate-400">₹{fmt(t.entryPrice * t.quantity)}</td>
                                            <td className="px-3 py-2 text-right text-violet-400">{t.marginRequired ? `₹${fmt(t.marginRequired)}` : "—"}</td>
                                            <td className="px-3 py-2 text-right text-slate-500">100%</td>
                                          </tr>
                                        </tfoot>
                                      </table>
                                    </div>
                                  </div>
                                )}
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
                {filteredTrades.length === 0 && (
                  <div className="text-center py-16 text-slate-600">No trades match your filters.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════ ANALYTICS ════════════════ */}
        {tab === "analytics" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
              <p className="text-sm text-slate-500 mt-0.5">Deep-dive into your edge and process quality</p>
            </div>

            {/* Top metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Avg Win" value={`₹${fmt(avgWin)}`} color="emerald" icon={TrendingUp} />
              <StatCard label="Avg Loss" value={`₹${fmt(Math.abs(avgLoss))}`} color="rose" icon={TrendingDown} />
              <StatCard label="Profit Factor" value={profitFactor} sub="Avg Win / Avg Loss" color="amber" icon={Zap} />
              <StatCard label="Expectancy per trade" value={`₹${fmt((avgWin * (winRate / 100)) + (avgLoss * (1 - winRate / 100)))}`} color="violet" icon={Award} />
            </div>

            {/* Setup Breakdown + Mistake Frequency */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Setup Performance */}
              <div className="bg-[#0d1117] rounded-2xl border border-slate-800/60 p-5">
                <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-4">Setup Performance</p>
                {setupStats.length === 0 ? (
                  <div className="text-center py-8 text-slate-600 text-sm">No closed trades yet</div>
                ) : (
                  <div className="space-y-3">
                    {setupStats.map((s) => {
                      const maxPnl = Math.max(...setupStats.map((x) => Math.abs(x.pnl)));
                      const barW = maxPnl ? (Math.abs(s.pnl) / maxPnl) * 100 : 0;
                      return (
                        <div key={s.setup}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-slate-300">{s.setup}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-500">{s.count} trades · {s.wr}% WR</span>
                              <span className={`text-sm font-bold ${s.pnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{fmtPnl(s.pnl)}</span>
                            </div>
                          </div>
                          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${s.pnl >= 0 ? "bg-emerald-500" : "bg-rose-500"}`} style={{ width: `${barW}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Mistake Analysis */}
              <div className="bg-[#0d1117] rounded-2xl border border-slate-800/60 p-5">
                <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-4">Mistake Frequency</p>
                {(() => {
                  const mistakeMap = {};
                  closed.forEach((t) => { if (t.mistake !== "None") mistakeMap[t.mistake] = (mistakeMap[t.mistake] || 0) + 1; });
                  const entries = Object.entries(mistakeMap).sort((a, b) => b[1] - a[1]);
                  if (!entries.length) return <div className="text-center py-8 text-slate-600 text-sm">No mistakes logged — great discipline!</div>;
                  const max = entries[0][1];
                  return (
                    <div className="space-y-3">
                      {entries.map(([m, count]) => (
                        <div key={m}>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm text-slate-300">{m}</span>
                            <span className="text-xs text-amber-400 font-bold">{count}×</span>
                          </div>
                          <div className="h-1.5 bg-slate-800 rounded-full">
                            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(count / max) * 100}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Monthly P&L */}
            <div className="bg-[#0d1117] rounded-2xl border border-slate-800/60 p-5">
              <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-4">Monthly P&L Breakdown</p>
              {(() => {
                const monthly = {};
                closed.forEach((t) => {
                  const k = t.date.slice(0, 7);
                  monthly[k] = (monthly[k] || 0) + t.pnl;
                });
                const entries = Object.entries(monthly).sort();
                if (!entries.length) return <div className="text-center py-8 text-slate-600 text-sm">No data yet</div>;
                const maxAbs = Math.max(...entries.map(([, v]) => Math.abs(v)));
                return (
                  <div className="flex items-end gap-3 h-28">
                    {entries.map(([month, pnl]) => {
                      const h = maxAbs ? (Math.abs(pnl) / maxAbs) * 90 : 10;
                      return (
                        <div key={month} className="flex flex-col items-center gap-1 flex-1 min-w-[40px]">
                          <span className={`text-[9px] font-bold ${pnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{pnl >= 0 ? "+" : ""}₹{Math.abs(pnl) >= 1000 ? `${(pnl / 1000).toFixed(1)}k` : pnl}</span>
                          <div className="w-full flex flex-col justify-end" style={{ height: 80 }}>
                            <div className={`w-full rounded-t-md ${pnl >= 0 ? "bg-emerald-500/70" : "bg-rose-500/70"}`} style={{ height: h }} />
                          </div>
                          <span className="text-[9px] text-slate-600">{month.slice(5)}</span>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Streak & holding quality */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#0d1117] rounded-2xl border border-slate-800/60 p-5">
                <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-3">Current Streak</p>
                {(() => {
                  let streak = 0, type = "";
                  const sorted = [...closed].sort((a, b) => new Date(b.date) - new Date(a.date));
                  for (const t of sorted) {
                    const isWin = t.pnl > 0;
                    if (!type) { type = isWin ? "W" : "L"; streak = 1; }
                    else if ((type === "W" && isWin) || (type === "L" && !isWin)) streak++;
                    else break;
                  }
                  return (
                    <div className="text-center py-2">
                      <p className={`text-5xl font-black ${type === "W" ? "text-emerald-400" : "text-rose-400"}`}>{streak}</p>
                      <p className="text-sm text-slate-500 mt-1">{type === "W" ? "winning" : type === "L" ? "losing" : "—"} streak</p>
                    </div>
                  );
                })()}
              </div>
              <div className="bg-[#0d1117] rounded-2xl border border-slate-800/60 p-5">
                <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-3">Best Trade</p>
                {(() => {
                  if (!wins.length) return <div className="text-center py-4 text-slate-600 text-sm">—</div>;
                  const best = wins.reduce((a, b) => (b.pnl > a.pnl ? b : a));
                  return (
                    <div className="text-center py-2">
                      <p className="text-xl font-bold text-emerald-400">{fmtPnl(best.pnl)}</p>
                      <p className="text-sm text-slate-300 font-semibold mt-1">{best.symbol}</p>
                      <p className="text-xs text-slate-500">{best.date} · {best.setup}</p>
                    </div>
                  );
                })()}
              </div>
              <div className="bg-[#0d1117] rounded-2xl border border-slate-800/60 p-5">
                <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-3">Worst Trade</p>
                {(() => {
                  if (!losses.length) return <div className="text-center py-4 text-slate-600 text-sm">—</div>;
                  const worst = losses.reduce((a, b) => (b.pnl < a.pnl ? b : a));
                  return (
                    <div className="text-center py-2">
                      <p className="text-xl font-bold text-rose-400">{fmtPnl(worst.pnl)}</p>
                      <p className="text-sm text-slate-300 font-semibold mt-1">{worst.symbol}</p>
                      <p className="text-xs text-slate-500">{worst.date} · {worst.setup}</p>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── Duplicate Trade Modal ── */}
      {duplicateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d1117] border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="font-bold text-slate-200">Existing Open Position Found</p>
                <p className="text-xs text-slate-500">You already have an open {duplicateModal.existingTrade.direction} trade on <span className="text-amber-400 font-semibold">{duplicateModal.existingTrade.symbol}</span></p>
              </div>
            </div>

            {/* Existing vs New comparison */}
            <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/60 mb-4 space-y-2 text-xs">
              <div className="grid grid-cols-3 text-slate-500 font-semibold uppercase tracking-wider text-[10px] pb-1 border-b border-slate-700/40">
                <span></span><span className="text-center">Existing</span><span className="text-center">New</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="text-slate-500">Entry</span>
                <span className="text-center text-slate-300">₹{fmt(duplicateModal.existingTrade.entryPrice)}</span>
                <span className="text-center text-sky-400">₹{fmt(duplicateModal.newTradeData.entryPrice)}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="text-slate-500">Quantity</span>
                <span className="text-center text-slate-300">{duplicateModal.existingTrade.quantity}</span>
                <span className="text-center text-sky-400">{duplicateModal.newTradeData.quantity}</span>
              </div>
              <div className="grid grid-cols-3 pt-1 border-t border-slate-700/40 font-semibold">
                <span className="text-emerald-400">Avg Entry</span>
                <span className="col-span-2 text-center text-emerald-400">
                  ₹{(((duplicateModal.existingTrade.entryPrice * duplicateModal.existingTrade.quantity) + (duplicateModal.newTradeData.entryPrice * duplicateModal.newTradeData.quantity)) / (duplicateModal.existingTrade.quantity + duplicateModal.newTradeData.quantity)).toFixed(2)}
                  {" "}· {duplicateModal.existingTrade.quantity + duplicateModal.newTradeData.quantity} qty
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 mb-4">Is this an <span className="text-emerald-400 font-semibold">add-on</span> to your existing trade, or a <span className="text-sky-400 font-semibold">separate</span> independent trade?</p>

            <div className="flex flex-col gap-2">
              <button onClick={handleAddToExisting} className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 rounded-xl text-sm transition-colors">
                ✓ Add-on — Update Avg Entry & Qty
              </button>
              <button onClick={handleSeparateTrade} className="w-full bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 border border-sky-500/30 font-semibold py-2.5 rounded-xl text-sm transition-colors">
                Log as Separate Trade
              </button>
              <button onClick={() => setDuplicateModal(null)} className="w-full bg-slate-800 hover:bg-slate-700 text-slate-400 font-semibold py-2.5 rounded-xl text-sm transition-colors border border-slate-700">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deleteId && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#0d1117] border border-slate-700 rounded-2xl p-6 w-80 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-rose-400" />
              </div>
              <div>
                <p className="font-bold text-slate-200">Delete Trade</p>
                <p className="text-xs text-slate-500">This cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => handleDelete(deleteId)} className="flex-1 bg-rose-500 hover:bg-rose-400 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">Delete</button>
              <button onClick={() => setDeleteId(null)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 rounded-xl text-sm transition-colors border border-slate-700">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}