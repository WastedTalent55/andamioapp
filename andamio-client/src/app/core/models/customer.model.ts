export interface Customer {
  id?: number;
  first_name: string;
  last_name: string;
  phone: string;
  full_address?: string;
  address_id?: number;
  // Vienen del JOIN en getById() — necesarios para prellenar el form de edición
  place_id?: string;
  latitude?: number | null;
  longitude?: number | null;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  created_at?: string;
  // 🆕 Vienen del subquery en getAllByTenant — cantidad real, no una estimación del frontend
  evaluations_count?: number;
  quotes_count?: number;
  projects_count?: number;
}