<template>
  <input type="button" @click="capture"/>
</template>

<script>
  import $ from 'jquery'
  export default {
    name: 'capture-button',
    props: {
      target: {
        type: String,
        required: true
      }
    },
    methods: {
      capture () {
        const target = document.querySelector(`${this.target}`)
        if (!target) {
          throw new Error('CaptureButton could not find target for given selector.')
        }
        const svgs = document.querySelectorAll(`${this.target} svg`)
        svgs.forEach(svg => {
          svg.setAttribute('version', '1.1')
          svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
          svg.insertAdjacentHTML('afterbegin', this.getDefs())
        })
        $(target).wrap('<div id="fjs-capture-container"></div>')
        const b64 = window.btoa(window.decodeURIComponent(window.encodeURIComponent(target.innerHTML)))
        const blob = this.b64toBlob(b64, 'image/svg+xml')
        const blobUrl = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style = 'display: none'
        a.href = blobUrl
        a.download = 'capture.svg'
        a.click()
        window.URL.revokeObjectURL(blobUrl)
        // TODO remove defs again
      },
      b64toBlob (b64Data, contentType, sliceSize) {
        contentType = contentType || ''
        sliceSize = sliceSize || 512
        const byteCharacters = window.atob(b64Data)
        const byteArrays = []
        for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
          const slice = byteCharacters.slice(offset, offset + sliceSize)
          const byteNumbers = new Array(slice.length)
          for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i)
          }
          const byteArray = new Uint8Array(byteNumbers)
          byteArrays.push(byteArray)
        }
        return new window.Blob(byteArrays, {type: contentType})
      },
      getDefs () {
        const rules = []
        for (let sheet of document.styleSheets) {
          for (let rule of sheet.cssRules) {
            if (rule instanceof window.CSSStyleRule) {
              rules.push(rule.cssText)
            }
          }
        }
        return `<defs><style type="text/css"><![CDATA[${rules.join('')}]]></style></defs>`
      }
    }
  }
</script>

<style lang="sass" scoped>

</style>
