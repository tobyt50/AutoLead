export type LeadStatus = 'NEW' | 'CONTACTED' | 'RESPONDED' | 'IGNORED' | 'CONVERTED';

export interface Lead {
  id?: number;
  place_id: string;
  name: string;
  address?: string;
  lat?: number;
  lng?: number;
  phone?: string;
  website?: string;
  google_url?: string;
  category?: string;
  rating?: number;
  user_ratings_total?: number;
  status?: LeadStatus;
  found_at?: Date;
  raw_data?: any; // Stores the full JSON from Google
}

// Google API Interfaces
export interface GooglePlaceResult {
  place_id: string;
  name: string;
  formatted_address?: string;
  geometry?: {
    location: { lat: number; lng: number };
  };
  formatted_phone_number?: string;
  website?: string;
  url?: string; // Google Maps URL
  types?: string[];
  rating?: number;
  user_ratings_total?: number;
  business_status?: string;
}

export interface GoogleSearchResponse {
  results: GooglePlaceResult[];
  next_page_token?: string;
  status: string;
}