<template>
  <div class="page-wrapper">
    <NotificationBanners position="page_top"/>
    <SiteHeader/>
    <NotificationBanners position="above_nav"/>
    <SiteNav/>
    <NotificationBanners position="below_nav"/>
    <div class="container main">
      <slot/>
    </div>
    <SiteFooter/>
    <ShareQrTrigger/>
  </div>
</template>
