<template>
    <html2svg ref="html2svg" :x="x" :y="y" :z-index="zIndex">
        <canvas ref="canvas" :class="name" v-bind="$attrs"></canvas>
    </html2svg>
</template>

<script>
  import Html2svg from '../components/HTML2SVG.vue'
  export default {
    name: 'svg-canvas',
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
      }
    },
    watch: {
      'sizeChangeIndicator': {
        handler: function () {
          this.makeHighDPICanvas()
          this.$refs.html2svg.setPosition()
        }
      }
    },
    methods: {
      makeHighDPICanvas () {
        const scaleRatio = window.devicePixelRatio
        const canvas = this.$refs.canvas
        const ctx = canvas.getContext('2d')
        // const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        canvas.width = this.width * scaleRatio
        canvas.height = this.height * scaleRatio
        canvas.style.width = this.width + 'px'
        canvas.style.height = this.height + 'px'
        ctx.setTransform(scaleRatio, 0, 0, scaleRatio, 0, 0)
        // ctx.putImageData(imgData, 0, 0, 0, 0, canvas.width, canvas.height)
      }
    },
    mounted () {
      this.makeHighDPICanvas()
    },
    components: {
      Html2svg
    }
  }
</script>

<style lang="sass" scoped>
    canvas
        position: fixed
</style>
