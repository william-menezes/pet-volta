export type ReminderType = 'vaccination' | 'medication' | 'consultation' | 'other';
export type RepeatInterval = 'daily' | 'weekly' | 'monthly' | 'yearly';

export type Reminder = {
  id: string;
  pet_id: string;
  owner_id: string;
  title: string;
  type: ReminderType;
  due_date: string;
  repeat_interval: RepeatInterval | null;
  notes: string | null;
  done: boolean;
  done_at: string | null;
  created_at: string;
};

export type ReminderCreateInput = Omit<Reminder, 'id' | 'owner_id' | 'done' | 'done_at' | 'created_at'>;

export function reminderTypeLabel(type: ReminderType): string {
  switch (type) {
    case 'vaccination':  return '💉 Vacinação';
    case 'medication':   return '💊 Medicação';
    case 'consultation': return '🏥 Consulta';
    case 'other':        return '📋 Outro';
  }
}

export function reminderTypeIcon(type: ReminderType): string {
  switch (type) {
    case 'vaccination':  return '💉';
    case 'medication':   return '💊';
    case 'consultation': return '🏥';
    case 'other':        return '📋';
  }
}
