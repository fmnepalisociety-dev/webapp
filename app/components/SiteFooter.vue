<template>

  <footer>
    <div class="footer-container">
      <!-- Left: Links -->
      <section class="footer-left" id="links">
        <div class="footer-link-row">
          <i class="fa-solid fa-globe"></i>
          <a href="https://fmnepali.org" target="_blank">fmnepali.org</a>
        </div>
        <div class="footer-link-row">
          <i class="fa-solid fa-envelope"></i>
          <a href="mailto:fmnepalisociety@gmail.com">fmnepalisociety@gmail.com</a>
        </div>
        <div class="footer-link-row">
          <i class="fa-brands fa-facebook"></i>
          <a href="https://www.facebook.com/profile.php?id=61585646061770" target="_blank">
            NSFM - Nepali Society (Facebook)
          </a>
        </div>
      </section>

      <div class="footer-right">
        <img class="footer-logo" src="/logo.png" />
        <div class="footer-copy">
          © {{ new Date().getFullYear() }} Nepali Society of Fargo Moorhead
        </div>
      </div>
    </div>
  </footer>
</template>
