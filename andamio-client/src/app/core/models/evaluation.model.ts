export interface Evaluation {
  id?: number;
  customer_id: number; 
  scheduled_date: string;
  evaluation_cost: number; 
  observations?: string;
  requirements?: string;
  status?: 'pendiente' | 'realizada' | 'cancelada';
}