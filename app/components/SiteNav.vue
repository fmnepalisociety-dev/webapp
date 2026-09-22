<template>
  <nav class="main-nav" :class="mode">
    <div class="nav-inner" ref="navInner">
      <!-- Hamburger -->
      <div class="hamburger-container">
        <button
          class="hamburger"
          @click="toggleMenu"
          :aria-label="isOpen ? 'Close navigation' : 'Open navigation'"
        >
          <span class="hamburger-label">{{ isOpen ? 'Close' : 'Menu' }}</span>
          <span class="hamburger-bars">
            <span :class="{ open: isOpen }"></span>
            <span :class="{ open: isOpen }"></span>
            <span :class="{ open: isOpen }"></span>
          </span>
        </button>
      </div>

      <!-- Menu -->
      <ul class="nav-list" ref="navList" :class="{ open: isOpen }">
        <li>
          <NuxtLink to="/" @click="closeMenu">Home</NuxtLink>
        </li>

        <li class="has-dropdown" :class="{ 'submenu-open': isSubOpen('activities') }">
          <span class="nav-parent" @click="onParentClick('activities')">
            Activities
            <font-awesome-icon :icon="['fas', 'chevron-down']" class="parent-caret" />
          </span>
          <ul class="dropdown">
            <li>
              <NuxtLink to="/events" @click="closeMenu">Events</NuxtLink>
            </li>
            <li>
              <NuxtLink to="/events/upcoming" @click="closeMenu">Upcoming</NuxtLink>
            </li>
            <li>
              <NuxtLink to="/events/recurring" @click="closeMenu">Recurring</NuxtLink>
            </li>
            <li>
              <NuxtLink to="/events/past" @click="closeMenu">Past</NuxtLink>
            </li>
          </ul>
        </li>

        <li class="has-dropdown" :class="{ 'submenu-open': isSubOpen('community') }">
          <span class="nav-parent" @click="onParentClick('community')">
            Community
            <font-awesome-icon :icon="['fas', 'chevron-down']" class="parent-caret" />
          </span>
          <ul class="dropdown">
            <li>
              <NuxtLink to="/members" @click="closeMenu">Members</NuxtLink>
            </li>
            <li>
              <NuxtLink to="/committee" @click="closeMenu">Committee</NuxtLink>
            </li>
          </ul>
        </li>

        <li class="has-dropdown" :class="{ 'submenu-open': isSubOpen('sports') }">
          <span class="nav-parent" @click="onParentClick('sports')">
            Sports
            <font-awesome-icon :icon="['fas', 'chevron-down']" class="parent-caret" />
          </span>
          <ul class="dropdown">
            <li>
              <NuxtLink to="/sports/football" @click="closeMenu">Football</NuxtLink>
            </li>
            <li>
              <NuxtLink to="/sports/everest-cup" @click="closeMenu">Everest Cup</NuxtLink>
            </li>
          </ul>
        </li>

        <li>
          <NuxtLink to="/education" @click="closeMenu">Education</NuxtLink>
        </li>

        <li>
          <NuxtLink to="/shop" @click="closeMenu">NeSFM-Wear</NuxtLink>
        </li>

        <li class="has-dropdown" :class="{ 'submenu-open': isSubOpen('about') }">
          <span class="nav-parent" @click="onParentClick('about')">
            About Us
            <font-awesome-icon :icon="['fas', 'chevron-down']" class="parent-caret" />
          </span>
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
import {ref, computed, watch, onMounted, onBeforeUnmount, nextTick} from 'vue'

type NavMode = 'relaxed' | 'tight' | 'compact'
const ALL_SUBS = ['activities', 'community', 'sports', 'about']

const isOpen = ref(false)
// Progressive layout: roomy spacing when there's space, tighter spacing when it
// gets cramped, and the hamburger only when even the tight row won't fit.
const mode = ref<NavMode>('relaxed')
const compact = computed(() => mode.value === 'compact')

const navInner = ref<HTMLElement | null>(null)
const navList = ref<HTMLElement | null>(null)
let relaxedWidth = 0
let tightWidth = 0
let ro: ResizeObserver | null = null

const toggleMenu = () => {
  isOpen.value = !isOpen.value
  if (isOpen.value) openSubs.value = new Set(ALL_SUBS) // open fully so everything shows
}
const closeMenu = () => {
  isOpen.value = false
  openSubs.value = new Set()
}

// Submenu accordion (compact mode). Opens fully by default; tap a parent to collapse it.
const openSubs = ref<Set<string>>(new Set())
const isSubOpen = (key: string) => openSubs.value.has(key)
function onParentClick(key: string) {
  if (!compact.value) return
  const next = new Set(openSubs.value)
  next.has(key) ? next.delete(key) : next.add(key)
  openSubs.value = next
}

// Cache the row width the links need at each spacing (content is static).
async function measureWidths() {
  const list = navList.value
  if (!list) return
  const prev = mode.value
  mode.value = 'relaxed'
  await nextTick()
  relaxedWidth = list.scrollWidth
  mode.value = 'tight'
  await nextTick()
  tightWidth = list.scrollWidth
  mode.value = prev
}

