-- Sessions (training templates)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT DEFAULT '#f97316',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exercises (per session)
CREATE TABLE IF NOT EXISTS exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  default_sets INT DEFAULT 3,
  default_reps INT DEFAULT 10,
  default_kg DECIMAL(5,2) DEFAULT 0,
  order_index INT DEFAULT 0,
  muscle_groups TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Repeating weekly schedule (day 0=Mon, 1=Tue, ... 6=Sun)
CREATE TABLE IF NOT EXISTS schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week INT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  UNIQUE(day_of_week)
);

-- Weekly overrides (specific date overrides)
CREATE TABLE IF NOT EXISTS schedule_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL
);

-- Workout logs (completed or in-progress workouts)
CREATE TABLE IF NOT EXISTS workout_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id),
  date DATE NOT NULL,
  notes TEXT,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Set logs (individual sets during a workout)
CREATE TABLE IF NOT EXISTS set_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_log_id UUID REFERENCES workout_logs(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id),
  exercise_name TEXT NOT NULL,
  set_number INT NOT NULL,
  kg DECIMAL(5,2),
  reps INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Body weight logs
CREATE TABLE IF NOT EXISTS body_weight_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  weight DECIMAL(4,1) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- App settings
CREATE TABLE IF NOT EXISTS app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rest_timer_seconds INT DEFAULT 60,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Personal records (PR per exercise)
CREATE TABLE IF NOT EXISTS personal_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  kg DECIMAL(5,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(exercise_id)
);

-- Insert default settings
INSERT INTO app_settings (rest_timer_seconds, onboarding_completed)
VALUES (60, false) ON CONFLICT DO NOTHING;

-- Insert default sessions (only if no sessions exist)
INSERT INTO sessions (name, color)
SELECT * FROM (VALUES
  ('Upper Body', '#f97316'),
  ('Leg Day', '#3b82f6'),
  ('Tennis', '#22c55e'),
  ('Full Body', '#a855f7')
) AS s(name, color)
WHERE NOT EXISTS (SELECT 1 FROM sessions);
