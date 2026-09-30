import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

type Client = SupabaseClient<Database>
const PAGE_SIZE = 500

export type PatientRecords = {
  checkins: Database['public']['Tables']['wellness_checkins']['Row'][]
  assessments: Database['public']['Tables']['wellness_assessments']['Row'][]
  appointments: Database['public']['Tables']['appointment_requests']['Row'][]
  satisfaction: Database['public']['Tables']['appointment_satisfaction']['Row'][]
}

export const emptyPatientRecords = (): PatientRecords => ({
  checkins: [],
  assessments: [],
  appointments: [],
  satisfaction: [],
})

export async function fetchPatientRecords(client: Client, userId: string): Promise<PatientRecords> {
  const checkins: PatientRecords['checkins'] = []
  const assessments: PatientRecords['assessments'] = []
  const appointments: PatientRecords['appointments'] = []
  const satisfaction: PatientRecords['satisfaction'] = []

  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await client
      .from('wellness_checkins')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1)
    if (error) throw error
    checkins.push(...data)
    if (data.length < PAGE_SIZE) break
  }

  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await client
      .from('wellness_assessments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1)
    if (error) throw error
    assessments.push(...data)
    if (data.length < PAGE_SIZE) break
  }

  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await client
      .from('appointment_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1)
    if (error) throw error
    appointments.push(...data)
    if (data.length < PAGE_SIZE) break
  }

  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await client
      .from('appointment_satisfaction')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1)
    if (error) throw error
    satisfaction.push(...data)
    if (data.length < PAGE_SIZE) break
  }

  return {
    checkins,
    assessments,
    appointments,
    satisfaction,
  }
}

export async function deletePatientRecords(client: Client, userId: string): Promise<void> {
  const [checkins, assessments, appointments, satisfaction] = await Promise.all([
    client.from('wellness_checkins').delete().eq('user_id', userId),
    client.from('wellness_assessments').delete().eq('user_id', userId),
    client.from('appointment_requests').delete().eq('user_id', userId),
    client.from('appointment_satisfaction').delete().eq('user_id', userId),
  ])

  if (checkins.error) throw checkins.error
  if (assessments.error) throw assessments.error
  if (appointments.error) throw appointments.error
  if (satisfaction.error) throw satisfaction.error
}
