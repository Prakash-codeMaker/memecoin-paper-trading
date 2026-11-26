# Memecoin Paper Trading

Practise Solana memecoin trading with fake SOL at real prices. Every buy and sell is filled at a live Jupiter quote, including price impact, so a trade that would move a thin pool in real life moves it here too.

![Node 22+](https://img.shields.io/badge/node-%E2%89%A522-5FA04E?logo=node.js&logoColor=white) ![Dependencies: 0](https://img.shields.io/badge/dependencies-0-2ea44f) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE) [![Website](https://img.shields.io/badge/website-blixtrade.github.io-8b5cf6)](https://blixtrade.github.io/memecoin-paper-trading/)

> Free and open source, part of the [Blix Trade](https://github.com/blixtrade) toolkit. For the live version with AI ratings on every coin, wallet tracking and one-click trading at 0% fees, see **[BLIX, the Solana memecoin terminal](https://blixvip.com/memecoin-paper-trading?utm_source=github&utm_medium=readme&utm_campaign=memecoin-paper-trading)**.

## What it does

- `buy`, `sell` (any percent), `portfolio`, `history` and `reset`, with a starting balance you choose.
- Fills at real Jupiter routes across every Solana DEX, with the route and price impact shown.
- Portfolio values each position at what you would actually receive selling it now, not at the chart price.
- Average-cost accounting, realized and open PnL, and win rate.
- No wallet, no keys, no real SOL. The portfolio is a JSON file in your home folder.

## Quick start

You need [Node.js](https://nodejs.org) 22 or newer. There is nothing else to install: no dependencies, no API keys.

Run it straight from GitHub:

```bash
npx -y github:blixtrade/memecoin-paper-trading buy <mint> 0.5
```

Or clone it:

```bash
git clone https://github.com/blixtrade/memecoin-paper-trading.git
cd memecoin-paper-trading
node bin/paper.js buy <mint> 0.5
```

To get a `paper` command on your PATH, run `npm link` inside the folder.

## Example output

Real output from a run on 18 November 2026:

```text
$ paper buy 9hjBLBrc7WZW2H8UQvBAvG5WiTZotXUv2Bdcn4f4pump 1
Bought 5.2K DCTY for 1.0000 SOL  via Meteora DLMM
Paper SOL left: 9.0000 SOL

$ paper buy DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263 0.5
Bought 15.72M Bonk for 0.5000 SOL  via BisonFi → Scorch
Paper SOL left: 8.5000 SOL

$ paper portfolio

Paper portfolio  ~/.blix-paper/portfolio.json

  Equity     10.0020 SOL  +0.0020 SOL (0.0%) since starting with 10.00 SOL
  Cash       8.5000 SOL
  Realized   0.0000 SOL

Token          Tokens       Cost   Sell now        PnL       ROI  Mint
DCTY             5.2K     1.0000     1.0022    +0.0022        0%  9hjBLBrc7WZW2H8UQvBAvG5WiTZotXUv2Bdcn4f4pump
Bonk           15.72M     0.5000     0.4998    -0.0002        0%  DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263

"Sell now" is a live Jupiter quote for the whole position, including price impact.
```

## Options

```text
memecoin-paper-trading: practise Solana memecoin trades with fake SOL at real prices

Usage:
  paper buy <mint> <sol>            Buy with paper SOL, filled at a live Jupiter quote
  paper sell <mint> <percent|all>   Sell part or all of a position (e.g. 50, 25%, all)
  paper portfolio                   Positions valued at what you would get selling now (alias: pf)
  paper history [n]                 Your last n trades (default 20)
  paper reset [sol]                 Start over with a fresh balance (default 10 SOL)

Options:
  --slippage <bps>   Slippage for quotes in basis points (default 100 = 1%)
  --file <path>      Portfolio file (default ~/.blix-paper/portfolio.json, or $PAPER_FILE)
  --json             Machine-readable output
  --help             Show this help

Fills use real Jupiter routes and include price impact, so a trade that would
move a thin pool in real life moves it here too. No wallet, no keys, no real SOL.
```

## Environment variables

| Variable | Effect |
|---|---|
| `PAPER_FILE` | Portfolio file to use when `--file` is not given (default `~/.blix-paper/portfolio.json`). |
| `JUP_API_URL` | Jupiter API host for quotes and prices (default `https://lite-api.jup.ag`), e.g. a paid endpoint. |
| `NO_COLOR` | Set to any value to turn off coloured output. Colour is also off when output is not a terminal. |
| `BLIX_NO_FOOTER` | Set to any value to hide the one-line BLIX link printed after `paper portfolio`. |
| `DEBUG` | Set to any value to print the full error and stack trace when a command fails. |

## Portfolio file

The portfolio is plain JSON, so you can back it up, inspect it or chart it. This is what `paper reset` followed by one buy writes (amounts in SOL and whole tokens, times in Unix milliseconds):

```json
{
  "version": 1,
  "startSol": 10,
  "cash": 9.5,
  "positions": {
    "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263": {
      "mint": "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
      "symbol": "Bonk",
      "tokens": 16587600,
      "cost": 0.5,
      "realized": 0,
      "opened": 1795626651463,
      "decimals": 5
    }
  },
  "trades": [
    {
      "side": "buy",
      "mint": "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
      "symbol": "Bonk",
      "sol": 0.5,
      "tokens": 16587600,
      "price": 3.0142998384335284e-8,
      "impact": 0,
      "time": 1795626651463
    }
  ],
  "createdAt": "2026-11-25T17:10:50.383Z"
}
```

- `startSol`: the starting balance. `cash`: paper SOL not in a position.
- `positions`: open positions keyed by mint. `cost` is the SOL still invested (average cost), `realized` is the PnL from partial sells so far.
- `trades`: every buy and sell, oldest first. Sells also have `pnl`. `impact` is the quote's price impact in percent.
- `closed`: appears after a position is fully sold, with one `{ mint, symbol, realized, opened, closed }` entry per closed position.

## How it works

- Quotes come from Jupiter's free API; token decimals from Jupiter's price API.
- The portfolio file is written atomically, so a crash never corrupts it.

## Limits

- Paper fills do not pay network or priority fees, and nothing is front-run, so real results will be a little worse.
- A token with no Jupiter route (no liquidity yet) cannot be bought or valued.

## Development

```bash
npm test
```

Tests run offline against fixtures, so they never depend on a live API.

## Contributing

Pull requests are welcome, and first-timers are too. Pick an issue labelled [good first issue](https://github.com/blixtrade/memecoin-paper-trading/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) or [help wanted](https://github.com/blixtrade/memecoin-paper-trading/issues?q=is%3Aissue+is%3Aopen+label%3A%22help+wanted%22), comment that you are taking it, and read [CONTRIBUTING.md](CONTRIBUTING.md). No API keys needed: the tests run offline.

[![Contributors](https://contrib.rocks/image?repo=blixtrade/memecoin-paper-trading)](https://github.com/blixtrade/memecoin-paper-trading/graphs/contributors)

## More free Solana tools from Blix Trade

| Tool | What it does |
|---|---|
| [solana-bubble-map](https://github.com/blixtrade/solana-bubble-map) | Holder bubble map for any Solana or pump.fun token. |
| [pump-fun-tracker](https://github.com/blixtrade/pump-fun-tracker) | Every new pump.fun launch on Solana, live in your terminal, the moment it is created. |
| [solana-rug-checker](https://github.com/blixtrade/solana-rug-checker) | Rug pull scanner for Solana and pump.fun tokens. |
| [solana-memecoin-screener](https://github.com/blixtrade/solana-memecoin-screener) | Screen trending, new and boosted Solana memecoins from the terminal. |
| [solana-wallet-tracker](https://github.com/blixtrade/solana-wallet-tracker) | Follow any Solana wallets and see every memecoin buy and sell they make: token, size in SOL and USD, and a Solscan link. |
| [solana-pnl-tracker](https://github.com/blixtrade/solana-pnl-tracker) | Profit and loss for any Solana wallet's memecoin trades, worked out from its on-chain transactions. |
| [solana-whale-tracker](https://github.com/blixtrade/solana-whale-tracker) | Big buys and sells on any Solana token: net whale flow, every large trade with a Solscan link, and leaderboards of the wallets buying and dumping the most. |
| [memecoin-alert-bot](https://github.com/blixtrade/memecoin-alert-bot) | pump.fun alerts in Telegram and Discord. |
| [pump-fun-mcp](https://github.com/blixtrade/pump-fun-mcp) | An MCP server that gives Claude, Cursor and other AI assistants six Solana memecoin research tools: token info, rug check, top holders, a screener, whale trades and wallet trades. |

Want all of this in one place, live, with AI on every coin? **[Open BLIX](https://blixvip.com/?utm_source=github&utm_medium=readme&utm_campaign=memecoin-paper-trading)**: the Solana memecoin terminal with 0% trading fees.

## Disclaimer

This is research software, not financial advice. Memecoins are extremely volatile and most go to zero. Never trade more than you can afford to lose. The data comes from free third-party APIs that can be wrong, late or unavailable.

## License

[MIT](LICENSE)
