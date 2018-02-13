<template>
  <input type="button" @click="capture" :value="buttonName"/>
</template>

<script>
  import html2canvas from 'html2canvas'
  export default {
    name: 'capture-button',
    props: {
      target: {
        type: window.HTMLElement,
        required: true
      },
      ignore: {
        type: Array,
        required: false
      },
      buttonName: {
        type: String,
        default: 'Capture Chart',
        required: false
      }
    },
    methods: {
      capture () {
        Array.prototype.forEach.call(this.ignore, el => {
          el.setAttribute('data-html2canvas-ignore', '')
        })
        const svgs = this.target.querySelectorAll('svg')
        svgs.forEach(svg => {
          svg.setAttribute('version', '1.1')
          svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
        })
        html2canvas(this.target).then(canvas => {
          const dataUrl = canvas.toDataURL()
          const a = document.createElement('a')
          a.style = 'display: none'
          a.href = dataUrl
          a.download = 'capture.png'
          a.click()
          window.URL.revokeObjectURL(dataUrl)
        }).then(() => {
          Array.prototype.forEach.call(this.ignore, el => {
            el.removeAttribute('data-html2canvas-ignore')
          })
        })
      }
    }
  }
</script>
