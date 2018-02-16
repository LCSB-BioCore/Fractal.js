<template>
    <g>
        <!--FF does not position empty g. foreignObject does not count hence the 1x1 rect with 0 opacity.-->
        <rect width="1" height="1" style="opacity: 0"></rect>
        <foreignObject>
            <div class="fjs-html-content"
                 ref="htmlContent"
                 v-bind="$attrs"
                 :style="{left: computedLeft, top: computedTop, 'z-index': zIndex}">
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
        posY: 0,
        width: 0,
        height: 0
      }
    },
    props: {
      left: {
        type: Number,
        default: 0,
        required: false
      },
      top: {
        type: Number,
        default: 0,
        required: false
      },
      right: {
        type: Number,
        default: 0,
        required: false
      },
      bottom: {
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
      computedLeft () {
        if (typeof this.$options.propsData.right === 'undefined') {
          return this.posX + this.left + 'px'
        } else {
          return this.posX + this.right - this.width + 'px'
        }
      },
      computedTop () {
        if (typeof this.$options.propsData.bottom === 'undefined') {
          return this.posY + this.top + 'px'
        } else {
          return this.posY + this.bottom - this.height + 'px'
        }
      }
    },
    methods: {
      setPosition () {
        this.posX = this.$el.getBoundingClientRect().x
        this.posY = this.$el.getBoundingClientRect().y
      }
    },
    updated () {
      this.width = this.$refs.htmlContent ? this.$refs.htmlContent.children[0].offsetWidth : 0
      this.height = this.$refs.htmlContent ? this.$refs.htmlContent.children[0].offsetHeight : 0
    },
    mounted () {
      let vm = this.$parent
      while (vm.$options.name !== 'chart') {
        vm = vm.$parent
      }
      vm.$el.appendChild(this.$refs.htmlContent)
      this.$nextTick(this.setPosition)
      window.addEventListener('scroll', this.setPosition, true)
    },
    beforeDestroy () {
      this.$refs.htmlContent.remove()
      window.removeEventListener('scroll', this.setPosition, true)
    }
  }
</script>

<style lang="sass" scoped>
    .fjs-html-content
        position: fixed
        transform: translateZ(0) /*This is a redraw fix for FF*/
</style>
