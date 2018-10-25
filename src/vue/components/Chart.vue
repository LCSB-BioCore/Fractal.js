<template>
  <div class="fjs-chart" @mousedown.capture="focusControlPanel">
    <div class="fjs-init-cover fjs-cover" @click="animate" ref="cover" v-show="showInitCover">
      <div>
        <span>Select</span>
      </div>
    </div>
    <div class="fjs-loading-cover fjs-cover" v-show="showLoadingCover">
      <loader class="fjs-loader"/>
    </div>
    <div class="fjs-error-cover fjs-cover" v-show="showErrorCover">
      <div>
        <span>{{ errorMessage }}</span>
      </div>
    </div>
    <slot/>
  </div>
</template>

<script>
  import ResizeObserver from 'resize-observer-polyfill'
  import Loader from './Loader.vue'
  import _ from 'lodash'
  export default {
    name: 'chart',
    components: {Loader},
    data () {
      return {
        observer: null,
        init: true
      }
    },
    mounted () {
      this.observer = new ResizeObserver(this.resize)
      this.observer.observe(this.$el)
      window.addEventListener('load', this.resize)
      this.resize()
    },
    beforeDestroy () {
      this.observer.disconnect()
      window.removeEventListener('load', this.resize)
    },
    computed: {
      showInitCover () {
        return !this.showLoadingCover && !this.showErrorCover && this.$parent.$data.__init
      },
      showErrorCover () {
        return !this.showLoadingCover && typeof this.errorMessage !== 'undefined'
      },
      showLoadingCover () {
        const key = _.findKey(this.$parent.$data.__tasks, task => task.state === 'SUBMITTED')
        return typeof key !== 'undefined'
      },
      errorMessage () {
        const key = _.findKey(this.$parent.$data.__tasks, task => task.state === 'FAILURE')
        return typeof key === 'undefined' ? key : this.$parent.$data.__tasks[key].message
      }
    },
    methods: {
      resize () {
        const width = this.$el.getBoundingClientRect().width - 1
        const height = this.$el.getBoundingClientRect().height - 1
        const fontSize = Math.ceil((height < width ? height : width) / 50)
        this.$el.style['font-size'] = fontSize + 'pt'
        this.$emit('resize', width, height)
      },
      focusControlPanel () {
        const controlPanel = this.$children.find(d => d.$options.name === 'control-panel')
        controlPanel.focus()
      },
      animate () {
        this.$refs.cover.classList.add('fjs-animate')
        window.setTimeout(() => this.$refs.cover.classList.remove('fjs-animate'), 300)
      }
    }
  }
</script>

<style lang="sass" scoped>
  @keyframes fjs-effect-click
    0%
      background: #fff
    50%
      background: #e6e6e6
    100%
      background: #fff
  .fjs-chart
    width: 100%
    height: 100%
    position: relative
    .fjs-animate
      animation: fjs-effect-click 300ms ease-in
    .fjs-cover
      display: table
      height: 100%
      width: 100%
      position: absolute
      top: 0
      left: 0
      z-index: 10
      div
        display: table-cell
        vertical-align: middle
        text-align: center
        span
          font-size: 1.5em
          background: #e6e6e6
          padding: 10px 20px 10px 20px
    .fjs-init-cover
      background: white
      cursor: pointer
      &:hover
        box-shadow: inset 0 0 0 2px #e6e6e6
    .fjs-loading-cover
      div
        span
    .fjs-error-cover
      div
        span
          background: #fffe86
          padding: 0
</style>
