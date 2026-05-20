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

## Updating the data

The form responses are kept in the Google Sheet. To refresh the dashboard with new sessions:

1. Download the sheet as `.xlsx`.
2. Replace `sheet.xlsx` locally and run a small Python script (`openpyxl`) to regenerate `data.js`.

The current dataset covers **2,319 hand-entries across 30 sessions** between June 2025 and May 2026 (560 hands). Per-year totals match the spreadsheet's own *Live Dashboard 2026* tab exactly.

## Quirks handled

- Early sessions reused hand numbers (the form initially numbered hands per-session before switching to sequential). Hands are keyed by `(date, hand)` to keep them distinct.
- Each player records their *side*'s score for a hand, so player totals are summed directly without dividing by 2.
- A handful of retro-entries (timestamp much later than the play date) are kept and attributed to the play date.
