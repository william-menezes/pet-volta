import type { PlanTier } from '@core/plan/plan.service';

export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'trialing' | null;

export type Profile = {
  id: string;
  full_name: string | null;
  phone_primary: string | null;
  phone_emergency: string | null;
  city: string | null;
  state: string | null;
  avatar_url: string | null;
  show_phone: boolean;
  plan_tier: PlanTier;
  stripe_customer_id: string | null;
  subscription_status: SubscriptionStatus;
  created_at: string;
  updated_at: string;
};

export type ProfileUpdateInput = Partial<
  Pick<Profile, 'full_name' | 'phone_primary' | 'phone_emergency' | 'city' | 'state' | 'show_phone' | 'avatar_url'>
>;
