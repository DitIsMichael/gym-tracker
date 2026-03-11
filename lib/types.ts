export interface Session {
  id: string
  name: string
  color: string
  created_at: string
}

export interface Exercise {
  id: string
  session_id: string
  name: string
  default_sets: number
  default_reps: number
  default_kg: number
  order_index: number
  muscle_groups: string | null
  created_at: string
}

export interface Schedule {
  id: string
  day_of_week: number
  session_id: string | null
  sessions?: Session
}

export interface WorkoutLog {
  id: string
  session_id: string
  date: string
  notes: string | null
  completed: boolean
  created_at: string
  sessions?: Session
}

export interface SetLog {
  id: string
  workout_log_id: string
  exercise_id: string
  exercise_name: string
  set_number: number
  kg: number | null
  reps: number | null
  created_at: string
}

export interface BodyWeightLog {
  id: string
  date: string
  weight: number
  created_at: string
}

export interface AppSettings {
  id: string
  rest_timer_seconds: number
  onboarding_completed: boolean
}

export interface PersonalRecord {
  id: string
  exercise_id: string
  kg: number
  updated_at: string
}
