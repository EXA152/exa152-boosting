/*
EXA152 GLOBAL SETTINGS
Edit this file for quick site-wide changes.

workload.level: "low", "normal", or "high"
workload.label/message: text shown in workload notices
pausedReason: default reason shown on disabled listings
recentlyUpdatedDays: number of days a changed listing shows "Recently Updated" (max 5)
siteUpdated: YYYY-MM-DD shown as the site update date
globalNotice: optional short site-wide notice; leave empty to hide
largeOrderNotice: notice shown near Featured Services
featuredLimit: number of featured listings to display; use 0 to hide Featured Services completely
*/
window.EXA152_SETTINGS = {
  "workload": {
    "level": "normal",
    "label": "Normal volume",
    "message": "Orders are completed in the order received. Delivery times may vary depending on current order volume."
  },
  "pausedReason": "Temporarily paused. Ordering may be unavailable due to current order volume.",
  "recentlyUpdatedDays": 5,
  "siteUpdated": "2026-10-16",
  "globalNotice": "",
  "largeOrderNotice": "Large orders may require additional delivery time. Orders are completed in the order received.",
  "featuredLimit": 3
};
