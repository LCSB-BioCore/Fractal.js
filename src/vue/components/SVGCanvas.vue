<template>
    <g>
        <foreignObject class="fjs-foreign-object"
                       :x="x"
                       :y="y"
                       :width="width"
                       :height="height"
                       :style="{'z-index': zIndex}">
            <body xmlns="http://www.w3.org/1999/xhtml"
                  class="fjs-canvas-body"
                  :style="{'z-index': zIndex}">
            <canvas class="fjs-canvas" :width="width" :height="height"></canvas>
            </body>
        </foreignObject>
    </g>
</template>

<script>
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
      zIndex: {
        type: Number,
        default: -1,
        required: false
      }
    },
    computed: {
      attrChangeIndicator () {
        return [this.height, this.width, this.x, this.y].join(' ')
      }
    },
    watch: {
      'attrChangeIndicator': {
        handler: function () {
          this.$nextTick(this.makeHighDPICanvas)
        }
      }
    },
    methods: {
      makeHighDPICanvas () {
        const canvas = this.$el.querySelector('.fjs-canvas')
        canvas.width = this.width * window.devicePixelRatio
        canvas.height = this.height * window.devicePixelRatio
        canvas.style.width = this.width + 'px'
        canvas.style.height = this.height + 'px'
        canvas.getContext('2d').setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0)
      }
    },
    mounted () {
      this.makeHighDPICanvas()
    }
  }
</script>

<style lang="sass" scoped>
    .fjs-canvas-body
        margin: 0
        position: fixed
        top: 0
        left: 0
    .fjs-foreign-object
        position: relative
</style>
