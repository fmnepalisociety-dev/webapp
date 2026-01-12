<template>
  <nav class="main-nav">
    <ul class="nav-list">
      <!-- Home -->
      <li>
        <NuxtLink to="/">Home</NuxtLink>
      </li>

      <!-- Activities -->
      <li class="has-dropdown">
        <span class="nav-parent">Activities</span>
        <ul class="dropdown">
          <li>
            <NuxtLink to="/events">Events</NuxtLink>
          </li>
          <li>
            <NuxtLink to="/events/upcoming">Upcoming Events</NuxtLink>
          </li>
          <li>
            <NuxtLink to="/events/past">Past Events</NuxtLink>
          </li>
        </ul>
      </li>

      <!-- Community -->
      <li class="has-dropdown">
        <span class="nav-parent">Community</span>
        <ul class="dropdown">
          <li>
            <NuxtLink to="/members">Members</NuxtLink>
          </li>
          <li>
            <NuxtLink to="/committee">Committee</NuxtLink>
          </li>
        </ul>
      </li>

      <!-- About -->
      <li class="has-dropdown">
        <span class="nav-parent">About Us</span>
        <ul class="dropdown">
          <li>
            <NuxtLink to="/about">About</NuxtLink>
          </li>
          <li>
            <NuxtLink to="/about/president-message">President's Message</NuxtLink>
          </li>
          <li>
            <NuxtLink to="/about/origin-story">Origin Story</NuxtLink>
          </li>
          <li>
            <NuxtLink to="/contacts">Contact</NuxtLink>
          </li>
        </ul>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
/* CSS-only dropdowns, no JS needed */
</script>

<style scoped>
.main-nav {
  position: sticky;
  top: 0;
  z-index: 1000;
  background: linear-gradient(
    90deg,
    rgba(28, 51, 130, 0.95),
    rgba(163, 20, 50, 0.90)
  );
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.25);
  border-top: 1px solid rgba(255, 255, 255, 0.15);
}

.main-nav ul {
  list-style: none;
  margin: 0;
  padding: 8px 0;
  display: flex;
  justify-content: center;
  gap: 24px;
}

.main-nav a,
.nav-parent {
  color: #ffffff;
  text-decoration: none;
  font-weight: 600;
  letter-spacing: 0.6px;
  padding: 8px 16px;
  border-radius: 999px;
  transition: background 0.25s ease, color 0.25s ease;
  cursor: pointer;
}

.main-nav a:hover,
.nav-parent:hover {
  background: rgba(255, 255, 255, 0.18);
  color: #ffd700;
}

/* =========================
   DROPDOWN EXTENSIONS
   ========================= */
.has-dropdown {
  position: relative;
}

/* Dropdown menu */
.dropdown {
  position: absolute;
  top: calc(100% + 5px);
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(
    180deg,
    rgba(28, 51, 130, 0.97),
    rgba(163, 20, 50, 0.95)
  );
  border-radius: 12px;
  padding: 8px 0;
  min-width: 180px;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.35);
  z-index: 1000;

  /* Hidden state */
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity 0.1s ease,
  visibility 0s linear 1s; /* delay closing */
}

/* Show dropdown */
.has-dropdown:hover > .dropdown {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;

  /* Cancel delay on open */
  transition-delay: 0s;
}

/* Dropdown items */
.dropdown li {
  padding: 4px 12px;
  text-align: center;
}

.dropdown a {
  display: block;
  padding: 8px 12px;
  border-radius: 999px;
  font-size: 0.9rem;
}

/* Show dropdown on hover */
.has-dropdown:hover .dropdown {
  display: block;
}

/* =========================
   MOBILE FRIENDLY
   ========================= */
@media (max-width: 768px) {
  .main-nav ul {
    flex-direction: row;
    gap: 1px;
  }

  .main-nav a,
  .nav-parent {
    padding: 8px 8px;
    border-radius: 999px;
  }
}
</style>
