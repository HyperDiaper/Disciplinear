'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

// ─── Create Habit ────────────────────────────────────────────────────────────
export async function createHabit(data: {
  name: string;
  description?: string;
  emoji?: string;
  type: 'task' | 'amount' | 'timer';
  mode: 'build' | 'quit';
  color: string;
  frequency: string[];      // ['mon','tue',…]  | ['daily']
  target_value?: number;
  unit?: string;
  start_date?: string;
  end_date?: string;
}) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase.from('habits').insert({
    user_id: user.id,
    ...data,
    frequency: JSON.stringify(data.frequency),
  });

  if (error) { console.error(error); return { error: error.message }; }
  revalidatePath('/dashboard');
  return { success: true };
}

// ─── Update Habit ────────────────────────────────────────────────────────────
export async function updateHabit(id: string, data: Partial<{
  name: string;
  description: string;
  emoji: string;
  type: string;
  mode: string;
  color: string;
  frequency: string[];
  target_value: number;
  unit: string;
  start_date: string;
  end_date: string;
}>) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const payload = { ...data };
  if (payload.frequency) {
    (payload as any).frequency = JSON.stringify(payload.frequency);
  }

  const { error } = await supabase.from('habits').update(payload).eq('id', id).eq('user_id', user.id);
  if (error) return { error: error.message };
  revalidatePath('/dashboard');
  return { success: true };
}

// ─── Delete Habit ─────────────────────────────────────────────────────────────
export async function deleteHabit(habitId: string) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  await supabase.from('habits').delete().eq('id', habitId).eq('user_id', user.id);
  revalidatePath('/dashboard');
  return { success: true };
}

// ─── Toggle Habit Log ─────────────────────────────────────────────────────────
export async function toggleHabitLog(habitId: string, logDate: string, isCompleted: boolean) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  if (isCompleted) {
    const { error } = await supabase.from('habit_logs').upsert({
      habit_id: habitId,
      user_id: user.id,
      log_date: logDate,
      is_completed: true,
      value: 1,
    }, { onConflict: 'habit_id,log_date' });
    if (error) { console.error(error); return { error: error.message }; }
  } else {
    const { error } = await supabase.from('habit_logs').delete().match({ habit_id: habitId, log_date: logDate, user_id: user.id });
    if (error) { console.error(error); return { error: error.message }; }
  }

  revalidatePath('/dashboard');
  return { success: true };
}

// ─── Adjust Habit Log Value ───────────────────────────────────────────────────
export async function adjustHabitLogValue(habitId: string, logDate: string, delta: number, targetValue: number) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: log, error: fetchError } = await supabase.from('habit_logs')
    .select('value, is_completed')
    .match({ habit_id: habitId, log_date: logDate, user_id: user.id })
    .single();

  // If error is not a 406 (Postgres Code PGRST116: no rows returned), log the error.
  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error('Fetch log error:', fetchError);
  }

  const currentValue = Number(log?.value) || 0;
  const newValue = Math.max(0, currentValue + delta);
  const isCompleted = newValue >= targetValue;

  if (newValue === 0 && !isCompleted) {
    const { error } = await supabase.from('habit_logs').delete().match({ habit_id: habitId, log_date: logDate, user_id: user.id });
    if (error) { console.error(error); return { error: error.message }; }
  } else {
    const { error } = await supabase.from('habit_logs').upsert({
      habit_id: habitId,
      user_id: user.id,
      log_date: logDate,
      is_completed: isCompleted,
      value: newValue,
    }, { onConflict: 'habit_id,log_date' });
    if (error) { console.error(error); return { error: error.message }; }
  }

  revalidatePath('/dashboard');
  return { success: true };
}

// ─── Save Settings ────────────────────────────────────────────────────────────
export async function saveSettings(settings: {
  theme?: string;
  bg_image_url?: string;
  bg_blur?: number;
  bg_opacity?: number;
  display_name?: string;
}) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase.from('user_settings').upsert({
    user_id: user.id,
    ...settings,
  }, { onConflict: 'user_id' });

  if (error) return { error: error.message };
  revalidatePath('/dashboard', 'layout');
  return { success: true };
}
