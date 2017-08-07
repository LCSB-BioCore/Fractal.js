<template>
  <div class="fjs-chart">
    <slot></slot>
  </div>
</template>

<script>
  export default {
    name: 'chart'
  }
</script>

<style lang="sass" scoped>
  .fjs-chart
    border: 2px solid rgba(0, 0, 0, 0)
    &:hover
      border: 2px solid #29d5ff
</style>
