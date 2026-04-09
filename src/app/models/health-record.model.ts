export type HealthRecordType = 'vaccination' | 'consultation' | 'medication' | 'exam';

export interface HealthRecord {
  id: string;
  pet_id: string;
  type: HealthRecordType;
  title: string;
  date: string;           // ISO date string
  next_date: string | null;
  veterinarian: string | null;
  notes: string | null;
  attachment_url: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export type HealthRecordCreateInput = Omit<HealthRecord, 'id' | 'created_at'>;

export function healthRecordTypeLabel(type: HealthRecordType): string {
  switch (type) {
    case 'vaccination':  return '💉 Vacinação';
    case 'consultation': return '🩺 Consulta';
    case 'medication':   return '💊 Medicação';
    case 'exam':         return '🔬 Exame';
  }
}
