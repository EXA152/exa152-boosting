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


## Workload / order queue
Edit the `workload` object near the top of `listings-data.js`.

Example:
```js
"workload": {
  "level": "high",
  "label": "High order volume",
  "message": "Orders are completed in the order received. Delivery may take longer than normal."
}
```

Valid visual levels: `low`, `normal`, `high`.

## Delivery estimates
Each listing has a `deliveryText` field in `listings-data.js`.
Change it per service if a different ETA is needed.

## Pausing a listing
- `enabled: false` = listing remains visible but the marketplace order button is disabled and the card moves below available listings.
- `visible: false` = listing is removed from homepage results and filter counts.

## Analytics
Clicks to Eldorado and ZeusX are sent to Google Analytics as:
- `listing_marketplace_click` for listing-specific links
- `marketplace_click` for general marketplace/profile links

Parameters include marketplace, listing ID/name, game, destination URL, and page path.
