-- Add travel dates to trips (departure/return)
ALTER TABLE IF EXISTS trips
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS end_date date;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'trips_end_date_after_start_date'
  ) THEN
    ALTER TABLE trips
      ADD CONSTRAINT trips_end_date_after_start_date
      CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date);
  END IF;
END $$;

