<template>
  <div class="fjs-control-panel"
       :style="{left: left, right: right}"
       v-show="focused && !hidden"
       @mouseover="show()"
       @mouseout="hide()">
    <span class="fjs-panel-label" v-show="!expanded">Control Panel</span>
    <div class="fjs-panel-header">
      <span v-show="expanded">{{ name }}</span>
      <i class="fjs-lock-btn material-icons" @click="toggleLock">{{ lockIcon }}</i>
    </div>
    <div class="fjs-panel-content" v-show="expanded">
      <slot/>
    </div>
    <div class="fjs-links" v-show="expanded">
      <a href="https://github.com/LCSB-BioCore/Fractalis-Issues/issues/new/choose" target="_blank">Report Issues</a>
      <a href="https://fractalis.lcsb.uni.lu" target="_blank">About</a>
      <a href="https://doi.org/10.1093/gigascience/giy109" target="_blank">Cite</a>
      <span>Version: {{ version }}</span>
    </div>
  </div>
</template>

<script>
  import store from '../../store/store'
  import { version } from '../../../package.json'
  export default {
    name: 'control-panel',
    data () {
      return {
        focused: true,
        version
      }
    },
    props: {
      name: {
        type: String,
        required: true
      }
    },
    computed: {
      locked () {
        return store.getters.controlPanel.locked
      },
      expanded () {
        return store.getters.controlPanel.expanded
      },
      hidden () {
        return store.getters.options.controlPanelHidden
      },
      lockIcon () {
        return this.locked ? 'lock' : 'lock_open'
      },
      left () {
        return store.getters.options.controlPanelPosition === 'left' ? 0 : ''
      },
      right () {
        return store.getters.options.controlPanelPosition === 'right' ? 0 : ''
      }
    },
    methods: {
      toggleLock () {
        store.dispatch('setControlPanel', {locked: !store.getters.controlPanel.locked})
      },
      show () {
        if (!this.locked) {
          store.dispatch('setControlPanel', {expanded: true})
        }
      },
      hide () {
        if (!this.locked) {
          store.dispatch('setControlPanel', {expanded: false})
        }
      },
      focus () {
        this.unfocusAll()
        this.focused = true
        this.$nextTick(() => {
          this.expanded ? this.show() : this.hide()
        })
      },
      unFocus () {
        this.focused = false
      },
      unfocusAll () {
        store.getters.controlPanel.panels.forEach(panel => panel.unFocus())
      }
    },
    mounted () {
      this.unfocusAll()
      this.focused = true
      const panels = [...store.getters.controlPanel.panels, this]
      store.dispatch('setControlPanel', {panels})
    },
    beforeDestroy () {
      const panels = store.getters.controlPanel.panels.filter(panel => panel._uid !== this._uid)
      store.dispatch('setControlPanel', {panels})
    }
  }
</script>

<style lang="sass" scoped>
  @import '~assets/base.sass'

  .fjs-control-panel
    background: rgba(0, 0, 0, 0.5)
    color: white
    position: fixed
    display: flex
    flex-direction: column
    justify-content: flex-start
    top: 0
    padding: 1vh
    max-width: 20vw
    height: 100vh
    overflow-y: auto
    flex-shrink: 0
    font-size: calc(0.5vh + 7px) /* min 7px */
    z-index: 9999
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
    .fjs-links
      position: absolute
      bottom: 4vh
      a
        color: #fff
        text-decoration: none
        margin-right: 0.5vw
</style>
