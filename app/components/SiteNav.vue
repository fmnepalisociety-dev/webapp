<template>
  <nav class="main-nav">
    <div class="nav-inner">
      <!-- Hamburger -->
      <div class="hamburger-container">
        <button
          class="hamburger"
          @click="toggleMenu"
          aria-label="Toggle navigation"
        >
          <span :class="{ open: isOpen }"></span>
          <span :class="{ open: isOpen }"></span>
          <span :class="{ open: isOpen }"></span>
        </button>
      </div>

      <!-- Menu -->
      <ul class="nav-list" :class="{ open: isOpen }">
        <li>
          <NuxtLink to="/" @click="closeMenu">Home</NuxtLink>
        </li>

        <li class="has-dropdown">
          <span class="nav-parent">Activities</span>
          <ul class="dropdown">
            <li>
              <NuxtLink to="/events" @click="closeMenu">Events</NuxtLink>
            </li>
            <li>
              <NuxtLink to="/events/upcoming" @click="closeMenu">Upcoming</NuxtLink>
            </li>
            <li>
              <NuxtLink to="/events/past" @click="closeMenu">Past</NuxtLink>
            </li>
          </ul>
        </li>

        <li class="has-dropdown">
          <span class="nav-parent">Community</span>
          <ul class="dropdown">
            <li>
              <NuxtLink to="/members" @click="closeMenu">Members</NuxtLink>
            </li>
            <li>
              <NuxtLink to="/committee" @click="closeMenu">Committee</NuxtLink>
            </li>
          </ul>
        </li>

        <li class="has-dropdown">
          <span class="nav-parent">About Us</span>
          <ul class="dropdown">
            <li>
              <NuxtLink to="/about" @click="closeMenu">About</NuxtLink>
            </li>
            <li>
              <NuxtLink to="/about/president-message" @click="closeMenu">President’s Message</NuxtLink>
            </li>
            <li>
              <NuxtLink to="/about/origin-story" @click="closeMenu">Origin Story</NuxtLink>
            </li>
            <li>
              <NuxtLink to="/contacts" @click="closeMenu">Contact</NuxtLink>
            </li>
          </ul>
        </li>
      </ul>
    </div>
  </nav>
</template>

<script setup lang="ts">
import {ref} from 'vue'

const isOpen = ref(false)
const toggleMenu = () => (isOpen.value = !isOpen.value)
const closeMenu = () => (isOpen.value = false)
</script>

<style scoped>
/* =========================
   BASE NAV
   ========================= */
.main-nav {
  position: sticky;
  top: 0;
  z-index: 1000;
  background: linear-gradient(
    90deg,
    rgba(28, 51, 130, 0.95),
    rgba(163, 20, 50, 0.92)
  );
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
}

.nav-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 8px 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

/* =========================
   DESKTOP MENU
   ========================= */
.nav-list {
  list-style: none;
  display: flex;
  gap: 24px;
  margin: 0;
  padding: 0;
}

.nav-list a,
.nav-parent {
  color: #fff;
  font-weight: 600;
  letter-spacing: 0.6px;
  padding: 12px 16px;
  border-radius: 999px;
  cursor: pointer;
  text-decoration: none;
  transition: background 0.25s ease, color 0.25s ease;
}

.nav-list a:hover,
.nav-parent:hover {
  background: rgba(255, 255, 255, 0.18);
  color: #ffd700;
}

/* =========================
   DROPDOWNS (DESKTOP FIXED)
   ========================= */
.has-dropdown {
  position: relative;
}

.dropdown {
  position: absolute;
  top: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%); /* fixed, centered */
  min-width: 180px;
  padding: 6px 0;
  background: linear-gradient(
    15deg,
    rgba(28, 51, 130, 0.9),
    rgba(163, 20, 50, 0.8)
  );
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  border-radius: 6px;

  opacity: 0;
  visibility: hidden;
  pointer-events: none;

  transition: opacity 0.18s ease, transform 0.18s ease, visibility 0s linear 0.25s;
}

.has-dropdown:hover > .dropdown {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
  transform: translateX(-50%) translateY(0);
  transition-delay: 0s;
}

.dropdown li {
  text-align: center;
  list-style: none;
}

.dropdown a {
  display: block;
  padding: 6px 16px;
  font-size: 0.9rem;
  text-decoration: none;
  color: #fff;
}

.dropdown a:hover {
  background: rgba(255, 215, 0, 0.2);
  color: #ffd700;
}

/* =========================
   HAMBURGER
   ========================= */
.hamburger {
  display: none;
  position: absolute;
  right: 16px;
  top: 12px;
  background: none;
  border: none;
  cursor: pointer;
  z-index: 1100;
}

.hamburger span {
  display: block;
  width: 28px;
  height: 3px;
  margin: 5px 0;
  background: white;
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.hamburger span.open:nth-child(1) {
  transform: translateY(8px) rotate(45deg);
}

.hamburger span.open:nth-child(2) {
  opacity: 0;
}

.hamburger span.open:nth-child(3) {
  transform: translateY(-8px) rotate(-45deg);
}

/* =========================
   MOBILE MENU FIXED SUBMENUS
   ========================= */
@media (max-width: 768px) {
  /* Make the main nav stack from top */
  .nav-inner {
    padding: 12px 16px; /* button height included */
    position: relative;
  }

  .hamburger-container {
    width: 100%;
  }

  .hamburger {
    display: block;
    background: linear-gradient(
      135deg,
      rgba(28, 51, 130, 0.9),
      rgba(163, 20, 50, 0.8)
    );
  }

  .nav-list {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    flex-direction: column;
    gap: 0;
    padding: 16px 0;
    background: linear-gradient(
      135deg,
      rgba(28, 51, 130, 0.9),
      rgba(163, 20, 50, 0.8)
    );
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.35s ease;
    display: block;
  }

  .nav-list li {
    margin: 10px 0;
  }

  .nav-list.open {
    max-height: 90vh;
    display: block;
  }

  .has-dropdown .dropdown {
    position: static !important;
    top: auto !important;
    left: auto !important;
    transform: none !important;
    opacity: 1 !important;
    visibility: visible !important;
    pointer-events: auto;
    box-shadow: none;
    padding-left: 20px; /* indent */
    margin-bottom: 8px;
    border-radius: 0;
    background: none;
  }

  .dropdown li {
    text-align: left;
    margin: 0;
  }

  .dropdown a {
    display: block;
    padding: 8px 12px;
    color: #fff;
    text-decoration: none;
  }

  .dropdown a:hover {
    background: rgba(255, 215, 0, 0.2);
    color: #ffd700;
  }
}

</style>
