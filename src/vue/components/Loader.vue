<template>
  <div class="fjs-loader"></div>
</template>

<script>
  export default {
    name: 'loader'
  }
</script>

<style lang="sass" scoped>
  $size: 20px !default
  $thickness: 3px !default
  $base-color: #fff !default
  $wheel-color: #c30 !default
  $speed: 800ms !default
  .fjs-loader
    margin: 5% auto
    height: $size
    width: $size
    border: $thickness solid $base-color
    border:
      right-color: $wheel-color
      top-color: $wheel-color
      radius: 100%
    animation: spin $speed infinite linear

  @keyframes spin
    from
      transform: rotate(0deg)
    to
      transform: rotate(359deg)
</style>
