<template>
  <path class="fjs-icon" :d="path"></path>
</template>

<script>
  export default {
    name: 'icon',
    props: {
      shape: {
        required: true
      },
      size: {
        type: Number,
        required: true
      },
      cx: {
        type: Number,
        required: true
      },
      cy: {
        type: Number,
        required: true
      }
    },
    data () {
      return {
        shapes: {
          'diamond': `M ${this.cx} ${this.cy} m 0 ${-0.5 * this.size} l ${0.5 * this.size} ${0.5 * this.size} l ${-0.5 * this.size} ${0.5 * this.size} l ${-0.5 * this.size} ${-0.5 * this.size} Z`,
          'rectangle': `M ${this.cx} ${this.cy} m ${-0.5 * this.size} ${-0.5 * this.size} h ${this.size} v ${this.size} h ${-this.size} Z`,
          'triangle': `M ${this.cx} ${this.cy} m 0 ${-0.5 * this.size} l ${0.5 * this.size} ${this.size} h ${-this.size} Z`
        }
      }
    },
    computed: {
      path () {
        if (isNaN(this.shape)) {
          return this.shapes[this.shape]
        } else {
          return this.shapes[Object.keys(this.shapes)[parseInt(this.shape) % Object.keys(this.shapes).length]]
        }
      }
    }
  }
</script>

<style lang="sass" scoped>
</style>
