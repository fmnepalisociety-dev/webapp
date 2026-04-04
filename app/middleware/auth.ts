export default defineNuxtRouteMiddleware(async (to) => {
  const { user, mustChangePassword, init } = useAuth();
  await init();

  if (!user.value && to.path !== '/admin/login') {
    return navigateTo('/admin/login');
  }

  if (user.value && mustChangePassword.value && to.path !== '/admin/change-password') {
    return navigateTo('/admin/change-password');
  }
});
