<template>
  <div class="fjs-control-panel"
       :style="{left: tweened.position.left + 'px'}"
       @mouseover="showPanel"
       @mouseout="hidePanel">
    <span class="fjs-lock-btn" v-html="lockIcon" @click="toggleLock"></span>
    <slot></slot>
    <task-view></task-view>
    <div class="fjs-balancer"></div>
  </div>
</template>

<script>
  import TaskView from './TaskView.vue'
  import { TweenLite } from 'gsap'
  export default {
    name: 'control-panel',
    data () {
      return {
        locked: false,
        tweened: {
          position: {
            left: 0
          }
        }
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
      },
      showPanel () {
        if (this.locked) {
          return
        }
        const panelWidth = window.innerWidth - this.$el.getBoundingClientRect().width
        return TweenLite.to(this.tweened.position, 0.75, {left: panelWidth})
      },
      hidePanel () {
        if (this.locked) {
          return
        }
        return TweenLite.to(this.tweened.position, 0.75, {left: window.innerWidth * 0.98})
      }
    },
    mounted () {
      window.addEventListener('resize', () => {
        this.locked = false
        this.hidePanel()
      })
      this.tweened.position.left = window.innerWidth
      this.showPanel().eventCallback('onComplete', this.hidePanel)
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
    top: 0
    padding: 1%
    height: 100%
    .fjs-lock-btn
      margin-bottom: auto
      cursor: pointer
    .fjs-balancer
      margin-top: auto
</style>
