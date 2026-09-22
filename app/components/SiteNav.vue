<template>
  <nav class="main-nav" :class="mode">
    <div class="nav-inner" ref="navInner">
      <!-- Hamburger (compact) -->
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

      <!-- Top-level bar (desktop) -->
      <ul class="nav-list" ref="navList">
        <template v-for="item in NAV" :key="item.label">
          <li v-if="item.type === 'link'">
            <NuxtLink :to="item.to!">
              <font-awesome-icon :icon="item.icon!" class="nav-icon" />
              <span class="nav-text">{{ item.label }}</span>
            </NuxtLink>
          </li>

          <li
            v-else
            class="has-dropdown"
            :class="{ 'is-open': openKey === item.label }"
            @mouseenter="openDropdown(item.label)"
            @mouseleave="scheduleClose"
          >
            <span class="nav-parent">
              <font-awesome-icon :icon="item.icon!" class="nav-icon" />
              <span class="nav-text">
                {{ item.label }}
                <font-awesome-icon :icon="['fas', 'chevron-down']" class="parent-caret" />
              </span>
            </span>
            <ul class="dropdown">
              <li v-for="link in item.items" :key="link.to">
                <NuxtLink :to="link.to">
                  <font-awesome-icon :icon="link.icon" class="drop-icon" />
                  <span>{{ link.label }}</span>
                </NuxtLink>
              </li>
            </ul>
          </li>
        </template>
      </ul>
    </div>

    <!-- Mobile slide-out drawer (from the left; tap the dimmed area to close) -->
    <Teleport to="body">
      <Transition name="drawer">
        <div v-if="compact && isOpen" class="drawer-root">
          <div class="drawer-scrim" @click="closeMenu"></div>
          <aside class="drawer">
            <div class="drawer-head">
              <span class="drawer-title">Menu</span>
              <button class="drawer-close" @click="closeMenu" aria-label="Close menu">
                <font-awesome-icon :icon="['fas', 'xmark']" />
              </button>
            </div>

            <div class="drawer-body">
              <template v-for="item in NAV" :key="item.label">
                <NuxtLink
                  v-if="item.type === 'link'"
                  :to="item.to!"
                  class="drawer-link drawer-link--top"
                  @click="closeMenu"
                >
                  <font-awesome-icon :icon="item.icon!" class="drawer-icon" />
                  {{ item.label }}
                </NuxtLink>

                <section v-else class="drawer-section">
                  <p class="drawer-section-title">
                    <font-awesome-icon :icon="item.icon!" />
                    {{ item.label }}
                  </p>
                  <div class="drawer-sub">
                    <NuxtLink
                      v-for="link in item.items"
                      :key="link.to"
                      :to="link.to"
                      class="drawer-link drawer-link--sub"
                      @click="closeMenu"
                    >
                      <font-awesome-icon :icon="link.icon" class="drawer-icon" />
                      {{ link.label }}
                    </NuxtLink>
                  </div>
                </section>
              </template>
            </div>
          </aside>
        </div>
      </Transition>
    </Teleport>
  </nav>
</template>

<script setup lang="ts">
import {ref, computed, watch, onMounted, onBeforeUnmount, nextTick} from 'vue'

type IconTuple = [string, string]
interface NavLink {
  label: string
  to: string
  icon: IconTuple
}
interface NavItem {
  type: 'link' | 'group'
  label: string
  to?: string
  key?: string
  icon: IconTuple
  items?: NavLink[]
}

// Data-driven — swap any icon here (register new ones in plugins/fontawesome.ts).
const NAV: NavItem[] = [
  {type: 'link', label: 'Home', to: '/', icon: ['fas', 'house']},
  {
    type: 'group',
    key: 'activities',
    label: 'Activities',
    icon: ['fas', 'calendar-days'],
    items: [
      {label: 'Events', to: '/events', icon: ['fas', 'calendar-days']},
      {label: 'Upcoming', to: '/events/upcoming', icon: ['fas', 'calendar-check']},
      {label: 'Recurring', to: '/events/recurring', icon: ['fas', 'rotate']},
      {label: 'Past', to: '/events/past', icon: ['fas', 'clock-rotate-left']},
    ],
  },
  {
    type: 'group',
    key: 'community',
    label: 'Community',
    icon: ['fas', 'users'],
    items: [
      {label: 'Members', to: '/members', icon: ['fas', 'users']},
      {label: 'Committee', to: '/committee', icon: ['fas', 'user-tie']},
    ],
  },
  {
    type: 'group',
    key: 'sports',
    label: 'Sports',
    icon: ['fas', 'futbol'],
    items: [
      {label: 'Football', to: '/sports/football', icon: ['fas', 'futbol']},
      {label: 'Everest Cup', to: '/sports/everest-cup', icon: ['fas', 'trophy']},
    ],
  },
  {type: 'link', label: 'Education', to: '/education', icon: ['fas', 'graduation-cap']},
  {type: 'link', label: 'NeSFM-Wear', to: '/shop', icon: ['fas', 'bag-shopping']},
  {
    type: 'group',
    key: 'about',
    label: 'About Us',
    icon: ['fas', 'circle-info'],
    items: [
      {label: 'About', to: '/about', icon: ['fas', 'circle-info']},
      {label: 'President’s Message', to: '/about/president-message', icon: ['fas', 'user-tie']},
      {label: 'Origin Story', to: '/about/origin-story', icon: ['fas', 'clock-rotate-left']},
      {label: 'Contact', to: '/contacts', icon: ['fas', 'envelope']},
    ],
  },
]

