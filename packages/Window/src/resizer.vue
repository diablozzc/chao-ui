<template>
  <div :class="className" />
</template>
<script>
import { inRange } from './utils'

export default {
  props: {
    minHeight: {
      type: Number,
      default: 0
    },
    minWidth: {
      type: Number,
      default: 0
    },
    maxWidth: {
      type: Number,
      default: Number.MAX_SAFE_INTEGER
    },
    maxHeight: {
      type: Number,
      default: Number.MAX_SAFE_INTEGER
    }
  },
  data () {
    return {
      clicked: false,
      size: {}
    }
  },
  computed: {
    className () {
      return { 'vue-modal-resizer': true, 'clicked': this.clicked }
    }
  },
  mounted () {
    this.$el.addEventListener('mousedown', this.start, { passive: false })
    this.$el.addEventListener('touchstart', this.start, { passive: false })
  },
  methods: {
    start (event) {
      this.clicked = true

      window.addEventListener('mousemove', this.mousemove, { passive: false })
      window.addEventListener('touchmove', this.mousemove, { passive: false })
      window.addEventListener('mouseup', this.stop, { passive: false })
      window.addEventListener('touchend', this.stop, { passive: false })

      event.stopPropagation()
      event.preventDefault()
    },
    stop () {
      this.clicked = false

      window.removeEventListener('mousemove', this.mousemove, { passive: false })
      window.removeEventListener('touchmove', this.mousemove, { passive: false })
      window.removeEventListener('mouseup', this.stop, { passive: false })
      window.removeEventListener('touchend', this.stop, { passive: false })

      this.$emit('resize-stop', {
        element: this.$el.parentElement,
        size: this.size
      })
    },
    mousemove (event) {
      this.resize(event)
    },
    resize (event) {
      const el = this.$el.parentElement

      if (el) {
        // todo: 当window属于根窗口使用 innerWidth，否则 使用 父级窗口的width+left偏移量
        let parentMaxWidth = window.innerWidth
        let parentMaxHeight = window.innerHeight

        if (!this.$parent.isRootWindow) {
          const parentWindow = this.$parent.parentWindow
          parentMaxWidth = parentWindow.trueModalWidth + parentWindow.offset.left
          parentMaxHeight = parentWindow.trueModalHeight + parentWindow.offset.top - parentWindow.modal.footerHeight
        }

        const maxWidth = Math.min(parentMaxWidth, this.maxWidth)
        const maxHeight = Math.min(parentMaxHeight, this.maxHeight)

        let theClientX = event.clientX ? event.clientX : event.changedTouches[0].clientX
        let theClientY = event.clientY ? event.clientY : event.changedTouches[0].clientY

        const theOffset = this.$parent.offset
        theClientX = Math.min(maxWidth, theClientX)
        theClientY = Math.min(maxHeight, theClientY)

        let width = theClientX - theOffset.left
        let height = theClientY - theOffset.top

        // console.log(theClientX)

        width = inRange(this.minWidth, maxWidth, width)
        height = inRange(this.minHeight, maxHeight, height)

        this.size = { width, height }
        el.style.width = width + 'px'
        el.style.height = height + 'px'

        this.$emit('resize', {
          element: el,
          size: this.size
        })
      }
    }
  }
}
</script>
<style>
  .vue-modal-resizer {
    display: block;
    overflow: hidden;
    position: absolute;
    width: 12px;
    height: 12px;
    right: 0;
    bottom: 0;
    /*z-index: 9999999;*/
    background: transparent;
    cursor: se-resize;
  }

  .vue-modal-resizer::after {
    display: block;
    position: absolute;
    content: '';
    background: transparent;
    left: 0;
    top: 0;
    width: 0;
    height: 0;
    border-bottom: 10px solid #98a4b4;
    border-left: 10px solid transparent;
  }

  .vue-modal-resizer.clicked::after {
    border-bottom: 10px solid #98a4b4;
  }
</style>
