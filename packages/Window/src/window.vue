<template>
  <transition
    name="win"
    @before-enter="beforeEnter"
    @enter="enter"
    @before-leave="beforeLeave"
    @leave="leave"
  >
    <div
      v-if="visibility.window"
      ref="window"
      v-draggable="{enable: windowDraggable, shift: shift}"
      :class="windowClass"
      :style="windowStyle"
      @mousedown.stop="selectWindow"
      @drag-stop="onDragStop"
      @drag-move="onDragMove"
    >
      <div
        v-if="!noTitlebar"
        ref="windowTitle"
        v-draggable="{enable: titleDraggable, shift: shift}"
        class="title-bar"
        :class="{'active': isActive, 'draggable': draggable.title}"
        @drag-stop="onDragStop"
        @drag-move="onDragMove"
      >
        <div class="title-text">
          {{ title }}
        </div>

        <div
          class="title-buttons flex-row flex-middle"
          @mousemove.stop="idle"
          @mousedown.stop="idle"
          @mouseup.stop="idle"
        >
          <div
            v-if="!noMinBtn"
            class="title-button flex-item-fixed"
            @click="minimize"
          >
            <min-icon />
          </div>
          <div
            v-if="!noToggleBtn"
            class="title-button flex-item-fixed"
            @click="toggleWinSize"
          >
            <toggle-size-icon :status="windowStatus" />
          </div>
          <div
            v-if="!noCloseBtn"
            class="title-button flex-item-fixed"
            @click="onClose"
          >
            <close-icon />
          </div>
        </div>
      </div>
      <div
        ref="windowBody"
        class="window-body"
        :style="windowBodyStyle"
      >
        <slot />
      </div>
      <div
        ref="windowFooter"
        class="window-footer"
      >
        <slot name="footer" />
      </div>
      <resizer
        v-if="resizable && !isAutoHeight"
        :min-width="minWidth"
        :min-height="minHeight"
        :max-width="maxWidth"
        :max-height="maxHeight"
        @resize="handleModalResize"
        @resize-stop="handleModalResizeStop"
      />
      <window-container
        ref="subWindow"
        :parent="windowInstance"
      />
    </div>
  </transition>
