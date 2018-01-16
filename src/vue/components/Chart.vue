<template>
  <div class="fjs-chart" @mousedown.capture="focusControlPanel">
    <slot></slot>
  </div>
</template>

<script>
  import $ from 'jquery'
  export default {
    name: 'chart',
    data () {
      return {
        updateInterval: null
      }
    },
    mounted () {
      // this interval code fixes a rendering issue in several browsers by forcing a redraw every 250ms
      this.updateInterval = window.setInterval(() => {
        $(this.$el).hide().show(0)
      }, 250)
      window.addEventListener('resize', this.resize)
      window.addEventListener('load', this.resize)
      this.resize()
    },
    beforeDestroy () {
      window.clearInterval(this.updateInterval)
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
        const controlPanel = this.$children.filter(d => d.$options.name === 'control-panel')[0]
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
