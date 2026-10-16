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


## Quick global settings
Use `settings.js` for:
- workload level / label / message
- default paused reason
- automatic Recently Updated duration (0–5 days)
- site updated date
- optional global notice

## Recently Updated badges
Set a listing's `updated` field in `listings-data.js`.
The site will automatically show `Recently Updated` for the number of days set in `settings.js`, capped at 5 days.

## Copy link
Each listing detail page includes a Copy link button.

## Privacy
`privacy.html` explains analytics, external marketplace links, and payment handling.

## Maintenance
See `MAINTENANCE-CHECKLIST.md`.

## settings.js workload fix
The workload controls in `settings.js` now correctly override the site-wide workload banner.
After editing `settings.js` on GitHub, save/commit the file and refresh the live site.


## black bordered workload notice
The workload text from `settings.js` now shows inside the black bordered notice style:
- on the main Offers page
- on each listing detail page

Edit `settings.js` → `workload.label` and `workload.message` to change that text site-wide.

## Private listing editor
The private editor is delivered separately as `EXA152-private-listing-editor.html`.
It is intentionally NOT included in the GitHub deployment ZIP. Keep it on your computer and do not upload it to GitHub Pages.

Open the editor locally, make changes, then use its buttons to download:
- `settings.js`
- `listings-data.js`

Upload only those generated JS files when you want to apply the changes.

## Featured Services
Listings with `featuredLabel` are eligible for the Featured Services row.
`settings.js` → `featuredLimit` controls how many are displayed.

## Changelog
The homepage keeps only the latest 5 updates.

## Performance
See `PERFORMANCE-CHECK.txt`.

## Featured Services visibility
Set `featuredLimit` in `settings.js` to:
- `0` to hide the Featured Services section completely
- `1`–`6` to show up to that many listings that have a `featuredLabel`

If no visible listings have a `featuredLabel`, the section also disappears automatically.

## Global notice
Set `globalNotice` in `settings.js` to any non-empty text to show a small gray rounded notice in the top-right.
- maximum width: 200px
- white text
- red × in the top-left
- does not auto-dismiss
- only closes when the × is clicked
- once dismissed, the same notice stays dismissed on that browser
- changing the notice text makes the new notice appear again
