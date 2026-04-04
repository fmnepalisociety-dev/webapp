<template>
  <div class="change-pw">
    <h1 class="admin-page-title">Change Password</h1>
    <p v-if="mustChangePassword" class="change-pw-notice">
      You must change your password before continuing.
    </p>

    <form class="change-pw-form" @submit.prevent="handleChange">
      <div class="change-pw-field">
        <label for="new-password">New Password</label>
        <input id="new-password" v-model="password" type="password" required minlength="8"
          autocomplete="new-password" />
      </div>

      <div class="change-pw-field">
        <label for="confirm-password">Confirm Password</label>
        <input id="confirm-password" v-model="confirmPw" type="password" required minlength="8"
          autocomplete="new-password" />
      </div>

      <div v-if="errorMsg" class="change-pw-error">{{ errorMsg }}</div>
      <div v-if="successMsg" class="change-pw-success">{{ successMsg }}</div>

      <button type="submit" :disabled="submitting" class="change-pw-btn">
        {{ submitting ? 'Updating...' : 'Update Password' }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' });

const { $supabase } = useNuxtApp();
const { mustChangePassword, clearForceReset } = useAuth();

const password = ref('');
const confirmPw = ref('');
const errorMsg = ref('');
const successMsg = ref('');
const submitting = ref(false);

async function handleChange() {
  errorMsg.value = '';
  successMsg.value = '';

  if (password.value.length < 8) {
    errorMsg.value = 'Password must be at least 8 characters.';
    return;
  }

  if (password.value !== confirmPw.value) {
    errorMsg.value = 'Passwords do not match.';
    return;
  }

  submitting.value = true;
  try {
    const { error } = await $supabase.auth.updateUser({ password: password.value });
    if (error) throw error;
    await clearForceReset();
    successMsg.value = 'Password updated successfully. Redirecting...';
    password.value = '';
    confirmPw.value = '';
    setTimeout(() => navigateTo('/admin'), 1500);
  } catch (e: any) {
    errorMsg.value = e.message || 'Failed to update password.';
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.admin-page-title {
  font-size: 1.5rem;
  color: #1e293b;
  margin: 0 0 1.5rem;
}

.change-pw-form {
  max-width: 380px;
  background: white;
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.change-pw-field {
  margin-bottom: 1rem;
}

.change-pw-field label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: #475569;
  margin-bottom: 0.3rem;
}

.change-pw-field input {
  width: 100%;
  padding: 0.6rem 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 0.4rem;
  font-size: 0.95rem;
  box-sizing: border-box;
}

.change-pw-field input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.change-pw-error {
  color: #dc2626;
  font-size: 0.85rem;
  margin-bottom: 0.75rem;
}

.change-pw-success {
  color: #16a34a;
  font-size: 0.85rem;
  margin-bottom: 0.75rem;
}

.change-pw-btn {
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

.change-pw-btn:hover:not(:disabled) {
  background: #002080;
}

.change-pw-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.change-pw-notice {
  color: #d97706;
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 1rem;
}
</style>
