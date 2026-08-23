<template>
  <div class="page-wrapper">
    <SiteHeader />
    <SiteNav />
    <div class="wide-container main">
      <slot />
    </div>
    <SiteFooter />
    <ShareQrTrigger />
  </div>
</template>

<style scoped>
/* A touch wider than the global .container (800px) for the two-column shop
   detail layout, without going full-bleed. */
.wide-container {
  width: 100%;
  max-width: 1000px;
  margin: 20px auto;
  padding: 0 20px;
  box-sizing: border-box;
}
</style>
