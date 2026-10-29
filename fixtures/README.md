# Recorded SerpApi responses

Committed on purpose. These are what `SERPAPI_MODE=fixture` reads, which is every dev
server, every probe and every page load in development — so building the product costs
nothing against the 250-a-month budget.

They are written by `npm run warm -- --live --limit N`, never by hand. A hand-written
fixture proves the code can parse a shape we invented, which is the one thing not worth
knowing. Account-tied fields (`search_metadata`) are stripped on the way in.

Empty until the first live run.
