/**
 * This directive can be used to add tooltips to your svg elements.
 * HowTo use:
 *  1. import it similar to this: `import svgtooltip from '../directives/v-svgtooltip'`
 *  2. add it to the `mixins` key of your Vue component: `mixins: [svgtooltip]`
 *  3. import the css to style the tooltip: `<style> @import './src/assets/svgtooltip.sass'` ...
 *  4. use it on any svg element you like: `<rect v-svgtooltip='myTooltip'>` where myTooltip is an JS object.
 */

import * as d3 from 'd3'
import d3Tip from 'd3-tip'; d3.tip = d3Tip

const tip = d3.tip()
  .attr('class', 'fjs-d3-tip')
  .offset([-15, 0])
  .html(d => {
    let html = ''
    const keys = Object.keys(d)
    keys.forEach((key, idx) => {
      html += `<span>${key}: ${d[key]}</span>`
      html += idx === keys.length - 1 ? '' : '<br/>'
    })
    return html
  })

export default {
  mounted () {
    d3.select(this.$el.querySelector('svg')).call(tip)
  },
  directives: {
    svgtooltip: {
      update: function (el, binding) {
        d3.select(el).on('mouseover', () => {
          tip.show(binding.value)
        })
        d3.select(el).on('mouseout', tip.hide)
      }
    }
  }
}
