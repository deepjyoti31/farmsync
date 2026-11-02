# Roadmap

This roadmap is a guide, not a promise. Items near the top are the most valuable for farmers relative to the effort involved.
If you would like to work on something, comment on (or open) the matching issue first so effort is not duplicated.

## Now: finish the beta features

| Item | Notes |
| --- | --- |
| Livestock health records and production tracking | Tables `livestock_health_records` and `livestock_production` exist; UI tabs still say "Coming soon" |
| Crop calendar | Calendar view of planting and expected harvest dates from `field_crops` |
| Equipment maintenance scheduling | Table `equipment_maintenance` exists; the schedule button is a placeholder |
| Task manager | Create, assign, complete and repeat tasks; the dashboard currently only lists them |
| Avatar upload | Supabase Storage bucket for profile pictures |
| PDF compliance reports | Inputs and water usage already export as CSV; add an audit-ready PDF |
| Loan and insurance entry forms | Pages read real records but there is no form to add one yet |
| Translation coverage | Many pages still have hard-coded English strings |

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
