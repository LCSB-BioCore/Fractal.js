<template>
  <div class="fjs-chart" @mousedown.capture="focusControlPanel">
    <slot/>
  </div>
</template>

<script>
  import ResizeObserver from 'resize-observer-polyfill'
  export default {
    name: 'chart',
    data () {
      return {
        observer: null
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
    methods: {
      resize () {
        const width = this.$el.getBoundingClientRect().width
        const height = this.$el.getBoundingClientRect().height
        const fontSize = Math.ceil((height < width ? height : width) / 50)
        this.$el.style['font-size'] = fontSize + 'pt'
        this.$emit('resize', width, height)
      },
      focusControlPanel () {
        const controlPanel = this.$children.find(d => d.$options.name === 'control-panel')
        controlPanel.focus()
      }
    }
  }
</script>

<style lang="sass" scoped>
  .fjs-chart
    width: 100%
    height: 100%
    border: 2px solid rgba(0, 0, 0, 0)
    &:hover
      border: 2px solid rgba(41, 213, 255, 0.3)
</style>
