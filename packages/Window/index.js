import window from './src/window.vue'
import windowContainer from './src/windowContainer.vue'
import { createDivInBody } from './src/utils'

const defaultComponentName = 'Window'

const UNMOUNTED_ROOT_ERROR_MESSAGE =
  '[vue-js-modal] ' +
  'In order to render dynamic modals, a <window-container> ' +
  'component must be present on the page.'

const DYNAMIC_MODAL_DISABLED_ERROR =
  '[vue-js-modal] ' +
  '$window() received object as a first argument, but dynamic modals are ' +
  'switched off. https://github.com/euvl/vue-js-modal/#dynamic-modals'

const UNSUPPORTED_ARGUMENT_ERROR =
  '[vue-js-modal] ' +
  '$modal() received an unsupported argument as a first argument.'

export const getWindowContainer = (Vue, options, root) => {
  if (!root._dynamicContainer && options.injectWindowContainer) {
    const container = createDivInBody()

    new Vue({
      parent: root,
      render: h => h(windowContainer)
    }).$mount(container)
  }

  return root._dynamicContainer
}

const emit = (vnode, name, data) => {
  const handlers = (vnode.data && vnode.data.on) ||
    (vnode.componentOptions && vnode.componentOptions.listeners)

  if (handlers && handlers[name]) {
    handlers[name].fns(data)
  }
}

export const addDraggableListeners = (enable, dragger, vnode, shift) => {
  if (!enable) {
    return
  }

  if (dragger) {
    let startX = 0
    let startY = 0
    let cachedShiftX = 0
    let cachedShiftY = 0

    const getPosition = event => {
      return event.touches && event.touches.length > 0
        ? event.touches[0]
        : event
    }

    // 开始按下
    const handleDraggableMousedown = event => {
      // const target = event.target

      // if (target && (target.nodeName === 'INPUT' || target.nodeName === 'TEXTAREA')) {
      // }

      const { clientX, clientY } = getPosition(event)
      //
      document.addEventListener('mousemove', handleDraggableMousemove, { passive: false })
      document.addEventListener('touchmove', handleDraggableMousemove, { passive: false })

      document.addEventListener('mouseup', handleDraggableMouseup, { passive: false })
      document.addEventListener('touchend', handleDraggableMouseup, { passive: false })

      startX = clientX
      startY = clientY

      cachedShiftX = shift.left
      cachedShiftY = shift.top

      // console.log(shift.left, cachedShiftX)

      emit(vnode, 'drag-start', shift)
    }

    // 移动
    const handleDraggableMousemove = event => {
      const { clientX, clientY } = getPosition(event)

      const newShift = { left: 0, top: 0 }
      newShift.left = cachedShiftX + clientX - startX
      newShift.top = cachedShiftY + clientY - startY

      emit(vnode, 'drag-move', { shift: newShift, mouse: { x: clientX, y: clientY } })

      event.preventDefault()
    }

    // 松开
    const handleDraggableMouseup = event => {
      emit(vnode, 'drag-stop', shift)
      document.removeEventListener('mousemove', handleDraggableMousemove)
      document.removeEventListener('touchmove', handleDraggableMousemove)

      document.removeEventListener('mouseup', handleDraggableMouseup)
      document.removeEventListener('touchend', handleDraggableMouseup)

      // event.preventDefault()
    }

    dragger.addEventListener('mousedown', handleDraggableMousedown, { passive: false })
    dragger.addEventListener('touchstart', handleDraggableMousedown, { passive: false })
  }
}

export const removeDraggableListeners = () => {
}

export const addLinkListeners = (el, val) => {
  el.addEventListener('click', () => {
    Plugin.event.$emit('linkFromEl', val.name, el)
  }, { passive: false })
}

export const removeLinkListeners = () => {}

const Plugin = {
  install (Vue, options = {}) {
    /**
     * Makes sure that plugin can be installed only once
     */
    if (this.installed) {
      return
    }

    this.installed = true
    this.event = new Vue()
    this.rootInstance = null

    const componentName = options.componentName || defaultComponentName
    const dynamicDefaults = options.dynamicDefaults || {}
    /**
     * Plugin API
     */
    const showStaticWindow = (modal, params) => {
      // modal：窗口name，true：显示窗口，params：事件参数
      Plugin.event.$emit('toggle', modal, true, params)
    }

    const showDynamicWindow = (modal, props, params, events) => {
      /**
       * Get root for dynamic modal
       */
      const root = params && params.root ? params.root : Plugin.rootInstance
      const container = getWindowContainer(Vue, options, root)
      /**
       * Show dynamic modal
       */
      if (container) {
        return container.add(modal, props, { ...dynamicDefaults, ...params }, events)
      }

      console.warn(UNMOUNTED_ROOT_ERROR_MESSAGE)
    }

    Vue.prototype.$window = {
      show (modal, ...args) {
        switch (typeof modal) {
          case 'string': {
            return showStaticWindow(modal, ...args)
          }
          case 'object':
          case 'function': {
            return options.dynamic
              ? showDynamicWindow(modal, ...args)
              : console.warn(DYNAMIC_MODAL_DISABLED_ERROR)
          }
          default: {
            console.warn(UNSUPPORTED_ARGUMENT_ERROR, modal)
          }
        }
      },
      hide (name, params) {
        Plugin.event.$emit('toggle', name, false, params)
      },
      toggle (name, params) {
        Plugin.event.$emit('toggle', name, undefined, params)
      },
      activeWindow () {
        return Plugin.rootInstance._dynamicContainer.activeWindow
      },
      setActiveWindow (name) {
        Plugin.rootInstance._dynamicContainer.activeWindow = name
      },
      maxIndex () {
        return Plugin.rootInstance._dynamicContainer.maxIndex
      },
      setMaxIndex (index) {
        Plugin.rootInstance._dynamicContainer.maxIndex = index
      }
    }
    /**
     * Sets custom component name (if provided)
     */
    Vue.component(componentName, window)
    /**
     * Registration of <windowContainer/> component
     */
    if (options.dynamic) {
      Vue.component('windowContainer', windowContainer)
      Vue.mixin({
        beforeMount () {
          if (Plugin.rootInstance === null) {
            Plugin.rootInstance = this.$root
          }
        }
      })
    }

    Vue.directive('draggable', {
      bind: (el, binding, vnode) => {
        const enable = binding.value.enable === undefined ? true : binding.value.enable
        addDraggableListeners(enable, el, vnode, binding.value.shift)
      },
      unbind () {
        removeDraggableListeners()
      }
    })

    Vue.directive('linkwin', {
      bind: (el, binding, vnode) => {
        // console.log('hahah', binding.value)
        addLinkListeners(el, binding.value)
      },
      unbind () {
        removeLinkListeners()
      }
    })
  }
}

export default Plugin
