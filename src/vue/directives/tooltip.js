import tippy from 'tippy.js'
import uuid4 from 'uuid/v4'

export default {
  bind (el, binding, vnode) {
    if (typeof vnode.context._tippyInstances === 'undefined') {
      vnode.context._tippyInstances = {}
    }
    const addTooltip = (event) => {
      const uuid = uuid4()
      el.setAttribute('data-uuid', uuid)
      const target = event.target || event.srcElement
      vnode.context._tippyInstances[uuid] = tippy(target, Object.assign({
        performance: true,
        arrow: true,
        dynamicTitle: true
      }, binding.value))
      el.removeEventListener('mouseover', addTooltip)
    }
    el.addEventListener('mouseover', addTooltip)
  }
}
