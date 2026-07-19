export interface Customer {
  id?: number;
  first_name: string;
  last_name: string;
  phone: string;
  full_address?: string;
  address_id?: number;
  created_at?: string;
}