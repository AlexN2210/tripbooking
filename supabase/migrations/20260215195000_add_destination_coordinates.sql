-- Add geocoding fields to trip destinations
-- Allows displaying a map with markers for each step.

ALTER TABLE IF EXISTS trip_destinations
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision,
  ADD COLUMN IF NOT EXISTS place_id text,
  ADD COLUMN IF NOT EXISTS formatted_address text;

-- Basic safety constraints (optional but helpful)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'trip_destinations_latitude_range'
  ) THEN
    ALTER TABLE trip_destinations
      ADD CONSTRAINT trip_destinations_latitude_range
      CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'trip_destinations_longitude_range'
  ) THEN
    ALTER TABLE trip_destinations
      ADD CONSTRAINT trip_destinations_longitude_range
      CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180));
  END IF;
END $$;

