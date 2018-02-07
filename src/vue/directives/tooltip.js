/**
 * Tooltips for SVG!
 * Refer to https://atomiks.github.io/tippyjs/ for documentation.
 * Pass your own options like this v-tooltip='{...}'
 */
import tippy from 'tippy.js'

export default {
  bind (el, binding) {
    const addTooltip = (event) => {
      const target = event.target || event.srcElement
      tippy(target, Object.assign({
        performance: true,
        arrow: true,
        dynamicTitle: true
      }, binding.value))
      el.removeEventListener('mouseover', addTooltip)
    }
    el.addEventListener('mouseover', addTooltip)
  }
}
