<template>
    <div class="fjs-drag" :style="{left, top}">
        <slot/>
    </div>
</template>

<script>
  export default {
    name: 'draggable',
    data () {
      return {
        left: 0,
        top: 0,
        offsetX: 0,
        offsetY: 0
      }
    },
    methods: {
      moveDiv (event) {
        this.left = (event.clientX - this.offsetX) + 'px'
        this.top = (event.clientY - this.offsetY) + 'px'
      },
      mouseDown (event) {
        this.offsetX = event.clientX - this.$el.offsetLeft
        this.offsetY = event.clientY - this.$el.offsetTop
        window.addEventListener('mousemove', this.moveDiv, true)
      },
      mouseUp (event) {
        window.removeEventListener('mousemove', this.moveDiv, true)
      }
    },
    mounted () {
      this.$el.addEventListener('mousedown', this.mouseDown, false)
      window.addEventListener('mouseup', this.mouseUp, false)
    },
    beforeDestroy () {
      this.$el.removeEventListener('mousedown', this.mouseDown, false)
      window.removeEventListener('mouseup', this.mouseUp, false)
    }
  }
</script>

<style lang="sass" scoped>
    .fjs-drag
        position: absolute
        white-space: nowrap
    .fjs-drag *
        cursor: move
</style>
