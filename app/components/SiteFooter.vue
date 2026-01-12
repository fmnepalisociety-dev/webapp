<template>

  <footer>
    <div class="footer-container">
      <!-- Left: Links -->
      <section class="footer-left" id="links">
        <div class="footer-link-row">
          <FontAwesomeIcon icon="globe"/>
          <a href="https://fmnepali.org" target="_blank">fmnepali.org</a>
        </div>
        <div class="footer-link-row">
          <FontAwesomeIcon icon="envelope"/>
          <a href="mailto:fmnepalisociety@gmail.com">fmnepalisociety@gmail.com</a>
        </div>
        <div class="footer-link-row">
          <FontAwesomeIcon :icon="['fab','facebook']"/>
          <a href="https://www.facebook.com/profile.php?id=61585646061770" target="_blank">
            NSFM - Nepali Society (Facebook)
          </a>
        </div>
      </section>

      <div class="footer-right">
        <img class="footer-logo" src="/logo.png" alt="NSFM"/>
        <div class="footer-link-row footer-bottom-links">
          <NuxtLink to="/about" class="footer-links">About</NuxtLink>
          <NuxtLink to="/contacts" class="footer-links">Contact</NuxtLink>
          <NuxtLink to="/events" class="footer-links">Events</NuxtLink>
        </div>
        <div class="footer-copy">
          © {{ new Date().getFullYear() }} Nepali Society of Fargo Moorhead
        </div>
      </div>
    </div>
  </footer>
</template>
<script setup lang="ts">
import {FontAwesomeIcon} from "@fortawesome/vue-fontawesome";
</script>
<style scoped>

.footer-container {
  max-width: 900px;
  margin: 0 auto;

  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 30px;
}

/* Left links */
.footer-left {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.footer-link-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.footer-link-row i {
  width: 20px;
  text-align: center;
  font-size: 1.1em;
}

.footer-link-row:hover i {
  color: #ffd700;
}

footer a {
  color: white;
  text-decoration: underline;
}

/* Right side */
.footer-right {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.footer-logo {
  height: 90px;
}

.footer-copy {
  font-size: 0.9em;
  opacity: 0.9;
}

.footer-link-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.footer-bottom-links {
  gap: 1.5rem;
}

.footer-links {
  text-decoration: none;
}

.footer-links:hover {
  text-decoration: underline;
}

@media (max-width: 512px) {
  .footer-container {
    flex-direction: column;
    align-items: center;
  }
}
</style>