</template>
<script>
import Velocity from 'velocity-animate'
import Window from '../index'
import Resizer from './resizer.vue'
import MinIcon from './icon/minIcon'
import CloseIcon from './icon/closeIcon'
import ToggleSizeIcon from './icon/toggleSizeIcon'
import {
  inRange,
  createModalEvent,
  getMutationObserver,
  blurActiveElement,
  sleep,
  getPosition
} from './utils'
import { parseNumber, validateNumber } from './parser'
export default {
  name: 'Window',
  components: {
    Resizer,
    MinIcon,
    CloseIcon,
    ToggleSizeIcon
  },
  props: {
    name: {
      required: true,
      type: String
    },
    title: {
      type: String,
      default: ''
    },
    delay: {
      type: Number,
      default: 0
    },
    showDuration: {
      type: Number,
      default: 200
    },
    hideDuration: {
      type: Number,
      default: 200
    },
    resizable: {
      type: Boolean,
      default: false
    },
    adaptive: {
      type: Boolean,
      default: false
    },
    draggable: {
      type: Object,
      default: () => {
        return {
          title: false,
          window: false
        }
      }
    },
    scrollable: {
      type: Boolean,
      default: false
    },
    reset: {
      type: Boolean,
      default: false
    },
    noTitlebar: {
      type: Boolean,
      default: false
    },
    noMinBtn: {
      type: Boolean,
      default: false
    },
    noToggleBtn: {
      type: Boolean,
      default: false
    },
    noCloseBtn: {
      type: Boolean,
      default: false
    },
    classes: {
      type: [String, Array],
      default: 'v-window'
    },
    minWidth: {
      type: Number,
      default: 0,
      validator (value) {
        return value >= 0
      }
    },
    minHeight: {
      type: Number,
      default: 0,
      validator (value) {
        return value >= 0
      }
    },
    maxWidth: {
      type: Number,
      default: Infinity
    },
    maxHeight: {
      type: Number,
      default: Infinity
    },
    width: {
      type: [Number, String],
      default: 600,
      validator: validateNumber
    },
    height: {
      type: [Number, String],
      default: 300,
      validator (value) {
        return value === 'auto' || validateNumber(value)
      }
    },
    startX: {
      type: Number,
      default: () => ((Math.random() * (0.3)) + 0.2).toFixed(2) - 0,
      validator (value) {
        return value >= 0 && value <= 1
      }
    },
    startY: {
      type: Number,
      default: () => ((Math.random() * (0.3)) + 0.2).toFixed(2) - 0,
      validator (value) {
        return value >= 0 && value <= 1
      }
    },
    startLeft: {
      type: Number,
      default: 0
    },
    startTop: {
      type: Number,
      default: 0
    },
    startType: {
      type: String,
      default: 'percent'
    },
    startZindex: {
      type: Number,
      default: 1
    },
    appendToBody: {
      type: Boolean,
      default: false
    },
    startStatus: {
      type: String,
      default: 'normal'
    },
    isRemain: {
      type: Boolean,
      default: false
    },
    fromElId: {
      type: String,
      default: ''
    }
  },
  data () {
    return {
      componentName: 'VueWindow',
      resizing: false,
      visible: false,
      visibility: {
        window: false,
        overlay: false,
        minimize: false
      },
      shift: {
        left: 0,
        top: 0
      },
      // 模态窗口的尺寸
      modal: {
        width: 0,
        widthType: 'px',
        height: 0,
        heightType: 'px',
        renderedHeight: 0,
        titleHeight: 0,
        footerHeight: 0
      },
      // 浏览器窗口的尺寸
      window: {
        width: 0,
        height: 0
      },
      // 模态窗口的位置
      modalPosition: {
        left: null,
        top: null
      },
      // 模态窗口起始位置
      startPoint: {
        left: null,
        top: null
      },
      zIndex: 1,
      mutationObserver: null,
      fullscreenDoing: false,
      windowStatus: 'normal',
      backNormalStatus: {},
      windowInstance: this,
      parentWindow: this,
      offset: {
        left: 0,
        top: 0
      },
      fromEl: null,
      animationPlaying: false
    }
  },
  computed: {
    isActive () {
      return this.$window.activeWindow() === this.name
    },
    /**
     * Returns true if height is set to "auto"
     */
    isAutoHeight () {
      return this.modal.heightType === 'auto'
    },
    /**
     * Returns pixel width (if set with %) and makes sure that modal size
     * fits the window
     */
    isRootWindow () {
      return this.parentWindow.name === this.name
    },
    trueModalWidth () {
      const { window, modal, adaptive, minWidth, maxWidth } = this
      const value = modal.widthType === '%'
        ? window.width / 100 * modal.width
        : modal.width
      const max = Math.max(minWidth, Math.min(window.width, maxWidth))
      return adaptive
        ? inRange(minWidth, max, value)
        : value
    },
    /**
     * Returns pixel height (if set with %) and makes sure that modal size
     * fits the window.
     *
     * Returns modal.renderedHeight if height set as "auto"
     */
    trueModalHeight () {
      const { window, modal, isAutoHeight, adaptive, minHeight, maxHeight } = this
      const value = modal.heightType === '%'
        ? window.height / 100 * modal.height
        : modal.height
      if (isAutoHeight) {
        // use renderedHeight when height 'auto'
        return this.modal.renderedHeight
      }
      const max = Math.max(minHeight, Math.min(window.height, maxHeight))
      return adaptive
        ? inRange(minHeight, max, value)
        : value
    },
    /**
     * Returns class list for screen overlay (modal background)
     */
    overlayClass () {
      return {
        'v-window-overlay': true,
        'scrollable': this.scrollable && this.isAutoHeight
      }
    },
    windowClass () {
      return [
        'v-window-box',
        { draggable: this.draggable.window },
        { 'window-fullscreen-doing': this.fullscreenDoing },
        this.classes
      ]
    },
    windowStyle () {
      return {
        top: this.modalPosition.top + 'px',
        left: this.modalPosition.left + 'px',
        width: this.trueModalWidth + 'px',
        height: this.isAutoHeight ? 'auto' : this.trueModalHeight + 'px',
        zIndex: this.zIndex
      }
    },
    windowBodyStyle () {
      const windowBodyHeight = this.trueModalHeight - this.modal.titleHeight - this.modal.footerHeight
      // 100vh 应该是父级容器的高度
      const windowBodyMaxHeight = `calc(100vh - ${this.modal.titleHeight}px - ${this.modal.footerHeight}px)`
      return {
        height: windowBodyHeight + 'px',
        maxHeight: windowBodyMaxHeight
      }
    },
    maxLeft () {
      return this.window.width - this.trueModalWidth < 0 ? 0 : this.window.width - this.trueModalWidth
    },
    maxTop () {
      let parentBodyHeight = this.window.height
      if (!this.isRootWindow) {
        parentBodyHeight = (this.window.height - this.parentWindow.modal.footerHeight)
      }
      return parentBodyHeight - this.trueModalHeight < 0 ? 0 : parentBodyHeight - this.trueModalHeight
    },
    minTop () {
      const theMinTop = -this.startPoint.top
      if (this.isRootWindow || this.parentWindow.noTitlebar) {
        return theMinTop
      } else {
        return theMinTop + this.modal.titleHeight
      }
    },
    windowDraggable () {
      return this.draggable.window && this.windowStatus !== 'fullscreen'
    },
    titleDraggable () {
      return this.draggable.title && this.windowStatus !== 'fullscreen'
    }
  },
  watch: {
    /**
     * Sets the visibility of overlay and modal.
     * Events 'opened' and 'closed' is called here
     * inside `setTimeout` and `$nextTick`, after the DOM changes.
     * This fixes `$refs.modal` `undefined` bug (fixes #15)
     */
    visible (value) {
      if (value) {
        this.visibility.overlay = true
        setTimeout(() => {
          this.visibility.window = true
          this.visibility.minimize = false
          this.initStartPoint()
          this.$nextTick(() => {
            // this.addDraggableListeners()
            this.callAfterEvent(true)
            this.getModalOffset()
            if (this.startStatus === 'fullscreen') {
              this.goFullSize()
            }
          })
        }, this.delay)
        this.selectWindow()
        if (this.appendToBody) {
          document.body.appendChild(this.$el)
        }
      } else {
        this.visibility.window = false
        setTimeout(() => {
          this.visibility.overlay = false
          this.$nextTick(() => {
            // this.removeDraggableListeners()
            this.callAfterEvent(false)
          })
        }, this.delay)
      }
    },
    shift: {
      handler (val) {
        const {
          maxLeft,
          maxTop
        } = this
        const left = this.startPoint.left + val.left
        const top = this.startPoint.top + val.top
        this.modalPosition.left = parseInt(inRange(0, maxLeft, left))
        this.modalPosition.top = parseInt(inRange(0, maxTop, top))
      },
      deep: true
    },
    windowStatus (val) {
      switch (val) {
        case 'normal':
          this.doRestoreNormal()
          break
        case 'fullscreen':
          this.doFullscreen()
          break
      }
    }
  },
  created () {
    this.parentWindow = this.getParentWindow()
    if (!this.isRootWindow) {
      this.$watch('parentWindow.modal', (modal) => {
        this.window.width = modal.width
        this.window.height = modal.height
      }, { deep: true })
      this.$watch('parentWindow.offset', (val) => {
        this.getModalOffset()
      }, { deep: true })
    }
    this.$watch('visibility.minimize', (val) => {
      const value = !val ? 1 : 0

      const elPos = getPosition(this.fromEl)
      // const winPos = getPosition(this.$el)
      const x = (elPos.left) + this.fromEl.offsetWidth / 2
      const y = (elPos.top) + this.fromEl.offsetHeight / 2

      this.$el.style.transformOrigin = 'left top'
      this.animationPlaying = true
      if (value) {
        // 还原
        Velocity(this.$el, {
          opacity: value,
          left: this.modalPosition.left,
          scaleX: value,
          top: this.modalPosition.top,
          scaleY: value
        }, {
          duration: this.showDuration,
          complete: () => {
            this.animationPlaying = false
          }
        })
        this.selectWindow()
      } else {
        // 最小化
        Velocity(this.$el, {
          opacity: 0.2,
          left: x,
          scaleX: value,
          top: y,
          scaleY: value
        }, {
          duration: this.hideDuration,
          complete: () => {
            // this.animationPlaying = false
          }
        })
      }
    })
    this.setInitialSize()
  },
  /**
   * Sets global listeners
   */
  beforeMount () {
    Window.event.$on('toggle', this.handleToggleEvent)
    Window.event.$on('linkFromEl', this.handleLinkEvent)
    window.addEventListener('resize', this.handleWindowResize)
    this.handleWindowResize()
    /**
     * Making sure that autoHeight is enabled when using "scrollable"
     */

    if (this.scrollable && !this.isAutoHeight) {
      console.warn(
        `Modal "${this.name}" has scrollable flag set to true ` +
        `but height is not "auto" (${this.height})`
      )
    }
    /**
     * Only observe when using height: 'auto'
     * The callback will be called when modal DOM changes,
     * this is for updating the `top` attribute for height 'auto' modals.
     */
    // if (this.isAutoHeight) {
    /**
       * MutationObserver feature detection:
       *
       * Detects if MutationObserver is available, return false if not.
       * No polyfill is provided here, so height 'auto' recalculation will
       * simply stay at its initial height (won't crash).
       * (Provide polyfill to support IE < 11)
       *
       * https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver
       *
       * For the sake of SSR, MutationObserver cannot be initialized
       * before component creation >_<
       */
    const MutationObserver = getMutationObserver()
    if (MutationObserver) {
      this.mutationObserver = new MutationObserver(mutations => {
        this.updateRenderedHeight()
        this.ensureShiftInWindowBounds()
      })
    }
    // }
    // if (this.clickToClose) {
    //   window.addEventListener('keyup', this.handleEscapeKeyUp)
    // }
  },
  mounted () {
    if (this.fromElId) {
      this.fromEl = document.querySelector(`#${this.fromElId}`)
    } else {
      this.fromEl = document.body
    }
  },
  /**
   * Removes global listeners
   */
  beforeDestroy () {
    this.$el.parentNode.removeChild(this.$el)
    Window.event.$off('toggle', this.handleToggleEvent)
    Window.event.$off('linkFromEl', this.handleLinkEvent)
    window.removeEventListener('resize', this.handleWindowResize)
    // if (this.clickToClose) {
    //   window.removeEventListener('keyup', this.handleEscapeKeyUp)
    // }
    /**
     * Removes blocked scroll
     */
    // if (this.scrollable) {
    //   document.body.classList.remove('v--modal-block-scroll')
    // }
  },
  methods: {
    beforeEnter (el) {
      this.animationPlaying = true
      el.style.transformOrigin = 'left top'
      const elPos = getPosition(this.fromEl)
      const x = elPos.left + this.fromEl.offsetWidth / 2
      const y = elPos.top + this.fromEl.offsetHeight / 2
      const duration = 0
      Velocity(el, {
        opacity: 0,
        scaleX: 0,
        left: x,
        scaleY: 0,
        top: y
      }, { duration })
    },
    enter (el, done) {
      const duration = this.windowStatus === 'fullscreen' ? 0 : this.showDuration

      Velocity(el, {
        opacity: 1,
        left: this.modalPosition.left,
        scaleX: 1,
        top: this.modalPosition.top,
        scaleY: 1
      }, {
        duration,
        complete: () => {
          this.animationPlaying = false
          done()
        }
      })
    },
    beforeLeave (el) {
      el.style.transformOrigin = 'left top'
    },
    leave (el, done) {
      const elPos = getPosition(this.fromEl)
      const x = (elPos.left) + this.fromEl.offsetWidth / 2
      const y = (elPos.top) + this.fromEl.offsetHeight / 2
      const duration = this.windowStatus === 'fullscreen' ? 0 : this.hideDuration

      Velocity(el, {
        opacity: 0.2,
        left: x,
        scaleX: 0,
        top: y,
        scaleY: 0
      }, { duration, complete: done })
    },
    initStartPoint () {
      const {
        shift,
        startX,
        startY,
        startLeft,
        startTop,
        startType,
        maxLeft,
        maxTop
      } = this

      if (this.reset || !this.startPoint.left) {
        switch (startType) {
          case 'percent':
            this.modalPosition.left = shift.left + startX * maxLeft
            this.modalPosition.top = shift.top + startY * maxTop
            this.startPoint.left = shift.left + startX * maxLeft
            this.startPoint.top = shift.top + startY * maxTop
            break
          case 'absolute':
            this.modalPosition.left = startLeft
            this.modalPosition.top = startTop
            this.startPoint.left = startLeft
            this.startPoint.top = startTop
            break
        }
      }
    },
    // 浏览器窗口尺寸调整
    handleWindowResize () {
      if (this.isRootWindow) {
        this.window.width = window.innerWidth
        this.window.height = window.innerHeight
      } else {
        this.window.width = this.parentWindow.trueModalWidth
        this.window.height = this.parentWindow.trueModalHeight
      }

      if (this.windowStatus === 'fullscreen') {
        this.modal.width = this.window.width
        this.modal.height = this.window.height
      }

      this.ensureShiftInWindowBounds()
      // todo: ensureModalInWindowBounds()
    },
    createModalEvent (args = {}) {
      return createModalEvent({
        name: this.name,
        ref: this.$refs.window,
        ...args
      })
    },
    /**
     * Event handler which is triggered on modal resize
     */
    // 模态窗口的尺寸调整
    handleModalResize (event) {
      this.resizing = true

      this.modal.widthType = 'px'
      this.modal.width = event.size.width

      this.modal.heightType = 'px'
      this.modal.height = event.size.height

      if (this.windowStatus === 'fullscreen') {
        this.backupWindowStatus()
        this.windowStatus = 'normal'
      }
      this.fullscreenDoing = false
      //
      // this.modal.size = event.size
      //
      // const { size } = this.modal
      //
      // this.$emit(
      //   'resize',
      //   this.createModalEvent({ size })
      // )
    },
    handleModalResizeStop (event) {
      this.resizing = false
    },
    handleToggleEvent (name, state, params) {
      if (this.name === name) {
        // 默认nextState状态为true
        const nextState = typeof state === 'undefined' ? !this.visible : state
        this.toggle(nextState, params)
        if (nextState) {
          this.visibility.minimize = false
        }
      }
    },
    handleLinkEvent (name, fromEl) {
      if (this.name === name) {
        this.fromEl = fromEl
      }
    },
    /**
     * Initializes modal's size & position,
     * if "reset" flag is set to true - this function will be called
     * every time "beforeOpen" is triggered
     */
    setInitialSize () {
      const { modal } = this
      const width = parseNumber(this.width)
      const height = parseNumber(this.height)
      modal.width = width.value
      modal.widthType = width.type
      modal.height = height.value
      modal.heightType = height.type
    },
    /**
     * Event handler which is triggered on $modal.show and $modal.hide
     * BeforeEvents: ('before-close' and 'before-open') are `$emit`ed here,
     * but AfterEvents ('opened' and 'closed') are moved to `watch.visible`.
     */
    toggle (nextState, params) {
      const { reset, visible } = this
      if (visible === nextState) {
        return
      }
      const beforeEventName = visible
        ? 'before-close'
        : 'before-open'
      if (beforeEventName === 'before-open') {
        /**
         * Need to unfocus previously focused element, otherwise
         * all keypress events (ESC press, for example) will trigger on that element.
         */
        blurActiveElement()
        if (reset) {
          this.setInitialSize()
        }
        this.shift.left = 0
        this.shift.top = 0
      } else {
        // 关闭窗口时更新起点位置
        this.startPoint.left = this.modalPosition.left
        this.startPoint.top = this.modalPosition.top
      }
      let stopEventExecution = false
      const stop = () => {
        stopEventExecution = true
      }
      const beforeEvent = this.createModalEvent({
        stop,
        state: nextState,
        params
      })
      // 执行 before-open / before-close 事件
      this.$emit(beforeEventName, beforeEvent)
      if (!stopEventExecution) {
        this.visible = nextState
      }
    },
    callAfterEvent (state) {
      if (state) {
        this.connectObserver()
      } else {
        this.disconnectObserver()
      }
      const eventName = state ? 'opened' : 'closed'
      const event = this.createModalEvent({ state })
      this.$emit(eventName, event)
    },
    /**
     * Update $data.modal.renderedHeight using getBoundingClientRect.
     * This method is called when:
     * 1. modal opened
     * 2. MutationObserver's observe callback
     */
    updateRenderedHeight () {
      if (this.$refs.window && !this.fullscreenDoing && !this.animationPlaying) {
        if (this.isAutoHeight) {
          this.modal.renderedHeight = this.$refs.window.getBoundingClientRect().height
        } else {
          this.modal.height = this.$refs.window.getBoundingClientRect().height
        }
      }
      if (this.$refs.windowTitle) {
        this.modal.titleHeight = this.$refs.windowTitle.getBoundingClientRect().height
      }
      if (this.$refs.windowFooter) {
        this.modal.footerHeight = this.$refs.windowFooter.getBoundingClientRect().height
      }
    },
    /**
     * Start observing modal's DOM, if childList or subtree changes,
     * the callback (registered in beforeMount) will be called.
     */
    connectObserver () {
      if (this.mutationObserver) {
        this.mutationObserver.observe(this.$refs.window, {
          childList: true,
          attributes: true,
          subtree: true
        })
      }
    },
    /**
     * Disconnects MutationObserver
     */
    disconnectObserver () {
      if (this.mutationObserver) {
        this.mutationObserver.disconnect()
      }
    },
    afterEnter () {
      this.$emit('opened')
    },
    afterLeave () {
      this.$emit('closed')
    },
    ensureShiftInWindowBounds () {
      const {
        shift,
        maxLeft,
        maxTop,
        minTop
      } = this

      const left = shift.left
      const top = shift.top

      const theLeft = left - inRange(-this.startPoint.left, maxLeft - this.startPoint.left, left)
      const theTop = top - inRange(minTop, maxTop - this.startPoint.top, top)
      this.shift.left -= theLeft
      this.shift.top -= theTop
    },
    onClose () {
      this.$window.hide(this.name)
      this.$emit('close')
    },
    onDragStop (val) {
      this.ensureShiftInWindowBounds()
      this.getModalOffset()
    },
    onDragMove (val) {
      // console.log('drag move', val.shift.left, this.shift.left)
      this.shift.left = val.shift.left
      this.shift.top = val.shift.top
      if (this.windowStatus === 'fullscreen') {
        // 鼠标对齐窗口的标题栏中心点
        this.modalPosition.left = val.mouse.x - this.offset.left - this.backNormalStatus.modal.width / 2
        this.modalPosition.top = val.mouse.y - this.offset.top - this.modal.titleHeight / 2
        this.startPoint.left = val.mouse.x - this.offset.left - this.backNormalStatus.modal.width / 2
        this.startPoint.top = val.mouse.y - this.offset.top - this.modal.titleHeight / 2

        this.backupWindowStatus()

        this.windowStatus = 'normal'
        this.fullscreenDoing = false
      }
    },
    selectWindow () {
      if (this.windowStatus === 'normal') {
        this.fullscreenDoing = false
      }
      if (this.$window.activeWindow() !== this.name) {
        this.$window.setActiveWindow(this.name)
        const newIndex = this.$window.maxIndex() + this.startZindex
        this.$window.setMaxIndex(newIndex)
        this.zIndex = newIndex
      }
    },
    goFullSize () {
      this.fullscreenDoing = true
      this.backupWindowStatus()
      this.windowStatus = 'fullscreen'
    },
    goNormalSize () {
      this.windowStatus = 'normal'
    },
    toggleWinSize () {
      switch (this.windowStatus) {
        case 'normal':
          this.goFullSize()
          break
        case 'fullscreen':
          this.goNormalSize()
      }
    },
    minimize () {
      this.visibility.minimize = true
    },
    backupWindowStatus () {
      this.backNormalStatus = Object.assign(this.backNormalStatus, { modalPosition: Object.assign({}, this.modalPosition) })
      this.backNormalStatus = Object.assign(this.backNormalStatus, { startPoint: Object.assign({}, this.startPoint) })
      this.backNormalStatus = Object.assign(this.backNormalStatus, { shift: Object.assign({}, this.shift) })
      if (this.windowStatus !== 'fullscreen' || this.resizing) {
        this.backNormalStatus = Object.assign(this.backNormalStatus, { modal: Object.assign({}, this.modal) })
      }
    },
    async doFullscreen () {
      this.modalPosition.left = 0
      this.modalPosition.top = 0
      this.startPoint.left = 0
      this.startPoint.top = 0
      this.shift.left = 0
      this.shift.top = 0
      this.modal.width = this.window.width
      this.modal.height = this.isRootWindow ? this.window.height : this.window.height - this.parentWindow.modal.footerHeight - this.parentWindow.modal.titleHeight
      await sleep(200)
      this.getModalOffset()
    },
    async doRestoreNormal () {
      this.modal.width = this.backNormalStatus.modal.width
      this.modal.height = this.backNormalStatus.modal.height
      this.modalPosition = Object.assign(this.modalPosition, this.backNormalStatus.modalPosition)
      this.startPoint = Object.assign(this.startPoint, this.backNormalStatus.startPoint)
      this.shift = Object.assign(this.shift, this.backNormalStatus.shift)
      await sleep(200)
      this.getModalOffset()
    },
    getParentWindow () {
      let parent = this.$parent
      let parentName = parent.componentName
      while (parentName !== 'VueWindow') {
        parent = parent.$parent
        if (!parent) {
          return this
        }
        parentName = parent.componentName
      }
      return parent
    },
    getModalOffset () {
      let thisWindow = this
      this.offset = {
        left: this.$el.offsetLeft,
        top: this.$el.offsetTop
      }
      while (!thisWindow.isRootWindow) {
        thisWindow = thisWindow.getParentWindow()
        this.offset.left += thisWindow.offset.left
        this.offset.top += thisWindow.offset.top
      }
    },
    idle () {}
  }
}
</script>
<style lang="less">
  @import './style/flex-layout';
  @import './style/index';
</style>
