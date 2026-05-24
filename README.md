# Bridge Scores Dashboard

Interactive dashboard for the four-handed bridge game played by Caroline, David, Hamish and Vivienne. Reads the form responses from the [source Google Sheet](https://docs.google.com/spreadsheets/d/1QdWqUcw3ykjQVaY7kCdEtVthWS5ACqNi3TuXTMRpm5w/edit) and surfaces a year's worth of hands as charts, leaderboards, partnership analysis and a searchable hand log.

Live site: https://bridgescoresbyclaude.netlify.app/

## What it shows

- **Hero panel** — the latest hand (contract, declarer + partner, made/down result, side scores) and a current-standings leaderboard.
- **Season summary** — every player's totals broken down by year (2025, 2026, …) with sessions, hands, pts/hand, pts/session, avg HCP, and a rank badge per year. The current year is tagged *ongoing*.
- **League table** — all-time per-player stats: total, pts/hand, pts/session, avg HCP, *efficiency* (pts per HCP dealt), declarer-success %, best/worst session, and a recent-form sparkline. Click any column to sort.
- **Score progression** — cumulative score across sessions, plus outright/tied session wins.
- **Per-session bars** — grouped bars showing every player's total for every session.
- **Card luck** — average HCP per session vs the expected value of 10.
- **HCP distribution** — bucketed hand-strength frequencies per player.
- **Efficiency** — points per HCP dealt, head-to-head.
- **HCP vs points scatter** — every hand as a point; hover for date and hand number.
- **Declarer outcomes** — over-tricks / made-exactly / went-down counts per player.
- **Suit mix** — contract-suit doughnut.
- **Partnerships** — for each of the three possible pairings: hands declared together, make rate, and net points won.
- **Records** — biggest single hand, worst hand, best session, slams, hottest pairing, most-played suit.
- **Hand log** — searchable, sortable detail of every form entry.

## Filters

The controls bar drives every panel:

- **Player** chips — toggle individual players in and out.
- **Year** — All / 2025 / 2026 (new years are detected automatically).
- **Session** — focus on one date.
- **Auction** — only hands where the selected players were declarer (or defender).
- **Contract suit** — filter to one suit.

## Running locally

```
git clone https://github.com/davidlloyd73-cell/Bridge-scores.git
cd Bridge-scores
open index.html        # macOS — xdg-open on Linux, start on Windows
```

It's a single static file (`index.html`) plus an embedded data file (`data.js`). Chart.js is loaded from a CDN so you need an internet connection on first load.

## Live data feed

The dashboard reads the **"Form responses 1"** tab straight from the Google Sheet every time it loads (and whenever you press **Refresh**), so it updates itself as new hands are submitted to the form.

For the live feed to work, the Sheet must be shared so that **Anyone with the link** can **view** it (Share ▸ General access ▸ Anyone with the link ▸ Viewer).

- A green **Live · updated HH:MM** badge means it's reading the sheet directly.
- An amber **Saved snapshot** badge means the live feed couldn't load and it fell back to the bundled `data.js`. If you see this, either turn on link-sharing, or in the sheet do **File ▸ Share ▸ Publish to web ▸ "Form responses 1" ▸ CSV** and paste that URL into `LIVE_CSV_URL` near the top of the `<script>` in `index.html`.

To poll automatically during a game, set `AUTO_REFRESH_SECONDS` (e.g. `60`) in the same place.

`data.js` is just an offline snapshot/fallback. To refresh it: download the sheet as `.xlsx` and regenerate with a short `openpyxl` script. The bundled snapshot covers **2,319 hand-entries across 30 sessions** (560 hands) between June 2025 and May 2026, and its per-year totals match the spreadsheet's own *Live Dashboard 2026* tab exactly.

## Quirks handled

- Early sessions reused hand numbers (the form initially numbered hands per-session before switching to sequential). Hands are keyed by `(date, hand)` to keep them distinct.
- Each player records their *side*'s score for a hand, so player totals are summed directly without dividing by 2.
- A handful of retro-entries (timestamp much later than the play date) are kept and attributed to the play date.
