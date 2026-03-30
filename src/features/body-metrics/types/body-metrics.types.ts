export type BodyMetric = {
  id: string
  user_id: string
  recorded_at: string
  weight_kg: number | null
  neck_cm: number | null
  shoulders_cm: number | null
  chest_cm: number | null
  waist_cm: number | null
  arms_left_cm: number | null
  arms_right_cm: number | null
  forearms_left_cm: number | null
  forearms_right_cm: number | null
  hips_cm: number | null
  legs_left_cm: number | null
  legs_right_cm: number | null
  calves_left_cm: number | null
  calves_right_cm: number | null
  notes: string | null
  created_at: string
}

export type BodyMetricInsert = Omit<BodyMetric, 'id' | 'user_id' | 'created_at'>
