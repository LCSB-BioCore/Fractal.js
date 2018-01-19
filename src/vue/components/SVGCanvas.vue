<template>
    <g>
        <!--FF does not position empty g. foreignObject does not count hence the 1x1 rect with 0 opacity.-->
        <rect width="1" height="1" style="opacity: 0"></rect>
        <foreignObject>
            <canvas :class="name" :style="{'z-index': zIndex}" v-bind="$attrs"></canvas>
        </foreignObject>
    </g>
</template>

<script>
  export default {
    name: 'svg-canvas',
    data () {
      return {
        canvas: null
      }
    },
    props: {
      x: {
        type: Number,
        default: 0,
        required: false
      },
      y: {
        type: Number,
        default: 0,
        required: false
      },
      height: {
        type: Number,
        required: true
      },
      width: {
        type: Number,
        required: true
      },
      name: {
        type: String,
        required: true
      },
      zIndex: {
        type: Number,
        default: -1,
        required: false
      }
    },
    computed: {
      sizeChangeIndicator () {
        return [this.width, this.height].join(' ')
      },
      positionChangeIndicator () {
        return [this.x, this.y].join(' ')
      }
    },
    watch: {
      'sizeChangeIndicator': {
        handler: function () {
          this.setCanvasPosition()
          this.makeHighDPICanvas()
        }
      },
      'positionChangeIndicator': {
        handler: function () {
          this.setCanvasPosition()
        }
      }
    },
    methods: {
      makeHighDPICanvas () {
        const scaleRatio = window.devicePixelRatio * 4
        const ctx = this.canvas.getContext('2d')
        // const imgData = ctx.getImageData(0, 0, this.canvas.width, this.canvas.height)
        this.canvas.width = this.width * scaleRatio
        this.canvas.height = this.height * scaleRatio
        this.canvas.style.width = this.width + 'px'
        this.canvas.style.height = this.height + 'px'
        ctx.setTransform(scaleRatio, 0, 0, scaleRatio, 0, 0)
        // ctx.putImageData(imgData, 0, 0, 0, 0, this.canvas.width, this.canvas.height)
      },
      setCanvasPosition () {
        this.canvas.style.top = this.$el.getBoundingClientRect().y + this.y + 'px'
        this.canvas.style.left = this.$el.getBoundingClientRect().x + this.x + 'px'
      }
    },
    mounted () {
      this.canvas = this.$el.querySelector('canvas')
      let vm = this.$parent
      while (vm.$options.name !== 'chart') {
        vm = vm.$parent
      }
      vm.$el.appendChild(this.canvas)
      this.setCanvasPosition()
      this.makeHighDPICanvas()
      window.addEventListener('scroll', this.setCanvasPosition)
    },
    destroyed () {
      this.canvas.remove()
      window.removeEventListener('scroll', this.setCanvasPosition)
    }
  }
</script>

<style lang="sass" scoped>
    canvas
        position: fixed
</style>
