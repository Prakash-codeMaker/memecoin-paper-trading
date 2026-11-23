/**
 * The paper portfolio. Pure functions over a plain object so it is easy to test
 * and to store as JSON.
 *
 * Average-cost accounting: selling part of a position realizes the sold share of
 * its cost. Amounts are in SOL and whole tokens.
 */
/** Validate the persisted portfolio shape before any command reads it. */
export function checkBook(book) {
  const record = book !== null && typeof book === "object" && !Array.isArray(book);
  const positions = record && book.positions !== null
    && typeof book.positions === "object" && !Array.isArray(book.positions);
  if (!record || !Number.isFinite(book.startSol) || book.startSol <= 0
    || !Number.isFinite(book.cash) || book.cash < 0
    || !positions || !Array.isArray(book.trades)) {
    throw new Error("invalid portfolio structure");
  }
  return book;
}

export function newBook(startSol = 10) {
  return { version: 1, startSol, cash: startSol, positions: {}, trades: [], createdAt: new Date().toISOString() };
}

export function applyBuy(book, { mint, symbol, solIn, tokensOut, time = Date.now(), impact = 0 }) {
  if (!(solIn > 0)) throw new Error("Buy size must be more than 0 SOL.");
  if (solIn > book.cash + 1e-12) throw new Error(`Not enough paper SOL: you have ${book.cash.toFixed(4)} SOL.`);
  if (!(tokensOut > 0)) throw new Error("The quote returned no tokens.");
  book.cash -= solIn;
  const p = book.positions[mint] || (book.positions[mint] = { mint, symbol, tokens: 0, cost: 0, realized: 0, opened: time });
  p.symbol = symbol || p.symbol;
  p.tokens += tokensOut;
  p.cost += solIn;
  book.trades.push({ side: "buy", mint, symbol: p.symbol, sol: solIn, tokens: tokensOut, price: solIn / tokensOut, impact, time });
  return p;
}

export function applySell(book, { mint, tokensIn, solOut, time = Date.now(), impact = 0 }) {
  const p = book.positions[mint];
  if (!p || p.tokens <= 0) throw new Error("You hold none of this token.");
  if (!(tokensIn > 0) || tokensIn > p.tokens * (1 + 1e-9)) throw new Error(`You hold ${p.tokens} tokens.`);
  tokensIn = Math.min(tokensIn, p.tokens);
  const costOut = p.cost * (tokensIn / p.tokens);
  const pnl = solOut - costOut;
  p.tokens -= tokensIn;
  p.cost -= costOut;
  p.realized += pnl;
  book.cash += solOut;
  book.trades.push({ side: "sell", mint, symbol: p.symbol, sol: solOut, tokens: tokensIn, price: solOut / tokensIn, pnl, impact, time });
  if (p.tokens <= 1e-9) {
    delete book.positions[mint];
    book.closed = book.closed || [];
    book.closed.push({ mint, symbol: p.symbol, realized: p.realized, opened: p.opened, closed: time });
  }
  return { pnl, costOut };
}

/** Value the book. `values` maps mint -> SOL you would get selling the whole position now. */
export function valuation(book, values = new Map()) {
  const rows = Object.values(book.positions).map((p) => {
    const value = values.has(p.mint) ? values.get(p.mint) : null;
    return { ...p, value, unrealized: value === null ? null : value - p.cost, roi: value === null || !p.cost ? null : ((value - p.cost) / p.cost) * 100 };
  });
  const held = rows.reduce((s, r) => s + (r.value ?? 0), 0);
  const realized = book.trades.filter((t) => t.side === "sell").reduce((s, t) => s + t.pnl, 0);
  const sells = book.trades.filter((t) => t.side === "sell");
  const equity = book.cash + held;
  return {
    rows, cash: book.cash, held, equity, realized,
    totalPnl: equity - book.startSol,
    totalRoi: ((equity - book.startSol) / book.startSol) * 100,
    winRate: sells.length ? (sells.filter((t) => t.pnl > 0).length / sells.length) * 100 : null,
    sells: sells.length, unpriced: rows.filter((r) => r.value === null).length,
  };
}
