export interface Quote {
  id?: number;
  evaluation_id: number;
  customer_id: number;
  version_number: number;
  delivery_time: number; 
  status: 'borrador' | 'enviada' | 'aceptada' | 'rechazada';
  evaluation_discount: number; 
  total_amount: number;
  created_at?: string;
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