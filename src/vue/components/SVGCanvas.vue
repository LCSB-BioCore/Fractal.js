<template>
    <foreignObject :x="x" :y="y" :width="width" :height="height">
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
        x: 0,
        y: 0
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
        if (isFirefox) {
          // Firefox does not need the code below because it works correct
          return
        }
        let xOffset = 0
        let yOffset = 0
        let currentNode = this.$el.parentElement
        while (currentNode.tagName !== 'svg') {
          if (currentNode.hasAttribute('transform')) {
            const attr = currentNode.getAttribute('transform')
            if (attr) {
              xOffset += parseFloat(attr.match(/\((.+),/)[1].trim())
              yOffset += parseFloat(attr.match(/,(.+)\)/)[1].trim())
            }
          }
          currentNode = currentNode.parentElement
        }
        this.x = xOffset
        this.y = yOffset
      }
    }
  }
</script>

<style scoped>

</style>
