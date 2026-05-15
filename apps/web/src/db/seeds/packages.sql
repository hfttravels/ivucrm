-- Sample packages for testing Agent #27 (Group Fill Rate Monitor)
-- Run this in Supabase SQL Editor after running the main migrations

INSERT INTO packages (
  slug,
  destination,
  title,
  price_min,
  price_max,
  seats_total,
  seats_filled,
  departure_date,
  return_date,
  status,
  highlights,
  inclusions,
  exclusions
) VALUES
(
  'winter-spiti-2025-feb',
  'Spiti Valley',
  'Winter Spiti — The Frozen Valley',
  19500,
  20500,
  12,
  9,
  '2025-02-15 06:00:00+00',
  '2025-02-22 18:00:00+00',
  'active',
  '["Frozen Chandratal Lake", "Kaza Monastery", "Pin Valley", "Snow leopard territory"]'::jsonb,
  '["Transport", "Accommodation", "Breakfast & Dinner", "Permits"]'::jsonb,
  '["Lunch", "Personal expenses", "Travel insurance"]'::jsonb
),
(
  'thailand-full-moon-party-march',
  'Thailand',
  'Thailand Full Moon Party — Koh Phangan',
  39650,
  70000,
  15,
  13,
  '2025-03-10 10:00:00+00',
  '2025-03-17 22:00:00+00',
  'filling_fast',
  '["Full Moon Party", "Island hopping", "Bangkok nightlife", "Phi Phi Islands"]'::jsonb,
  '["Flights", "Hotels", "Party passes", "Island tours"]'::jsonb,
  '["Meals", "Alcohol", "Personal expenses"]'::jsonb
),
(
  'manali-kasol-jibhi-april',
  'Himachal Pradesh',
  'Manali-Kasol-Jibhi Circuit',
  12500,
  14500,
  12,
  4,
  '2025-04-05 07:00:00+00',
  '2025-04-11 20:00:00+00',
  'active',
  '["Tosh Valley", "Kheerganga trek", "Jibhi waterfalls", "Old Manali cafes"]'::jsonb,
  '["Transport", "Homestays", "Breakfast", "Trek guide"]'::jsonb,
  '["Lunch & Dinner", "Adventure activities", "Personal expenses"]'::jsonb
)

ON CONFLICT (slug) DO UPDATE SET
  seats_filled = EXCLUDED.seats_filled,
  status = EXCLUDED.status,
  updated_at = NOW();
