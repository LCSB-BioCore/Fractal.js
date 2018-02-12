<template>
  <div class="fjs-chart" @mousedown.capture="focusControlPanel">
    <slot/>
  </div>
</template>

<script>
  export default {
    name: 'chart',
    mounted () {
      window.addEventListener('resize', this.resize)
      window.addEventListener('load', this.resize)
      this.resize()
    },
    beforeDestroy () {
      window.removeEventListener('resize', this.resize)
      window.removeEventListener('load', this.resize)
    },
    methods: {
      resize () {
        const width = this.$parent.$el.parentNode.getBoundingClientRect().width
        const height = this.$parent.$el.parentNode.getBoundingClientRect().height
        const fontSize = Math.ceil((height < width ? height : width) / 50)
        this.$el.style['font-size'] = fontSize + 'pt'
        this.$emit('resize', {width, height})
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
