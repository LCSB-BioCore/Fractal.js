<template>
    <g>
        <foreignObject class="fjs-foreign-object"
                       :x="computedX"
                       :y="computedY"
                       :width="width"
                       :height="height"
                       :style="{'z-index': zIndex}">
            <body xmlns="http://www.w3.org/1999/xhtml"
                  class="fjs-canvas-body"
                  :style="{'z-index': zIndex}">
            <canvas class="fjs-canvas"></canvas>
            </body>
        </foreignObject>
    </g>
</template>

<script>
  export default {
    name: 'svg-canvas',
    data () {
      return {
        scrollX: 0,
        scrollY: 0
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
      zIndex: {
        type: Number,
        default: -1,
        required: false
      }
    },
    computed: {
      computedX () {
        return this.x - this.scrollX
      },
      computedY () {
        return this.y - this.scrollY
      }
    },
    methods: {
      makeHighDPICanvas () {
        const canvas = this.$el.querySelector('.fjs-canvas')
        const ctx = canvas.getContext('2d')
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        canvas.width = this.width * window.devicePixelRatio
        canvas.height = this.height * window.devicePixelRatio
        canvas.style.width = this.width + 'px'
        canvas.style.height = this.height + 'px'
        ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0)
        ctx.putImageData(imgData, 0, 0, 0, 0, canvas.width, canvas.height)
      },
      scrollCorrection () {
        // we need this scrolling fix only on Chrome
        if (typeof window.chrome !== 'undefined') {
          this.scrollX = window.scrollX
          this.scrollY = window.scrollY
        } else {
          this.scrollX = 0
          this.scrollY = 0
        }
      }
    },
    updated () {
      this.makeHighDPICanvas()
    },
    mounted () {
      this.$nextTick(this.makeHighDPICanvas)
      this.$nextTick(this.scrollCorrection)
      window.addEventListener('scroll', this.scrollCorrection)
    },
    destroyed () {
      window.removeEventListener('scroll', this.scrollCorrection)
    }
  }
</script>

<style lang="sass" scoped>
    .fjs-foreign-object
        position: relative
    .fjs-canvas-body
        margin: 0
        position: fixed
        top: 0
        left: 0
        width: 100%
        height: 100%
    .fjs-canvas
        display: block
        width: 100%
        height: 100%
</style>
