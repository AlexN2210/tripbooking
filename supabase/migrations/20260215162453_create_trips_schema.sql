/*
  # Travel Budget Manager Schema

  1. New Tables
    - `trips`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `name` (text) - Trip name
      - `flight_cost` (decimal) - Round-trip flight cost
      - `passengers` (integer) - Number of passengers
      - `accommodation_cost` (decimal) - Total accommodation cost
      - `additional_expenses` (decimal) - Other expenses
      - `target_date` (date) - Target date to fund the trip
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `trip_destinations`
      - `id` (uuid, primary key)
      - `trip_id` (uuid, foreign key to trips)
      - `country` (text) - Country name
      - `city` (text) - City name
      - `order_index` (integer) - Order of the destination
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

CREATE TABLE IF NOT EXISTS trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  flight_cost decimal(10, 2) DEFAULT 0,
  passengers integer DEFAULT 1,
  accommodation_cost decimal(10, 2) DEFAULT 0,
  additional_expenses decimal(10, 2) DEFAULT 0,
  target_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS trip_destinations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
  country text NOT NULL,
  city text NOT NULL,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_destinations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trips"
  ON trips FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trips"
  ON trips FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trips"
  ON trips FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own trips"
  ON trips FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view destinations of own trips"
  ON trip_destinations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = trip_destinations.trip_id
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert destinations to own trips"
  ON trip_destinations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = trip_destinations.trip_id
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update destinations of own trips"
  ON trip_destinations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = trip_destinations.trip_id
      AND trips.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = trip_destinations.trip_id
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete destinations of own trips"
  ON trip_destinations FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = trip_destinations.trip_id
      AND trips.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS trips_user_id_idx ON trips(user_id);
CREATE INDEX IF NOT EXISTS trip_destinations_trip_id_idx ON trip_destinations(trip_id);