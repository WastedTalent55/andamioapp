export interface Project {
  id: number;
  tenant_id?: number;
  quote_id: number;
  customer_id: number;
  project_name: string;
  start_date: string | null;
  estimated_end_date: string | null;
  status: 'activo' | 'pausado' | 'finalizado' | 'cancelado';
  notes: string | null;
  created_at?: string;
  // Vienen del JOIN en projectModel.js (getAllByTenant / getById)
  customer_name?: string;
  phone?: string;
  full_address?: string;
  quote_folio?: number;
  total_amount?: number;
}

// Shape que manda el formulario al crear el proyecto (POST /from-quote/:quoteId)
export interface ProjectFormData {
  project_name: string;
  start_date: string | null;
  estimated_end_date: string | null;
  notes: string | null;
}