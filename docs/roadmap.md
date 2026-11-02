# Roadmap

This roadmap is a guide, not a promise. Items near the top are the most valuable for farmers relative to the effort involved.
If you would like to work on something, comment on (or open) the matching issue first so effort is not duplicated.

## Now: finish the beta features

| Item | Notes |
| --- | --- |
| Loan and insurance entry forms | Pages read real records but there is no form to add one yet |
| Translation coverage | Many pages, including the new Tasks page and livestock records, still have hard-coded English strings |
| Unicode fonts in PDF reports | The audit PDF uses built-in Latin fonts; product names in Devanagari or other scripts are replaced with `?` |
| Layout overflow at narrow widths | The top bar and page headers overflow horizontally on phones and at around 1280 px with the sidebar open |

Recently completed: task manager with repeating tasks, livestock health records with due reminders, livestock production tracking, crop calendar, equipment maintenance logging and scheduling, audit-ready PDF report, and profile picture upload.

## Next: high-impact features

1. **Weather and sensor alerts.** Frost, heavy rain and heat warnings from forecasts; threshold alerts from sensors (for example soil moisture below 20%), delivered through the existing `notifications` table.
2. **Offline data entry.** Queue inserts and updates made without a connection and sync them when the device is back online.
3. **Crop photo diagnosis.** Photograph a leaf, get likely pests or diseases and treatment options, and log the treatment as an input.
4. **Crop rotation planner.** Use each field's planting history to suggest the next crop and flag rotation problems.
5. **Profit per field and per crop.** Link transactions and harvests to show cost per acre, break-even yield and margin.

## Later

- Satellite vegetation index (NDVI) overlays on field boundaries
- Irrigation scheduling from evapotranspiration estimates and soil moisture
- Market price alerts and automatic import of official mandi prices
- Carbon footprint estimates from input and fuel logs
- SMS or WhatsApp alerts for low-connectivity users
- Livestock genealogy and breeding planner

## Known limitations

- Writes require a network connection.
- The farm credit score is an indicative figure computed from the farm's own records, not a bureau score.
- The mandi price board shows labelled sample data until `market_data` is populated.
- Compliance checks automate banned-input rules only; other rule types are flagged for manual review.
- The bigha conversion uses 0.25 ha, which is common in north India but varies by region (`src/lib/yieldAnalytics.ts`).
