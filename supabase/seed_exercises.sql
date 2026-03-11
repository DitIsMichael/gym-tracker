-- Migration: add muscle_groups column
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS muscle_groups TEXT;

-- Seed Upper Body exercises
INSERT INTO exercises (session_id, name, default_sets, default_reps, default_kg, order_index, muscle_groups)
SELECT s.id, e.name, e.sets, e.reps, e.kg, e.ord, e.muscles
FROM sessions s
CROSS JOIN (VALUES
  ('Latt Pull Down',          4, 10, 50, 0, 'Rug & Biceps'),
  ('Incline Dumbbell Press',  4, 10, 20, 1, 'Borst, Schouders & Triceps'),
  ('Seated Row',              4, 10, 50, 2, 'Rug & Biceps'),
  ('Shoulder Press',          3, 12, 20, 3, 'Schouders & Triceps'),
  ('Bicep Curl',              3, 12, 10, 4, 'Biceps'),
  ('Tricep Pull',             3, 12, 15, 5, 'Triceps')
) AS e(name, sets, reps, kg, ord, muscles)
WHERE s.name = 'Upper Body'
  AND NOT EXISTS (
    SELECT 1 FROM exercises ex WHERE ex.session_id = s.id AND ex.name = e.name
  );

-- Seed Leg Day exercises
INSERT INTO exercises (session_id, name, default_sets, default_reps, default_kg, order_index, muscle_groups)
SELECT s.id, e.name, e.sets, e.reps, e.kg, e.ord, e.muscles
FROM sessions s
CROSS JOIN (VALUES
  ('Kuiten',         4, 15, 40, 0, 'Kuiten'),
  ('Leg Press',      4, 10, 80, 1, 'Quadriceps, Hamstrings & Billen'),
  ('Leg Extension',  3, 12, 40, 2, 'Quadriceps'),
  ('Leg Curl',       3, 12, 35, 3, 'Hamstrings')
) AS e(name, sets, reps, kg, ord, muscles)
WHERE s.name = 'Leg Day'
  AND NOT EXISTS (
    SELECT 1 FROM exercises ex WHERE ex.session_id = s.id AND ex.name = e.name
  );
