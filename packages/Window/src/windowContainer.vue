<template>
  <div>
    <Window
      v-for="window in windows"
      :key="window.id"
      v-bind="window.modalAttrs"
      v-on="window.modalListeners"
      @closed="remove(window.id)"
    >
      <component
        :is="window.component"
        v-bind="window.componentAttrs"
        v-on="$listeners"
        @close="$window.hide(window.modalAttrs.name)"
      />
    </Window>
  </div>
</template>
<script>
import { generateId } from './utils'

const PREFIX = '_dynamic_window_'

export default {
  name: 'WindowContainer',
  props: {
    parent: {
      type: Object,
      default: function () {
        return this.$root
      }
    }
  },
  data () {
    return {
      componentName: 'VueWindowContainer',
      windows: [],
      activeWindow: '',
      maxIndex: 0
    }
  },
  created () {
    this.parent._dynamicContainer = this
  },
  methods: {
    nameExist (name) {
      const index = this.windows.findIndex(v => v.modalAttrs.name === name)
      return index >= 0
    },
    add (component, componentAttrs = {}, modalAttrs = {}, modalListeners = {}) {
      // component 窗体内的动态组件本身
      // componentAttrs 自定义属性的值，要在component的props中体现，无自定义属性赋null值
      // modalAttrs 窗体的属性值
      // modalListeners 窗体的自定义事件
      const id = generateId()
      const name = modalAttrs.name || (PREFIX + id)

      if (!this.nameExist(name)) {
        this.windows.push({
          id,
          modalAttrs: { ...modalAttrs, name },
          modalListeners,
          component,
          componentAttrs
        })
      }

      this.$nextTick(() => {
        this.$window.show(name)
      })
      return name
    },
    remove (id) {
      const index = this.windows.findIndex(v => v.id === id)
      if (this.windows[index].modalAttrs.isRemain) {
        return false
      }
      if (index !== -1) {
        this.windows.splice(index, 1)
      }
    }
  }
}
</script>
