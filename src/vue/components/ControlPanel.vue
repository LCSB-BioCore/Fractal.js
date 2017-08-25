<template>
  <div class="fjs-control-panel"
       :style="{width: shown ? '15vw' : '1vw'}"
       v-show="focused"
       @mouseover="locked ? noop() : show()"
       @mouseout="locked ? noop() : hide()">
    <div class="fjs-panel-header">
      <span v-show="shown">{{ chartName }}</span>
      <i class="fjs-lock-btn material-icons" @click="toggleLock">{{ lockIcon }}</i>
    </div>
    <span class="fjs-panel-label" v-show="!shown">Control Panel</span>
    <div v-show="shown">
      <slot></slot>
      <hr class="fjs-seperator"/>
      <task-view></task-view>
    </div>
  </div>
</template>

<script>
  import TaskView from './TaskView.vue'
  import store from '../../store/store'
  export default {
    name: 'control-panel',
    props: {},
    data () {
      return {
        focused: true,
        locked: false,
        expanded: false,
        shown: true,
        tweened: {
          position: {
            left: 0
          }
        }
      }
    },
    computed: {
      lockIcon () {
        return this.locked ? 'lock' : 'lock_open'
      },
      chartName () {
        return this.$parent.$parent.$options.name
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
        this.expanded = true
        this.propagateState()
        this.shown = true
      },
      hide (animate) {
        animate = typeof animate === 'undefined' ? true : animate
        this.expanded = false
        this.propagateState()
        this.shown = false
      },
      focus () {
        this.unfocusAll()
        this.focused = true
        this.$nextTick(() => {
          this.expanded ? this.show(false) : this.hide(false)
        })
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
        this.expanded ? this.show(false) : this.hide(false)
      })
      this.hide()
    },
    created () {
      store.dispatch('addControlPanel', this)
      this.unfocusAll()
      this.focused = true
    },
    components: {
      TaskView
    }
  }
</script>

<style lang="sass" scoped>
  @import './src/assets/base.sass'

  .fjs-control-panel
    background: rgba(0, 0, 0, 0.5)
    color: white
    position: fixed
    display: flex
    flex-direction: column
    justify-content: flex-start
    top: 0
    left: 0
    padding: 1vh
    height: 100vh
    overflow-y: auto
    flex-shrink: 0
    font-size: 0.875em
    .fjs-panel-header
      display: flex
      justify-content: space-between
      margin-bottom: 1vh
    .fjs-lock-btn
      cursor: pointer
    .fjs-panel-label
      text-anchor: middle
      font-size: 1em
      font-style: italic
      transform: translate(0,50vh)rotate(-90deg)
      /*remove any margin after rotation*/
      margin: -100vw
</style>
