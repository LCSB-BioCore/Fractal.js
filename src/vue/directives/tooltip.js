import tippy from 'tippy.js'
import uuid4 from 'uuid/v4'

export default {
  bind (el, binding, vnode) {
    if (typeof vnode.context._tippyInstances === 'undefined') {
      vnode.context._tippyInstances = {}
    }
    const uuid = uuid4()
    el.setAttribute('title', binding.value.title)
    el.setAttribute('data-uuid', uuid)
    const tip = tippy(el, Object.assign({
      performance: true,
      arrow: true,
      theme: 'light'
    }, binding.value.options))
    vnode.context._tippyInstances[uuid] = tip
  },
  update (el, binding, vnode) {
    const uuid = el.getAttribute('data-uuid')
    const tip = vnode.context._tippyInstances[uuid]
    const popper = tip.getPopperElement(el)
    el.setAttribute('title', binding.value.title)
    tip.update(popper)
  }
}
