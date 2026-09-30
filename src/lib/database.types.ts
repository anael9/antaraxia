export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

type Table<Row, Insert> = {
  Row: Row
  Insert: Insert
  Update: Partial<Insert>
  Relationships: []
}

export type Database = {
  public: {
    Tables: {
      wellness_checkins: Table<
        {
          id: string
          user_id: string
          mood: number
          sleep_hours: string
          stress_level: number
          anxiety_level: number
          created_at: string
        },
        {
          id?: string
          user_id: string
          mood: number
          sleep_hours: string
          stress_level: number
          anxiety_level: number
          created_at?: string
        }
      >
      wellness_assessments: Table<
        {
          id: string
          user_id: string
          answers: Json
          score: number
          risk_level: string
          created_at: string
        },
        {
          id?: string
          user_id: string
          answers: Json
          score: number
          risk_level: string
          created_at?: string
        }
      >
      appointment_requests: Table<
        {
          id: string
          user_id: string
          name: string
          email: string
          availability: string
          message: string
          modality: string
          completed_at: string | null
          created_at: string
        },
        {
          id?: string
          user_id: string
          name: string
          email: string
          availability: string
          message?: string
          modality: string
          completed_at?: string | null
          created_at?: string
        }
      >
      appointment_satisfaction: Table<
        {
          id: string
          appointment_id: string
          user_id: string
          rating: number
          created_at: string
        },
        {
          id?: string
          appointment_id: string
          user_id: string
          rating: number
          created_at?: string
        }
      >
    }
    Views: { [_ in never]: never }
    Functions: {
      get_public_wellness_stats: {
        Args: Record<string, never>
        Returns: {
          students_attended: number
          satisfaction_percent: number | null
          satisfaction_responses: number
        }[]
      }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}
