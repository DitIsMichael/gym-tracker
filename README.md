# GymTrack

Persoonlijke gym tracking app gebouwd met Next.js 14, Supabase en Tailwind CSS.

## Setup

### 1. Supabase project aanmaken

1. Ga naar [supabase.com](https://supabase.com) en maak een nieuw project aan.
2. Ga naar de **SQL Editor** in je Supabase dashboard.
3. Kopieer de inhoud van `supabase/schema.sql` en voer het uit in de SQL editor.

### 2. Auth gebruiker aanmaken

1. Ga in Supabase naar **Authentication > Users**.
2. Klik op **Add user** en maak een gebruiker aan met e-mail en wachtwoord.
3. Dit is het account waarmee je inlogt in de app.

### 3. Environment variables instellen

1. Kopieer het voorbeeld bestand:
   ```bash
   cp .env.local.example .env.local
   ```
2. Open `.env.local` en vul de waarden in:
   - `NEXT_PUBLIC_SUPABASE_URL` — te vinden in Supabase onder **Project Settings > API > Project URL**
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — te vinden onder **Project Settings > API > anon public**

### 4. Dependencies installeren

```bash
npm install
```

### 5. Lokaal draaien

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in je browser.

### 6. Eerste gebruik

1. Log in met het account dat je hebt aangemaakt in Supabase Auth.
2. Je wordt doorgestuurd naar onboarding om je trainingsschema in te stellen.
3. Maak eerst sessies aan (bijv. "Upper body", "Leg day") via de Sessies pagina.
4. Wijs sessies toe aan dagen van de week.
5. Start met tracken via de Agenda pagina.

## Deployen naar Vercel

1. Push de code naar een GitHub repository.
2. Ga naar [vercel.com](https://vercel.com) en importeer je repository.
3. Voeg de environment variables toe in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Klik op **Deploy**.

## Functionaliteiten

- **Agenda** — Weekoverzicht met geplande trainingen, navigeer tussen weken
- **Sessies** — Beheer trainingstypen en oefeningen met standaard sets/reps/kg
- **Workout** — Live training bijhouden met rust timer en referentie naar vorige sessie
- **Progressie** — Overzicht van progressie per oefening (week/maand/jaar) en lichaamsgewicht
- **Profiel** — Account info, schema herinstellen en uitloggen

## Tech Stack

- [Next.js 14](https://nextjs.org/) — App Router
- [Supabase](https://supabase.com/) — Auth + database
- [Tailwind CSS](https://tailwindcss.com/) — Styling
- [TypeScript](https://www.typescriptlang.org/)
