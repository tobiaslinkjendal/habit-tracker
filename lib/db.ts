import { createClient } from './supabase-client'

// ── Habits ──────────────────────────────────────────────────────────────────

export async function getHabits() {
  const sb = createClient()
  const { data } = await sb.from('habits').select('*').order('created_at')
  return data ?? []
}

export async function upsertHabit(habit: {
  id?: string; name: string; icon: string; color: string
  type: string; category: string; target?: number
  time_pref?: string; description?: string
}) {
  const sb = createClient()
  const { data } = await sb.from('habits').upsert(habit).select().single()
  return data
}

export async function deleteHabit(id: string) {
  const sb = createClient()
  await sb.from('habits').delete().eq('id', id)
}

// ── Habit Logs ───────────────────────────────────────────────────────────────

export async function getTodayLogs() {
  const sb = createClient()
  const today = new Date().toISOString().slice(0, 10)
  const { data } = await sb.from('habit_logs').select('*').eq('date', today)
  return data ?? []
}

export async function getLogsForDays(days: number) {
  const sb = createClient()
  const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10)
  const { data } = await sb.from('habit_logs').select('*').gte('date', since)
  return data ?? []
}

export async function upsertLog(habitId: string, value: number, date?: string) {
  const sb = createClient()
  const d = date ?? new Date().toISOString().slice(0, 10)
  await sb.from('habit_logs').upsert(
    { habit_id: habitId, value, date: d },
    { onConflict: 'habit_id,date' }
  )
}

// ── Todos ────────────────────────────────────────────────────────────────────

export async function getTodos() {
  const sb = createClient()
  const { data } = await sb.from('todos').select('*').order('created_at')
  return data ?? []
}

export async function addTodo(text: string) {
  const sb = createClient()
  const { data } = await sb.from('todos').insert({ text }).select().single()
  return data
}

export async function completeTodo(id: string, completed: boolean) {
  const sb = createClient()
  await sb.from('todos').update({
    completed_at: completed ? new Date().toISOString() : null
  }).eq('id', id)
}

export async function deleteTodo(id: string) {
  const sb = createClient()
  await sb.from('todos').delete().eq('id', id)
}

// ── Weight ───────────────────────────────────────────────────────────────────

export async function getWeightLogs(days = 365) {
  const sb = createClient()
  const since = new Date(Date.now() - days * 86400000).toISOString()
  const { data } = await sb.from('weight_logs')
    .select('*').gte('logged_at', since).order('logged_at')
  return data ?? []
}

export async function logWeight(weightKg: number) {
  const sb = createClient()
  await sb.from('weight_logs').insert({ weight_kg: weightKg })
}

// ── Notes ────────────────────────────────────────────────────────────────────

export async function addNote(text: string) {
  const sb = createClient()
  await sb.from('notes').insert({ text })
}
