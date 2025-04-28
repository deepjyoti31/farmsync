# FarmSync - Farm Management Application

FarmSync is a comprehensive farm management application designed to streamline operations on a modern farm. It provides tools for managing crops, livestock, fields, equipment, finances, and more, with a user-friendly interface and data-driven insights.

## Table of Contents

- [Features](#features)
- [Technologies Used](#technologies-used)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Supabase Setup](#supabase-setup)
- [Mapbox Integration](#mapbox-integration)
- [WeatherAPI.com Integration](#weatherapicom-integration)
- [Running the Application](#running-the-application)
- [Deployment](#deployment)

## Features

- Dashboard with farm overview and key metrics
- Crop management and planning
- Field mapping and management
- Farm boundary mapping with automatic area calculation
- Detailed farm information view with interactive map
- Equipment tracking and maintenance scheduling
- Financial transaction recording and reporting
- Weather forecasting integration
- Community forums for farmer discussions
- Responsive design for desktop and mobile use

## Technologies Used

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL database, authentication, storage)
- **APIs**: WeatherAPI.com for weather data, Mapbox for mapping and geospatial features
- **State Management**: React Query
- **Mapping**: Mapbox GL JS, @mapbox/mapbox-gl-draw for boundary drawing, @mapbox/geojson-area for area calculations

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account
- WeatherAPI.com API key
- Mapbox access token

## Installation

1. Clone the repository:

```sh
git clone https://github.com/deepjyoti31/farmsync.git
cd farmsync
```

2. Install dependencies:

```sh
npm install
# or
yarn install
```

3. Create a `.env` file in the root directory based on the `.env.example` file:

```sh
cp .env.example .env
```

## Environment Variables

Edit the `.env` file and add your environment variables:

```
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Mapbox Configuration
VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_token_here
```

## Supabase Setup

1. Create a Supabase account at [supabase.com](https://supabase.com)

2. Create a new project in Supabase

3. Get your Supabase URL and anon key from the project settings (API section)

4. Add these values to your `.env` file

5. Apply the database migrations:

```sh
npx supabase login
npx supabase link --project-ref your_project_id
npx supabase db push
# or use our helper script
node supabase/apply-migrations.js
```

## Mapbox Integration

1. Create an account at [Mapbox](https://www.mapbox.com/)

2. Navigate to your account dashboard and create a new access token

3. Add the access token to your `.env` file:

```
VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_token_here
```

## WeatherAPI.com Integration

1. Create an account at [WeatherAPI.com](https://www.weatherapi.com/)

2. Get your API key from the dashboard

3. Set up the environment variable for the Supabase Edge Function:

```sh
npx supabase secrets set WEATHER_API_KEY="your_api_key" --project-ref your_project_id
# or use our helper script
node supabase/setup-env-vars.js
```

## Running the Application

Start the development server:

```sh
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:8080`

## Deployment

Build the application for production:

```sh
npm run build
# or
yarn build
```

The built files will be in the `dist` directory, which you can deploy to any static hosting service.

For Supabase Edge Functions deployment:

```sh
npx supabase functions deploy get-weather --project-ref your_project_id
```
