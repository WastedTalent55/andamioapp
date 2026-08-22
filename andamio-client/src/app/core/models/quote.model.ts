export interface Quote {
  id?: number;
  quote_id?: number;
  quote_folio?: number;
  evaluation_id: number | null;
  customer_id: number;
  version_number: number;
  delivery_time: number; 
  status: 'borrador' | 'enviada' | 'aceptada' | 'rechazada';
  evaluation_discount: number; 
  total_amount: number;
  root_quote_id?: number | null;
  is_current?: boolean | number;
  created_at?: string;
  customer_name?: string; 
  phone?: string;
  full_address?: string;
}

export interface QuoteVersionHistoryEntry {
  quote_id: number;
  version_number: number;
  status: 'borrador' | 'enviada' | 'aceptada' | 'rechazada';
  total_amount: number;
  is_current: boolean | number;
  created_at: string;
}

export interface QuoteItem {
  id?: number;
  quote_id: number;
  type: 'mano_de_obra' | 'material'; 
  description: string;
  unit_price: number;
  quantity: number;
  unit: string;
  total_price: number;
}