// inspired by https://vuejsfeed.com/blog/build-a-reusable-autocomplete-component-with-vue-2-1

<template>
  <div class="fjs-autocomplete">
    <input placeholder="Add Filter..."
           v-model="keyword"
           @focus="queryItems"
           @input="onInput"
           @keydown.enter="select"
           @keydown.down="moveDown"
           @keydown.up="moveUp"
           @keydown.esc="onEsc"/>
    <ul class="fjs-suggestions" v-show="showSuggestions">
      <li class="fjs-suggestion"
          :class="{highlight: i === highlightIdx}"
          @mouseenter="highlightIdx = i"
          @mousedown="select"
          v-for="item, i in suggestedItems">
        {{ item }}
      </li>
    </ul>
    <ul class="fjs-selections" v-show="selections.length">
      <li class="fjs-selection" v-for="selection in selections">
        <span class="fjs-clear-selection"@click="unselect(selection)">&#215;</span>{{ selection }}
      </li>
    </ul>
  </div>
</template>

<script>
  export default {
    name: 'autocomplete',
    data () {
      return {
        keyword: '',
        highlightIdx: 0,
        items: [],
        showSuggestions: false,
        selections: []
      }
    },
    props: {
      itemGetter: {
        type: Function,
        required: true
      },
      maxSuggestions: {
        type: Number,
        required: false,
        default: 5
      }
    },
    computed: {
      suggestedItems () {
        const re = new RegExp(this.keyword, 'i')
        return this.items
          .filter(item => !~this.selections.indexOf(item) && item.match(re))
          .slice(0, this.maxSuggestions)
      }
    },
    methods: {
      onInput () {
        this.highlightIdx = 0
        this.showSuggestions = !!this.keyword
      },
      onEsc () {
        this.showSuggestions = false
        this.highlightIdx = 0
      },
      queryItems () {
        if (this.items.length) {
          return
        }
        Promise.resolve(this.itemGetter()).then(items => {
          this.items = items
        })
      },
      moveDown () {
        if (!this.showSuggestions) {
          return
        }
        this.highlightIdx = (this.highlightIdx + 1) % this.suggestedItems.length
      },
      moveUp () {
        if (!this.showSuggestions) {
          return
        }
        this.highlightIdx = this.highlightIdx - 1 < 0 ? this.suggestedItems.length - 1 : this.highlightIdx - 1
      },
      select () {
        const selection = this.suggestedItems[this.highlightIdx]
        this.selections.push(selection)
        this.showSuggestions = false
        this.keyword = ''
      },
      unselect (selection) {
        this.selections.splice(this.selections.indexOf(selection), 1)
      }
    },
    watch: {
      'selections': {
        handler: function () {
          this.$emit('select', this.selections)
        }
      }
    }
  }
</script>

<style lang="sass" scoped>
  .fjs-autocomplete
    .fjs-suggestions
      list-style-type: none
      display: flex
      flex-direction: column
      width: 100%
      padding: 1px
      overflow: hidden
      .fjs-suggestion
        font-size: 0.75em
        display: inline-block
        margin: -1px 0 0 0
        width: 95%
        flex-wrap: wrap
        color: #fff
        padding: 0.25vh
        border: 1px dotted #fff
        cursor: pointer
        &.highlight
          background-color: #fff
          color: #000
    .fjs-selections
      list-style-type: none
      display: flex
      flex-direction: column
      width: 100%
      overflow: hidden
      padding: 0
      margin: 0.5vh 0 0 0
      .fjs-selection
        display: inline-block
        margin: 0
        font-size: 0.75em
        width: 95%
        flex-wrap: wrap
        color: #fff
        padding: 0.25vh
        .fjs-clear-selection
          cursor: pointer
          padding: 0 1vh 0 0
          font-size: 1.25em
</style>
