<template>
    <foreignObject :x="computedX" :y="computedY" :width="width" :height="height">
        <body xmlns="http://www.w3.org/1999/xhtml"
              style="margin: 0; position: relative;"
              :style="{'z-index': zIndex}">
            <canvas :width="width" :height="height"></canvas>
        </body>
    </foreignObject>
</template>

<script>
  export default {
    name: 'svg-canvas',
    data () {
      return {
        computedX: 0,
        computedY: 0
      }
    },
    props: {
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
      },
      x: {
        type: Number,
        default: 0,
        required: false
      },
      y: {
        type: Number,
        default: 0,
        required: false
      }
    },
    computed: {
      size () {
        return [this.width, this.height].join()
      }
    },
    mounted () {
      this.computeOffset()
    },
    watch: {
      'size': {
        handler: function () {
          this.$nextTick(() => {
            this.computeOffset()
          })
        }
      }
    },
    methods: {
      // this entire method is only here because browsers are buggy and do not render foreignObject correctly
      computeOffset () {
        const isFirefox = typeof InstallTrigger !== 'undefined'  // detect browser via feature detection
        let x = this.x
        let y = this.y
        if (!isFirefox) {
          // Firefox does not need the code below because it works correct
          let currentNode = this.$el.parentElement
          while (currentNode.tagName !== 'svg') {
            if (currentNode.hasAttribute('transform')) {
              const attr = currentNode.getAttribute('transform')
              if (attr) {
                x += parseFloat(attr.replace(/ /g, '').match(/\((.+),/)[1].trim())
                y += parseFloat(attr.replace(/ /g, '').match(/,(.+)\)/)[1].trim())
              }
            }
            currentNode = currentNode.parentElement
          }
        }
        this.computedX = x
        this.computedY = y
      }
    }
  }
</script>

<style scoped>
</style>
