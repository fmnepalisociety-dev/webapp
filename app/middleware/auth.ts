export default defineNuxtRouteMiddleware(async (to) => {
  const { user, init } = useAuth();
  await init();

  if (!user.value && to.path !== '/admin/login') {
    return navigateTo('/admin/login');
  }
});
