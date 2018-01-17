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
                <canvas :width="width" :height="height"></canvas>
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
