---
title: VeloSpark - Building a Route Recommendation App for Cyclists and Runners
coverPhoto: /assets/posts/velosparkapp/01-homepage.png
---

## Motivation

As a cyclist living in Colorado, I have access to incredible terrain. The problem is there's almost too much of it. With thousands of possible routes, picking the right one for a given day becomes its own challenge. Do I want something flat and fast, or am I chasing elevation? Do I have 45 minutes or 4 hours? I found myself defaulting to the same tired loops instead of exploring.

I built VeloSpark to solve this. The app takes your preferences—distance, elevation, time, activity type—and surfaces routes that actually fit what you're looking for. It integrates with Strava for personalized recommendations based on your activity history.

## The Stack

I went with a modern monorepo setup using Turborepo and pnpm. The frontend is Next.js 16 with React 19 and Tailwind CSS 4. Auth is handled by Auth.js v5 with Strava OAuth. The database is PostgreSQL 16 with Prisma 7 as the ORM. On the backend, I have a FastAPI service running the ML recommendation engine using scikit-learn and pandas.

Maps use OpenStreetMap with Leaflet—I wanted to avoid the Google Maps dependency and the OSM tiles look great.

## Onboarding Flow

New users are guided through a 3-step questionnaire. This captures their experience level, terrain preferences, and typical ride/run duration. The answers influence the ML model's recommendations.

![Experience Level Selection](/assets/posts/velosparkapp/02-questionnaire-step1.png)

![Terrain Preference](/assets/posts/velosparkapp/03-questionnaire-step2.png)

![Duration Preference](/assets/posts/velosparkapp/04-questionnaire-step3.png)

## Route Finder

The route finder gives users precise control over their search. Sliders let you dial in distance, elevation gain, and time. The map lets you click to set a starting location.

![Route Finder Interface](/assets/posts/velosparkapp/05-route-finder-interface.png)

Search results display on an interactive map with route overlays. The list is paginated and each card shows the route name, distance, and elevation gain. There's also a "Popular nearby" section that surfaces routes frequently ridden by other athletes in the area.

![Route Results](/assets/posts/velosparkapp/06-route-results.png)

## Route Details

Clicking into a route shows the full GPS trace on a map. A slide-out panel displays route statistics and a GPS tracking toggle.

![Route Map View](/assets/posts/velosparkapp/07-route-detail-map.png)

![Route Detail Panel](/assets/posts/velosparkapp/08-route-detail-panel.png)

## Strava Integration

Authentication is handled via Strava OAuth. I used Auth.js v5 which made the integration straightforward.

![VeloSpark Sign-in](/assets/posts/velosparkapp/10-signin-page.png)

![Strava OAuth](/assets/posts/velosparkapp/11-strava-login.png)

Once authenticated, the app greets you by name and remembers your preferences.

![Authenticated Homepage](/assets/posts/velosparkapp/12-authenticated-homepage.png)

## User Profile and Settings

The profile page shows your account info and lets you set your default activity type.

![Profile Page](/assets/posts/velosparkapp/13-profile-page.png)

The settings page is where things get interesting. Beyond the standard appearance and privacy toggles, there's a surface preference setting (pavement, mixed, or dirt) that influences recommendations at the ML model level. You can also connect Garmin, Wahoo, or RideWithGPS to export routes directly to your GPS device.

![Settings Page](/assets/posts/velosparkapp/14-settings-page.png)

## What's Next

I'm planning to add route creation tools, social features for following athletes and sharing routes, weather-aware recommendations, and segment analysis with PR predictions.

Cheers - Gordon
