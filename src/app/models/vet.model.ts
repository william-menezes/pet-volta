export type VetVisit = {
  id: string;
  pet_id: string;
  owner_id: string;
  vet_name: string;
  clinic_name: string | null;
  phone: string | null;
  visit_date: string;
  reason: string;
  diagnosis: string | null;
  prescription: string | null;
  next_visit: string | null;
  notes: string | null;
  created_at: string;
};

export type VetVisitCreateInput = Omit<VetVisit, 'id' | 'owner_id' | 'created_at'>;
export type VetVisitUpdateInput = Partial<Omit<VetVisitCreateInput, 'pet_id'>>;
