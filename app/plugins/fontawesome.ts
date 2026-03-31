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
} from '@fortawesome/free-solid-svg-icons'
import {faFacebook} from '@fortawesome/free-brands-svg-icons'

library.add(faGlobe, faEnvelope, faFacebook, faCalendarDays, faClock, faLocationDot, faCircleCheck)

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('FontAwesomeIcon', FontAwesomeIcon)
})
