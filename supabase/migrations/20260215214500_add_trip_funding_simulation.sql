-- Store user's funding simulation for trips without dates (or for later reference)
ALTER TABLE IF EXISTS trips
  ADD COLUMN IF NOT EXISTS monthly_saving_per_person decimal(10, 2),
  ADD COLUMN IF NOT EXISTS monthly_saving_total decimal(10, 2),
  ADD COLUMN IF NOT EXISTS funding_months_est integer,
  ADD COLUMN IF NOT EXISTS funding_date_est date;

