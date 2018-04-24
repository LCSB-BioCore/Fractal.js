<template>
  <div class="fjs-chart" @mousedown.capture="focusControlPanel">
    <div class="fjs-init-cover" @click="animate" ref="cover" v-show="showCover">
      <div>
        <span>Select</span>
      </div>
    </div>
    <slot/>
  </div>
</template>

<script>
  import ResizeObserver from 'resize-observer-polyfill'
  export default {
    name: 'chart',
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
      showCover () {
        return this.$parent.$data.__init
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
    .fjs-init-cover
      display: table
      height: 100%
      width: 100%
      position: absolute
      top: 0
      left: 0
      z-index: 10
      background: white
      cursor: pointer
      &:hover
        box-shadow: inset 0 0 0 2px #e6e6e6
      div
        display: table-cell
        vertical-align: middle
        text-align: center
        span
          font-size: 1.5em
          background: #e6e6e6
          padding: 10px 20px 10px 20px
</style>
