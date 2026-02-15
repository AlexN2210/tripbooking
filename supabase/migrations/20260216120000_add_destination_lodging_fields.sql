-- Store per-step lodging details for edition & accurate recalculation

ALTER TABLE IF EXISTS trip_destinations
  ADD COLUMN IF NOT EXISTS has_lodging boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS nights integer,
  ADD COLUMN IF NOT EXISTS price_per_night decimal(10, 2);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'trip_destinations_nights_positive'
  ) THEN
    ALTER TABLE trip_destinations
      ADD CONSTRAINT trip_destinations_nights_positive
      CHECK (nights IS NULL OR nights > 0);
  END IF;
END $$;

