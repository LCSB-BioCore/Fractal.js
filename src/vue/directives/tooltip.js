import tippy from 'tippy.js'
import uuid4 from 'uuid/v4'

export default {
  update: function (el, binding, vnode) {
    if (typeof vnode.context.$options._tippyInstances === 'undefined') {
      vnode.context.$options._tippyInstances = {}
    }

    if (!el.hasAttribute('data-tooltipped')) {
      const uuid = uuid4()
      el.setAttribute('title', binding.value.title)
      el.setAttribute('data-uuid', uuid)
      const tip = tippy(el, Object.assign(binding.value.options, {
        performance: true
      }))
      vnode.context.$options._tippyInstances[uuid] = tip
    } else {
      const uuid = el.getAttribute('data-uuid')
      const tip = vnode.context.$options._tippyInstances[uuid]
      const popper = tip.getPopperElement(el)
      el.setAttribute('title', binding.value.title)
      tip.update(popper)
    }
  }
}