/* ---------- responsive width tiers ---------- */
type NavMode = 'relaxed' | 'tight' | 'compact'
const mode = ref<NavMode>('relaxed')
const compact = computed(() => mode.value === 'compact')

const navInner = ref<HTMLElement | null>(null)
const navList = ref<HTMLElement | null>(null)
let relaxedWidth = 0
let tightWidth = 0
let ro: ResizeObserver | null = null

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

function decide() {
  const inner = navInner.value
  if (!inner || !relaxedWidth) return
  const avail = inner.clientWidth - 32
  if (mode.value !== 'compact') {
    if (tightWidth > avail) mode.value = 'compact'
    else mode.value = relaxedWidth <= avail ? 'relaxed' : 'tight'
  } else if (tightWidth <= avail - 24) {
    mode.value = relaxedWidth <= avail - 24 ? 'relaxed' : 'tight'
  }
}

/* ---------- desktop dropdowns ----------
 * Hover is driven from script rather than :hover so that only one menu is ever
 * open: moving to another parent swaps immediately, while leaving the bar keeps
 * the current menu around briefly for a forgiving pointer path. */
const openKey = ref<string | null>(null)
const CLOSE_DELAY = 350
let closeTimer: ReturnType<typeof setTimeout> | null = null

function cancelClose() {
  if (closeTimer) clearTimeout(closeTimer)
  closeTimer = null
}

function openDropdown(key: string) {
  cancelClose()
  openKey.value = key
}

function scheduleClose() {
  cancelClose()
  closeTimer = setTimeout(() => (openKey.value = null), CLOSE_DELAY)
}

/* ---------- mobile overlay ---------- */
const isOpen = ref(false)
const toggleMenu = () => (isOpen.value = !isOpen.value)
const closeMenu = () => (isOpen.value = false)

onMounted(async () => {
  await measureWidths()
  decide()
  if (typeof ResizeObserver !== 'undefined' && navInner.value) {
    ro = new ResizeObserver(() => decide())
    ro.observe(navInner.value)
  }
})

onBeforeUnmount(() => {
  ro?.disconnect()
  cancelClose()
})

watch(compact, () => {
  isOpen.value = false
  cancelClose()
  openKey.value = null
})

// Lock body scroll while the overlay is open.
watch(isOpen, (open) => {
  if (typeof document !== 'undefined') {
    document.body.style.overflow = open && compact.value ? 'hidden' : ''
  }
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
  background: linear-gradient(90deg, rgba(28, 51, 130, 0.95), rgba(163, 20, 50, 0.92));
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
   TOP-LEVEL BAR
   ========================= */
.nav-list {
  list-style: none;
  display: flex;
  gap: 16px;
  margin: 0;
  padding: 0;
}

.nav-list a,
.nav-parent {
  display: inline-flex;
  align-items: center;
  color: #fff;
  font-weight: 600;
  letter-spacing: 0.4px;
  padding: 11px 14px;
  border-radius: 999px;
  cursor: pointer;
  text-decoration: none;
  white-space: nowrap;
  transition: background 0.2s ease, color 0.2s ease;
}

.nav-list a:hover,
.nav-parent:hover {
  background: rgba(255, 255, 255, 0.18);
  color: #ffd700;
}

.nav-icon {
  margin-right: 0.5rem;
  font-size: 0.85rem;
  opacity: 0.9;
}

.nav-text {
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
}

.parent-caret {
  font-size: 0.65rem;
  margin-left: 0.4rem;
  opacity: 0.75;
  transition: transform 0.2s ease;
}

/* tight tier — icon sits above the label so each item needs less width */
.main-nav.tight .nav-list {
  gap: 2px;
}

.main-nav.tight .nav-list > li > a,
.main-nav.tight .nav-parent {
  flex-direction: column;
  gap: 3px;
  letter-spacing: 0.2px;
  padding: 6px 9px;
  font-size: 0.92rem;
  border-radius: 12px;
}

.main-nav.tight .nav-list > li > a > .nav-icon,
.main-nav.tight .nav-parent > .nav-icon {
  margin-right: 0;
  font-size: 0.95rem;
}

/* =========================
   DESKTOP DROPDOWNS (per parent, own items only)
   ========================= */
.has-dropdown {
  position: relative;
}

/* Invisible bridge across the gap, so moving down to the menu keeps :hover. */
.has-dropdown::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 100%;
  height: 12px;
}

.dropdown {
  position: absolute;
  top: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  min-width: 210px;
  padding: 6px;
  margin: 0;
  list-style: none;
  background: linear-gradient(15deg, rgba(28, 51, 130, 0.96), rgba(163, 20, 50, 0.92));
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.25);
  border-radius: 10px;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity 0.18s ease, transform 0.18s ease, visibility 0s linear 0.2s;
}

