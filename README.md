# dollar-a-day-plan / matsedel

> **Archived.** This project was built for personal family use and is no longer actively developed. It worked well for us, but it's probably not useful to anyone else in its current state — feel free to poke around anyway.

## What it is

A weekly meal-planning PWA for a family of 5, built around a budget constraint (~1 SEK per person per day). The app lets you:

- Plan meals across a 7-day week (breakfast, lunch, dinner)
- Pick ingredients from a Lidl product catalogue (1,275 items, scraped from CSV)
- Track per-meal and weekly cost, calories, protein, and a full micronutrient panel
- Sort/filter products by price-per-gram or protein-per-krona

## Stack

- **Frontend:** React + Vite, served as a static SPA
- **Backend:** [PocketBase](https://pocketbase.io/) (single binary, SQLite)
- **Deployment:** Docker (multi-stage build), self-hosted on a LAN device

## Running locally

```bash
cd matsedel
docker compose up
```

The app will be available at `http://localhost:8090`.

PocketBase data is persisted in a Docker volume (`pb_data`).

## Why it's not ready for general use

- The product data is Lidl Sweden–specific and priced in SEK
- The backend runs on a LAN IP with no auth hardening, HTTPS, or user accounts
- There's no "add your own store" workflow — the catalogue is baked in at build time
- Nutritional data is incomplete/estimated for many items

See [ROADMAP.md](ROADMAP.md) for what it would take to change that.

## License

AGPL-3.0 — see [LICENSE](LICENSE).
