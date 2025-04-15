# Supabase Configuration for FarmSync

This directory contains the Supabase configuration for the FarmSync application.

## Tables

The following tables are configured:

- **farms**: Farm information
- **fields**: Field information
- **crops**: Crop information
- **field_crops**: Crops planted in fields
- **inventory**: Inventory items
- **equipment**: Farm equipment
- **financial_transactions**: Financial transactions
- **weather_data**: Weather data
- **forums**: Discussion categories
- **forum_posts**: Forum posts
- **post_comments**: Comments on forum posts
- **post_likes**: Likes on forum posts
- **testimonials**: User reviews
- **app_screenshots**: Marketing screenshots
- **market_data**: Commodity prices

## Applying Migrations

To apply the migrations to your Supabase project, run:

```bash
node supabase/apply-migrations.js
```

Or use the Supabase CLI directly:

```bash
npx supabase db push
```

## Setting Up Environment Variables

To set up the WeatherAPI.com API key, run:

```bash
node supabase/setup-env-vars.js
```

You will be prompted to enter your WeatherAPI.com API key.

## Row Level Security (RLS) Policies

The following RLS policies are configured:

- Public read access for all tables
- Authenticated users can create/update/delete their own comments
- Authenticated users can like/unlike posts

## Seed Data

The migrations include seed data for:

- 3 forum categories
- 3 app screenshots
- 3 testimonials
- Sample market data for common crops

## TypeScript Types

The TypeScript types for the Supabase tables are defined in `src/integrations/supabase/types.ts`.
