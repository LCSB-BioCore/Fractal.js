import tippy from 'tippy.js'
import uuid4 from 'uuid/v4'

export default {
  bind (el, binding, vnode) {
    if (typeof vnode.context._tippyInstances === 'undefined') {
      vnode.context._tippyInstances = {}
    }
    const uuid = uuid4()
    el.setAttribute('data-uuid', uuid)
    const tip = tippy(el, Object.assign({
      performance: true,
      arrow: true,
      theme: 'light',
      dynamicTitle: true
    }, binding.value))
    vnode.context._tippyInstances[uuid] = tip
  }
}
