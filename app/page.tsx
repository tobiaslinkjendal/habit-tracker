import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Dashboard from '@/components/Dashboard'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Load initial data server-side for fast first paint
  const [habitsRes, todosRes, logsRes] = await Promise.all([
    supabase.from('habits').select('*').order('created_at'),
    supabase.from('todos').select('*').order('created_at'),
    supabase.from('habit_logs').select('*').eq('date', new Date().toISOString().slice(0, 10)),
  ])

  return (
    <Dashboard
      userId={user.id}
      initialHabits={habitsRes.data ?? []}
      initialTodos={todosRes.data ?? []}
      initialLogs={logsRes.data ?? []}
    />
  )
}