.has-dropdown.is-open > .dropdown {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
  transform: translateX(-50%) translateY(0);
  transition-delay: 0s;
}

.dropdown li {
  list-style: none;
}

.dropdown a {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 8px 12px;
  border-radius: 7px;
  font-size: 0.9rem;
  color: #fff;
  text-decoration: none;
  white-space: nowrap;
  transition: background 0.15s ease, transform 0.15s ease;
}

.dropdown a:hover {
  background: rgba(255, 215, 0, 0.2);
  color: #ffd700;
  transform: translateX(2px);
}

.drop-icon {
  width: 1.05rem;
  text-align: center;
  font-size: 0.85rem;
  color: #ffd700;
  opacity: 0.9;
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

/* Compact: show hamburger, hide the desktop bar (overlay takes over) */
.main-nav.compact .nav-inner {
  padding: 0;
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
}

.main-nav.compact .nav-list {
  display: none;
}
</style>

<style>
/* =========================
   MOBILE SLIDE-OUT DRAWER (teleported to body, so unscoped)
   Panel slides from the left; the dimmed scrim on the right dismisses it.
   ========================= */
.drawer-root {
  position: fixed;
  inset: 0;
  z-index: 2000;
}

.drawer-scrim {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
}

.drawer {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: min(82vw, 320px);
  background: linear-gradient(160deg, rgba(28, 51, 130, 0.99), rgba(163, 20, 50, 0.97));
  color: #fff;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  box-shadow: 2px 0 24px rgba(0, 0, 0, 0.35);
  padding: 0.75rem 0.9rem 1.5rem;
}

.drawer-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.15rem 0 0.55rem;
  margin-bottom: 0.45rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
}

.drawer-title {
  font-size: 0.95rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  opacity: 0.85;
}

.drawer-close {
  background: rgba(255, 255, 255, 0.15);
  border: none;
  color: #fff;
  width: 2.1rem;
  height: 2.1rem;
  border-radius: 50%;
  font-size: 1.05rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.drawer-close:hover {
  background: rgba(255, 255, 255, 0.28);
}

.drawer-body {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.drawer-section {
  display: flex;
  flex-direction: column;
}

.drawer-section-title {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  margin: 0.4rem 0 0.15rem;
  font-size: 0.66rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  color: #ffd700;
}

.drawer-link {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  text-decoration: none;
  color: #fff;
}

.drawer-link:active {
  background: rgba(255, 255, 255, 0.08);
}

/* Top-level items: bold, full-width, with a divider */
.drawer-link--top {
  padding: 0.6rem 0.35rem;
  font-size: 1.02rem;
  font-weight: 700;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.drawer-link--top .drawer-icon {
  font-size: 0.9rem;
  color: #ffd700;
  opacity: 0.95;
}

/* Sub-items: indented under a left rail, lighter and smaller */
.drawer-sub {
  display: flex;
  flex-direction: column;
  margin: 0.1rem 0 0.2rem 1.15rem;
  padding-left: 0.75rem;
  border-left: 2px solid rgba(255, 255, 255, 0.2);
}

.drawer-link--sub {
  padding: 0.4rem 0.35rem;
  font-size: 0.85rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.82);
}

.drawer-link--sub .drawer-icon {
  font-size: 0.72rem;
  color: #ffd700;
  opacity: 0.65;
}

.drawer-icon {
  width: 1.2rem;
  text-align: center;
}

/* transitions: scrim fades, panel slides in from the left */
.drawer-enter-active .drawer-scrim,
.drawer-leave-active .drawer-scrim {
  transition: opacity 0.25s ease;
}

.drawer-enter-active .drawer,
.drawer-leave-active .drawer {
  transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}

.drawer-enter-from .drawer-scrim,
.drawer-leave-to .drawer-scrim {
  opacity: 0;
}

.drawer-enter-from .drawer,
.drawer-leave-to .drawer {
  transform: translateX(-100%);
}
</style>
