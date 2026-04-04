<template>
  <div class="login-wrapper">
    <div class="login-card">
      <h1 class="login-title">Set Your Password</h1>

      <div v-if="!ready && !errorMsg" class="login-subtitle">Verifying invite link...</div>

      <div v-else-if="!ready && errorMsg" style="text-align: center;">
        <div class="login-error">{{ errorMsg }}</div>
        <NuxtLink to="/admin/login" class="login-link">Go to login</NuxtLink>
      </div>

      <form v-else @submit.prevent="handleSetPassword">
        <p class="login-subtitle">Welcome! Please set a password for your admin account.</p>

        <div class="login-field">
          <label for="password">New Password</label>
          <input id="password" v-model="password" type="password" required minlength="8"
            autocomplete="new-password" />
        </div>

        <div class="login-field">
          <label for="confirm">Confirm Password</label>
          <input id="confirm" v-model="confirm" type="password" required minlength="8"
            autocomplete="new-password" />
        </div>

        <div v-if="errorMsg" class="login-error">{{ errorMsg }}</div>
        <div v-if="success" class="login-success">Password set! Redirecting to admin...</div>

        <button type="submit" :disabled="submitting || success" class="login-btn">
          {{ submitting ? 'Setting password...' : 'Set Password' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false });

const { $supabase } = useNuxtApp();

const password = ref('');
const confirm = ref('');
const errorMsg = ref('');
const submitting = ref(false);
const success = ref(false);
const ready = ref(false);

// Exchange the token from the URL hash for a session
onMounted(async () => {
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');

  if (accessToken && refreshToken) {
    const { error } = await $supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) {
      errorMsg.value = 'Invalid or expired invite link. Please request a new invitation.';
    } else {
      ready.value = true;
    }
  } else {
    // Maybe already has a session (e.g. page refresh)
    const { data } = await $supabase.auth.getSession();
    if (data.session) {
      ready.value = true;
    } else {
      errorMsg.value = 'Invalid invite link. Please request a new invitation.';
    }
  }
});

async function handleSetPassword() {
  errorMsg.value = '';

  if (password.value.length < 8) {
    errorMsg.value = 'Password must be at least 8 characters.';
    return;
  }

  if (password.value !== confirm.value) {
    errorMsg.value = 'Passwords do not match.';
    return;
  }

  submitting.value = true;
  try {
    const { error } = await $supabase.auth.updateUser({ password: password.value });
    if (error) throw error;
    success.value = true;
    setTimeout(() => navigateTo('/admin'), 1500);
  } catch (e: any) {
    errorMsg.value = e.message || 'Failed to set password. The link may have expired.';
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.login-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f1f5f9;
}

.login-card {
  background: white;
  padding: 2.5rem 2rem;
  border-radius: 0.75rem;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  width: 100%;
  max-width: 380px;
}

.login-title {
  text-align: center;
  font-size: 1.5rem;
  color: #1e293b;
  margin: 0 0 0.5rem;
}

.login-subtitle {
  text-align: center;
  font-size: 0.9rem;
  color: #64748b;
  margin: 0 0 1.5rem;
}

.login-field {
  margin-bottom: 1rem;
}

.login-field label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: #475569;
  margin-bottom: 0.3rem;
}

.login-field input {
  width: 100%;
  padding: 0.6rem 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 0.4rem;
  font-size: 0.95rem;
  box-sizing: border-box;
}

.login-field input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.login-error {
  color: #dc2626;
  font-size: 0.85rem;
  margin-bottom: 0.75rem;
  text-align: center;
}

.login-success {
  color: #16a34a;
  font-size: 0.85rem;
  margin-bottom: 0.75rem;
  text-align: center;
}

.login-btn {
  width: 100%;
  padding: 0.7rem;
  background: #0033a0;
  color: white;
  border: none;
  border-radius: 0.4rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.login-btn:hover:not(:disabled) {
  background: #002080;
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-link {
  color: #2563eb;
  font-size: 0.9rem;
  text-decoration: none;
}

.login-link:hover {
  text-decoration: underline;
}
</style>
