export interface Evaluation {
  id?: number;
  customer_id: number; 
  address_id: number;
  requested_work: string;
  scheduled_date: string;
  evaluation_cost: number; 
  requirements?: string;
  status: 'pending' | 'completed' | 'cancelled';
  first_name: string;
  last_name: string;
  phone: string;
  address: string;
}
