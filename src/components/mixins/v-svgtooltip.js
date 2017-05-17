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
