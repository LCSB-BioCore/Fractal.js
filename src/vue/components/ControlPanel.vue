<template>
  <div :class="`fjs-control-panel fjs-vm-uid-${this._uid}`">
    <span class="fjs-lock-btn" v-html="lockIcon" @click="toggleLock"></span>
    <slot></slot>
    <task-view></task-view>
    <div class="fjs-balancer"></div>
  </div>
</template>

<script>
  import TaskView from './TaskView.vue'
  export default {
    name: 'control-panel',
    data () {
      return {
        locked: false
      }
    },
    computed: {
      lockIcon () {
        return this.locked ? '&#128274;' : '&#128275;'
      }
    },
    methods: {
      toggleLock () {
        this.locked = !this.locked
        console.log(this.locked)
      }
    },
    components: {
      TaskView
    }
  }
</script>

<style lang="sass" scoped>
  .fjs-control-panel
    background: rgba(0, 0, 0, 0.8)
    color: white
    position: fixed
    display: flex
    flex-direction: column
    justify-content: center
    right: 0
    top: 0
    padding: 1%
    height: 100%
    width: 15%
    .fjs-lock-btn
      margin-bottom: auto
      cursor: pointer
    .fjs-balancer
      margin-top: auto
</style>
