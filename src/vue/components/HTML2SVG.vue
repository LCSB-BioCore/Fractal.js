<template>
    <g>
        <!--FF does not position empty g. foreignObject does not count hence the 1x1 rect with 0 opacity.-->
        <rect width="1" height="1" style="opacity: 0"></rect>
        <foreignObject>
            <div class="fjs-html-content"
                 ref="htmlContent"
                 v-bind="$attrs"
                 :style="{left: computedX + 'px', top: computedY + 'px', 'z-index': zIndex}">
                <slot/>
            </div>
        </foreignObject>
    </g>
</template>

<script>
  export default {
    name: 'html2svg',
    data () {
      return {
        posX: 0,
        posY: 0
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
      zIndex: {
        type: Number,
        default: 0,
        required: false
      }
    },
    computed: {
      computedX () {
        return this.posX + this.x
      },
      computedY () {
        return this.posY + this.y
      }
    },
    methods: {
      setPosition () {
        this.posX = this.$el.getBoundingClientRect().x
        this.posY = this.$el.getBoundingClientRect().y
      }
    },
    mounted () {
      let vm = this.$parent
      while (vm.$options.name !== 'chart') {
        vm = vm.$parent
      }
      vm.$el.appendChild(this.$refs.htmlContent)
      this.$nextTick(this.setPosition)
      window.addEventListener('scroll', this.setPosition)
    },
    beforeDestroy () {
      this.$refs.htmlContent.remove()
      window.removeEventListener('scroll', this.setPosition)
    }
  }
</script>

<style lang="sass" scoped>
    .fjs-html-content
        position: fixed
        transform: translateZ(0) /*This is a redraw fix for FF*/
</style>
