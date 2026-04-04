import type { User } from '@supabase/supabase-js';

const user = ref<User | null>(null);
const loading = ref(true);
const initialized = ref(false);

export function useAuth() {
  const { $supabase } = useNuxtApp();

  async function init() {
    if (initialized.value) return;
    initialized.value = true;
    loading.value = true;

    const { data } = await $supabase.auth.getSession();
    user.value = data.session?.user ?? null;

    $supabase.auth.onAuthStateChange((_event: string, session: any) => {
      user.value = session?.user ?? null;
    });

    loading.value = false;
  }

  async function login(email: string, password: string) {
    const { error } = await $supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function logout() {
    await $supabase.auth.signOut();
    user.value = null;
    navigateTo('/admin/login');
  }

  const mustChangePassword = computed(() => {
    return user.value?.user_metadata?.must_change_password === true;
  });

  async function clearForceReset() {
    await $supabase.auth.updateUser({
      data: { must_change_password: false },
    });
  }

  return { user, loading, mustChangePassword, init, login, logout, clearForceReset };
}
