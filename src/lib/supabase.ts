import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Trip {
  id: string;
  user_id: string;
  name: string;
  flight_cost: number;
  passengers: number;
  accommodation_cost: number;
  additional_expenses: number;
  target_date: string | null;
  start_date: string | null;
  end_date: string | null;
  monthly_saving_per_person: number | null;
  monthly_saving_total: number | null;
  funding_months_est: number | null;
  funding_date_est: string | null;
  created_at: string;
  updated_at: string;
}

export interface TripDestination {
  id: string;
  trip_id: string;
  country: string;
  city: string;
  order_index: number;
  latitude: number | null;
  longitude: number | null;
  place_id: string | null;
  formatted_address: string | null;
  created_at: string;
}

export interface TripWithDestinations extends Trip {
  destinations: TripDestination[];
}
