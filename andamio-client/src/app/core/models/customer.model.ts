export interface Customer {
  id?: number;
  first_name: string;
  last_name: string;
  phone: string;
  full_address?: string;
  address_id?: number;
  place_id?: string;
  latitude?: number | null;
  longitude?: number | null;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  created_at?: string;
}