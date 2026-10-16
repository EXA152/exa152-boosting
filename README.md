# EXA152 Gaming Services Website

## Main maintenance file
Edit `listings-data.js` for normal listing changes.

For each listing:
- `price` / `priceText` — displayed price
- `marketplaceUrl` — direct Eldorado or ZeusX link
- `discountText` — discount summary
- `status` — label shown to visitors
- `enabled: false` — keeps the listing visible but disables the order button
- `visible: false` — hides the listing from the homepage and filter counts
- `featuredLabel` — optional highlight such as `Best Value`
- `newUntil` — show a `New` badge until YYYY-MM-DD
- `updatedBadgeUntil` — show `Recently Updated` until YYYY-MM-DD
- `updated` — optional per-listing update date
- `siteUpdated` — fallback update date for the whole site

## Homepage tools
The homepage includes:
- Search
- Game / marketplace filters with counts
- Price-range filter
- Sorting
- Availability badges
- Featured / New badges

## Marketplaces
- Eldorado: Phasmophobia + Fortnite Save the World
- ZeusX: Palworld

## Mobile
The header uses a hamburger menu on smaller screens.

## SEO
Each detail page includes breadcrumbs, structured data, FAQ markup, social preview metadata, sitemap coverage, and IndexNow support.
