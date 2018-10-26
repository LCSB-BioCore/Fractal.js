/**
 * Refer to https://atomiks.github.io/tippyjs/ for documentation.
 * Pass your own options like this v-tooltip='{...}'
 */
import tippy from 'tippy.js'

export default {
  bind (el, binding) {
    tippy(el, Object.assign({
      performance: true,
      arrow: true
    }, binding.value))
  },
  update (el) {
    el._tippy.setContent(el.getAttribute('title'))
  }
}
