<template>
  <div class="fjs-chart">
    <slot></slot>
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
        this.$nextTick(() => {
          const chartWidth = this.$parent.$el.parentNode.getBoundingClientRect().width
          const chartHeight = this.$parent.$el.parentNode.getBoundingClientRect().height
          const fontSize = Math.ceil((chartHeight < chartWidth ? chartHeight : chartWidth) / 50)
          this.$el.style['font-size'] = fontSize + 'pt'
        })
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
