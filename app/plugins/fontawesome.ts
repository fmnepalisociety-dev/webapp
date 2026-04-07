import {defineNuxtPlugin} from '#app'

import {library} from '@fortawesome/fontawesome-svg-core'
import {FontAwesomeIcon} from '@fortawesome/vue-fontawesome'

import {
  faGlobe,
  faEnvelope,
  faCalendarDays,
  faClock,
  faLocationDot,
  faCircleCheck,
  faExpand,
  faDownload,
  faXmark,
  faChevronUp,
  faChevronDown,
  faChevronLeft,
  faChevronRight,
  faCalendarCheck,
  faClockRotateLeft,
  faArrowUpRightFromSquare,
  faCircleExclamation,
  faSpinner,
  faUsers,
  faUserTie,
  faRightFromBracket,
  faArrowLeft,
  faKey,
  faMagnifyingGlass,
  faPrint,
  faCamera,
} from '@fortawesome/free-solid-svg-icons'
import {faFacebook} from '@fortawesome/free-brands-svg-icons'

library.add(
  faGlobe,
  faEnvelope,
  faFacebook,
  faCalendarDays,
  faClock,
  faLocationDot,
  faCircleCheck,
  faExpand,
  faDownload,
  faXmark,
  faChevronUp,
  faChevronDown,
  faChevronLeft,
  faChevronRight,
  faCalendarCheck,
  faClockRotateLeft,
  faArrowUpRightFromSquare,
  faCircleExclamation,
  faSpinner,
  faUsers,
  faUserTie,
  faRightFromBracket,
  faArrowLeft,
  faKey,
  faMagnifyingGlass,
  faPrint,
  faCamera,
)

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('FontAwesomeIcon', FontAwesomeIcon)
})
