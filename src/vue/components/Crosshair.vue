<template>
    <g v-show="show">
        <line class="fjs-crosshair" :x2="width" :y1="posY" :y2="posY"></line>
        <line class="fjs-crosshair" :x1="posX" :x2="posX" :y2="height"></line>
    </g>
</template>

<script>
  export default {
    name: 'crosshair',
    data () {
      return {
        posX: 0,
        posY: 0,
        mouseWithin: false
      }
    },
    props: {
      width: {
        type: Number,
        required: true
      },
      height: {
        type: Number,
        required: true
      }
    },
    mounted () {
      this.$el.parentNode.addEventListener('mousemove', this.setMousePos)
      this.$el.parentNode.addEventListener('mouseenter', () => { this.mouseWithin = true })
      this.$el.parentNode.addEventListener('mouseleave', () => { this.mouseWithin = false })
    },
    beforeDestroy () {
      this.$el.parentNode.removeEventListener('mousemove', this.setMousePos)
      this.$el.parentNode.removeEventListener('mouseenter', () => { this.mouseWithin = true })
      this.$el.parentNode.removeEventListener('mouseleave', () => { this.mouseWithin = false })
    },
    methods: {
      setMousePos (event) {
        this.posX = event.clientX - this.$el.getBoundingClientRect().x
        this.posY = event.clientY - this.$el.getBoundingClientRect().y
      }
    },
    computed: {
      show () {
        return this.posX >= 0 && this.posX <= this.width &&
          this.posY >= 0 && this.posY <= this.height &&
          this.mouseWithin
      }
    }
  }
</script>

<style lang="sass" scoped>
    .fjs-crosshair
        stroke: black
        stroke-width: 1px
        shape-rendering: crispEdges
</style>
