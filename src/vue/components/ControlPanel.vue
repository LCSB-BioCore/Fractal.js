<template>
  <div class="fjs-control-panel"
       :style="{left: tweened.position.left + 'px'}"
       v-show="focused"
       @mouseover="locked ? noop() : show()"
       @mouseout="locked ? noop() : hide()">
    <span class="fjs-lock-btn" v-html="lockIcon" @click="toggleLock"></span>
    <slot></slot>
    <task-view></task-view>
    <div class="fjs-balancer"></div>
  </div>
</template>

<script>
  import TaskView from './TaskView.vue'
  import { TweenLite } from 'gsap'
  import store from '../../store/store'
  export default {
    name: 'control-panel',
    props: {
      focus: {
        type: String,
        required: true
      }
    },
    data () {
      return {
        focused: true,
        locked: false,
        expanded: false,
        tweened: {
          position: {
            left: 0
          }
        }
      }
    },
    computed: {
      lockIcon () {
        return this.locked ? '&#128274;' : '&#128275;'
      }
    },
    methods: {
      noop () {},
      toggleLock () {
        this.locked = !this.locked
        this.propagateState()
      },
      show (animate) {
        animate = typeof animate === 'undefined' ? true : animate
        const panelWidth = window.innerWidth - this.$el.getBoundingClientRect().width
        this.expanded = true
        this.propagateState()
        return TweenLite.to(this.tweened.position, animate ? 0.75 : 0, {left: panelWidth})
      },
      hide (animate) {
        animate = typeof animate === 'undefined' ? true : animate
        this.expanded = false
        this.propagateState()
        return TweenLite.to(this.tweened.position, animate ? 0.75 : 0, {left: window.innerWidth * 0.98})
      },
      unFocus () {
        this.focused = false
      },
      unfocusAll () {
        store.getters.controlPanels.forEach(panel => {
          panel.unFocus()
        })
      },
      propagateState () {
        store.getters.controlPanels.forEach(panel => {
          panel.locked = this.locked
          panel.expanded = this.expanded
        })
      }
    },
    mounted () {
      window.addEventListener('resize', () => {
        this.locked = false
        this.hide()
      })
      this.tweened.position.left = window.innerWidth
      this.show().eventCallback('onComplete', this.hide)
    },
    created () {
      store.dispatch('addControlPanel', this)
      this.$parent.$on(this.focus, () => {
        this.unfocusAll()
        this.focused = true
        this.$nextTick(() => {
          this.expanded ? this.show(false) : this.hide(false)
        })
      })
      this.unfocusAll()
      this.focused = true
    },
    components: {
      TaskView
    }
  }
</script>

<style lang="sass" scoped>
  .fjs-control-panel
    background: rgba(0, 0, 0, 0.8)
    color: white
    position: fixed
    display: flex
    flex-direction: column
    justify-content: center
    top: 0
    padding: 1%
    height: 100%
    min-width: 15vw
    .fjs-lock-btn
      margin-bottom: 20%
      cursor: pointer
    .fjs-balancer
      margin-top: auto
</style>
