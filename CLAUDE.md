# Stonk — Fitness Tracker

## Stack
- React + Vite + TypeScript + Tailwind + shadcn/ui
- supabase-js (auth + db)
- TanStack Query (data fetching)
- recharts (graphiques)
- react-router-dom (routing)

## Supabase
- Credentials dans .env.local (VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY)
- Tables : exercises, workout_templates, template_exercises,
           workouts, workout_sets, body_metrics
- Pas de RLS — app solo

## Architecture — feature-first stricte
src/features/{feature}/components|hooks|api|types|index.ts
Chaque feature est 100% autonome — son propre client Supabase, ses propres types.
Règle absolue : zéro import entre features.

## Features
- [x] Setup
- [ ] Auth
- [ ] Workout tracker
- [ ] Programme builder
- [ ] Progression
- [ ] Body metrics
- [x] PWA

## Conventions
- set_type : 'normal' | 'warmup' | 'dropset' | 'failure'
- Poids en kg, mensurations en cm
- Timestamps en UTC
- Langue de l'UI : français

## Feature en cours
Setup
