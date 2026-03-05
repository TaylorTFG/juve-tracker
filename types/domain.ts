export type PlayerRow = {
  id: number;
  provider_id: number;
  name: string;
  position: string | null;
  nationality: string | null;
  date_of_birth: string | null;
  shirt_number: number | null;
  contract_until: string | null;
  market_value: number | null;
  updated_at: string;
};

export type MatchRow = {
  id: number;
  provider_id: number;
  utc_date: string;
  local_date_rome: string;
  competition: string | null;
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
  status: string;
  updated_at: string;
};

export type CacheMeta = {
  key: string;
  updated_at: string;
  ttl_seconds: number;
};

export type PushSubscriptionRow = {
  id: number;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string;
};

export type PlayerStats = {
  appearances: number | null;
  goals: number | null;
  assists: number | null;
  provider: string;
  note?: string;
};

