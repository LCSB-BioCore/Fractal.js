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
        const chartWidth = this.$parent.$el.parentNode.getBoundingClientRect().width
        const chartHeight = this.$parent.$el.parentNode.getBoundingClientRect().height
        const fontSize = Math.ceil((chartHeight < chartWidth ? chartHeight : chartWidth) / 50)
        this.$el.style['font-size'] = fontSize + 'pt'
        this.$emit('resize', {height: chartHeight, width: chartWidth})
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
    border: 2px solid rgba(0, 0, 0, 0)
    &:hover
      border: 2px solid rgba(41, 213, 255, 0.3)
</style>
