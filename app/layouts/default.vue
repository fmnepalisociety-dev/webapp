<template>
  <div class="page-wrapper">
    <SiteHeader/>
    <SiteNav/>
    <div class="container main">
      <slot/>
    </div>
    <SiteFooter/>
    <ShareQrTrigger/>
  </div>
</template>