// Pick the roomiest layout that fits, with hysteresis on the hamburger boundary.
function decide() {
  const inner = navInner.value
  if (!inner || !relaxedWidth) return
  const avail = inner.clientWidth - 32 // content area inside the 16px side padding
  if (mode.value !== 'compact') {
    if (tightWidth > avail) mode.value = 'compact'
    else mode.value = relaxedWidth <= avail ? 'relaxed' : 'tight'
  } else if (tightWidth <= avail - 24) {
    mode.value = relaxedWidth <= avail - 24 ? 'relaxed' : 'tight'
  }
}

onMounted(async () => {
  await measureWidths()
  decide()
  if (typeof ResizeObserver !== 'undefined' && navInner.value) {
    ro = new ResizeObserver(() => decide())
    ro.observe(navInner.value)
  }
})

onBeforeUnmount(() => ro?.disconnect())

// Reset menu state when crossing the hamburger boundary.
watch(compact, () => {
  isOpen.value = false
  openSubs.value = new Set()
})
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
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
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
  gap: 22px; /* relaxed default */
  margin: 0;
  padding: 0;
}

.nav-list a,
.nav-parent {
  color: #fff;
  font-weight: 600;
  letter-spacing: 0.5px;
  padding: 12px 16px; /* relaxed default */
  border-radius: 999px;
  cursor: pointer;
  text-decoration: none;
  white-space: nowrap;
  transition: background 0.25s ease, color 0.25s ease;
}

/* Tight tier — links pack closer before the hamburger takes over */
.main-nav.tight .nav-list {
  gap: 6px;
}

.main-nav.tight .nav-list a,
.main-nav.tight .nav-parent {
  letter-spacing: 0.2px;
  padding: 10px 11px;
}

/* Submenu caret — only shown in compact (accordion) mode */
.parent-caret {
  display: none;
  font-size: 0.7rem;
  margin-left: 0.35rem;
  transition: transform 0.2s ease;
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
  align-items: center;
  gap: 10px;
  position: absolute;
  right: 16px;
  top: 12px;
  background: none;
  border: none;
  cursor: pointer;
  z-index: 1100;
}

.hamburger-label {
  color: #fff;
  font-weight: 600;
  font-size: 0.95rem;
  letter-spacing: 0.5px;
}

.hamburger-bars {
  display: inline-block;
}

.hamburger-bars span {
  display: block;
  width: 28px;
  height: 3px;
  margin: 5px 0;
  background: white;
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.hamburger-bars span.open:nth-child(1) {
  transform: translateY(8px) rotate(45deg);
}

.hamburger-bars span.open:nth-child(2) {
  opacity: 0;
}

.hamburger-bars span.open:nth-child(3) {
  transform: translateY(-8px) rotate(-45deg);
}

/* =========================
   COMPACT MENU (links don't fit → hamburger)
   Toggled by the `compact` class from JS overflow measurement, not a fixed
   breakpoint, so it collapses exactly when the links stop fitting.
   ========================= */
.main-nav.compact .nav-inner {
  flex-direction: column;
  padding: 0;
  position: relative;
}

.main-nav.compact .hamburger-container {
  width: 100%;
  display: flex;
  justify-content: flex-end;
  padding: 8px 36px 8px 16px;
}

.main-nav.compact .hamburger {
  display: inline-flex;
  position: static;
  padding: 6px;
  background: none;
}

.main-nav.compact .nav-list {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  flex-direction: column;
  gap: 0;
  padding: 0;
  background: linear-gradient(
    135deg,
    rgba(28, 51, 130, 0.95),
    rgba(163, 20, 50, 0.9)
  );
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.25);
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.35s ease;
  display: block;
}

.main-nav.compact .nav-list li {
  margin: 0;
}

.main-nav.compact .nav-list.open {
  max-height: 90vh;
  padding: 8px 0;
}

.main-nav.compact .nav-list > li > a,
.main-nav.compact .nav-parent {
  display: block;
  padding: 6px 20px;
  font-size: 0.9rem;
  line-height: 1.2;
  border-radius: 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.main-nav.compact .nav-parent {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.main-nav.compact .parent-caret {
  display: inline-block;
}

.main-nav.compact .has-dropdown.submenu-open .parent-caret {
  transform: rotate(180deg);
}

/* Accordion: each submenu stays collapsed until its parent is tapped */
.main-nav.compact .has-dropdown .dropdown {
  position: static !important;
  top: auto !important;
  left: auto !important;
  transform: none !important;
  opacity: 1 !important;
  visibility: visible !important;
  pointer-events: auto;
  box-shadow: none;
  margin: 0;
  border-radius: 0;
  background: rgba(0, 0, 0, 0.12);
  max-height: 0;
  overflow: hidden;
  padding: 0;
  transition: max-height 0.3s ease;
}

.main-nav.compact .has-dropdown.submenu-open .dropdown {
  max-height: 20rem;
  padding: 0 0 4px;
}

.main-nav.compact .dropdown li {
  text-align: left;
  margin: 0;
}

.main-nav.compact .dropdown a {
  display: block;
  padding: 5px 16px 5px 36px;
  font-size: 0.82rem;
  line-height: 1.2;
  color: rgba(255, 255, 255, 0.85);
  text-decoration: none;
}

.main-nav.compact .dropdown a:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #ffd700;
}
</style>
