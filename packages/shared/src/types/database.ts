export type Profile = {
  id: string;
  first_name: string;
  last_name: string;
  preferred_language: string;
  hospital_phone: string | null;
  created_at: string;
  updated_at: string;
};

export type HealthNote = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  action_items: string[];
  created_at: string;
  updated_at: string;
};

export type Appointment = {
  id: string;
  user_id: string;
  title: string;
  provider_name: string | null;
  location: string | null;
  date: string;
  time: string | null;
  notes: string | null;
  status: "upcoming" | "completed" | "cancelled";
  created_at: string;
  updated_at: string;
};

export type Document = {
  id: string;
  user_id: string;
  title: string;
  summary: string;
  image_url: string;
  created_at: string;
};

export type Session = {
  id: string;
  user_id: string;
  title: string;
  transcript: string | null;
  summary: string | null;
  key_topics: string[];
  action_items: string[];
  created_at: string;
};
