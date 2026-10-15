# Daily Expedition

Inspired by the game krillion.io where it tests your knowledge of niche champions from the League of Legends game against various prompts.

## Supabase setup

1. Create a Supabase project.
2. Run every SQL file in `supabase/migrations` in filename order using the Supabase SQL Editor, or link the project with the Supabase CLI and run `supabase db push`.
3. Copy `supabase-config.example.js` to `supabase-config.js`, then replace the two placeholder values with the project URL and publishable key from **Project Settings → API**. The local config file is ignored by Git.
4. Never place a secret key or service-role key in `supabase-config.js`.

Until valid configuration and three active database questions are available, the app automatically uses its local three-question pack.

## Frontend

Open `index.html` in a browser to play locally. The opening screen leads into three timed questions. Each question lasts 30 seconds; when time runs out, the current input is submitted automatically. An empty or unmatched answer earns 0 Resonance. The point values and obscurity descriptions currently come from each answer in the local pack or Supabase and can be revised later.

The landing screen displays the player's local date and that day's three-stop route. The route order changes by date and stays consistent for the day, including on replay. The best score for each date is saved in that browser's local storage. The current question pack contains three stops, so daily routes change their order; add more questions and route-selection rules if you want new trivia content every day.

See [`assets/README.md`](assets/README.md) to replace the day, dusk, and night city backgrounds or add your own pixel font. Starting an expedition fades out the menu, then moves the scenery forward, then fades in the first question. The same sequence takes the player between stops as the backgrounds change from day to dusk to night. The header's motion control can turn these animations on or off for this game and remembers the choice in this browser.
