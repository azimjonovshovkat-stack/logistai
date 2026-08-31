export type Role = "driver" | "shipper" | "admin";
export type UserStatus = "pending" | "approved" | "rejected";
export type DriverStatus = "available" | "busy" | "day_off";
export type OrderStatus = "pending" | "accepted" | "in_transit" | "completed" | "cancelled";

export interface User {
  id: number;
  full_name: string;
  phone: string;
  role: Role;
  balance: number;
  status: UserStatus;
  created_at: string;
}

export interface DriverProfile {
  car_name: string;
  car_number: string;
  car_year: number;
  capacity_tons: number;
  car_photo_url: string;
  license_photo_url: string | null;
  rating: number;
}

export interface Me extends User {
  driver_profile: DriverProfile | null;
}

export interface DailyStatus {
  id: number;
  driver_id: number;
  date: string;
  current_location: string;
  destination_location: string;
  status: DriverStatus;
  updated_at: string;
}

export interface Order {
  id: number;
  shipper_id: number;
  shipper_name: string | null;
  shipper_phone: string | null;
  driver_id: number;
  from_location: string;
  to_location: string;
  cargo_description: string | null;
  weight_tons: number | null;
  status: OrderStatus;
  rating: number | null;
  rating_comment: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface DriverMatch {
  driver_id: number;
  full_name: string;
  phone: string;
  rating: number;
  car_name: string;
  car_number: string;
  capacity_tons: number;
  current_location: string;
  destination_location: string;
}

export interface SearchResponse {
  matches: DriverMatch[];
  subscription_active: boolean;
  parsed_query: {
    origin: string | null;
    destination: string | null;
    min_capacity_tons: number | null;
    cargo_type: string | null;
  };
  source: "ai" | "fallback_keyword";
  elapsed_ms: number;
  message: string | null;
}

export interface PendingDriver extends User {
  driver_profile: DriverProfile;
}

export interface AIConfig {
  id: number;
  provider: string;
  label: string | null;
  is_active: boolean;
  usage_count: number;
  priority: number;
  last_error: string | null;
  last_used_at: string | null;
  masked_key: string;
}

export interface Subscription {
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  days_remaining: number;
  duration_days: number;
  price_monthly: number;
}

export interface Transaction {
  id: number;
  amount: number;
  type: "refill" | "deduction";
  note: string | null;
  created_at: string;
}

export interface DriverReview {
  rating: number;
  comment: string | null;
  reviewer_name: string;
  created_at: string;
}

export interface DriverReviewsResponse {
  driver_id: number;
  full_name: string;
  rating: number;
  total_reviews: number;
  car_name: string;
  car_number: string;
  capacity_tons: number;
  reviews: DriverReview[];
}
