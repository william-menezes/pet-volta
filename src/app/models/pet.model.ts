export type PetSpecies = 'dog' | 'cat' | 'other';
export type PetSize = 'small' | 'medium' | 'large';
export type PetStatus = 'safe' | 'lost';

export type PetPhoto = {
  url: string;
  path: string;
};

export type Pet = {
  id: string;
  owner_id: string;
  name: string;
  public_slug: string;
  species: PetSpecies;
  breed: string | null;
  size: PetSize | null;
  birth_date: string | null;
  color: string | null;
  microchip_id: string | null;
  temperament: string | null;
  medical_notes: string | null;
  emergency_visible: boolean;
  status: PetStatus;
  lost_since: string | null;
  reward_amount_cents: number;
  lost_description: string | null;
  max_photos: number;
  photos: PetPhoto[];
  created_at: string;
  updated_at: string;
};

export type PetCreateInput = Omit<
  Pet,
  | 'id'
  | 'owner_id'
  | 'public_slug'
  | 'photos'
  | 'created_at'
  | 'updated_at'
  | 'reward_amount_cents'
  | 'lost_description'
  | 'lost_since'
  | 'status'
  | 'max_photos'
> & {
  photos?: File[];
};

export type PetUpdateInput = Partial<
  Omit<PetCreateInput, 'photos'> & {
    photos?: File[];
  }
>;

