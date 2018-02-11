'use strict'

import { default as STATE } from './state.js'


const html = `
<div id="overlay">
  <div class="input">
    <input name="quickswitch">
  </div>
  <ul class="switchmatch">
  </ul>
</div>
`

export default function init() {
  // Capture Ctrl+s and save the doc instead of popping up the native save dialog
  document.addEventListener('keydown', (e) => {
    if (e.key === 'l' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      open()
    }
  }, true)

  const css = document.createElement('link')
  css.rel = 'stylesheet'
  css.href = '/css/quickswitch.css'
  document.head.appendChild(css)

  console.log('QuickSwitch enabled.')
}

function open() {
  document.body.insertAdjacentHTML('beforeend', html);

  const input = document.querySelector('#overlay input')
  const list = document.querySelector('#overlay .switchmatch')

  let notes = ( STATE.get('notes') || []).map(n => {
    const node = document.createElement('li')
    node.textContent = n.name
    node.hidden = true

    return Object.assign({
      $node: node,
      // Convert to lower case and ignore file extension for more precise matching
      $name: n.name.toLowerCase().substr(0,n.name.length-3)
    }, n)
  })

  // Add list of items
  notes.forEach(item => {
    list.appendChild(item.$node)
  })

  let selection = 0
  input.addEventListener('keydown', e => {
    console.log(e)
    if (e.key === 'Escape') close()
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      notes[selection].$node.className =''

      selection += e.key === 'ArrowUp' ? -1 : 1
      selection = selection < 0 ? 0 : selection%notes.filter(n => n.relevance !== -1).length

      notes[selection].$node.className = 'selected'
    }
  }, true)

  input.addEventListener('input', e => {
    const search = input.value.toLowerCase()
    selection = 0

    notes.forEach(n => {
      // The earlier we match the more the current item floats to the top
      // matches on 0 (start of the string) get the best position
      // -1 (no match) gets hidden
      n.relevance = n.$name.indexOf(search)

      n.$node.hidden = search === '' || n.relevance === -1
      // TODO: instead of empty list show recents instead
      // TODO: order by earliest match
    })

    notes.sort( (a,b) => {
      // Non matches go to the end of the list
       if (a.relevance === -1 && b.relevance >= 0) {
         return 1
       }
       if (b.relevance === -1 && a.relevance >= 0) {
         return -1
       }

      // Equal relevance, sort by name
      if (a.relevance === b.relevance) {
        return (a.name > b.name ? 1:0)
      }

      // Sort by relevance (match inded - the smaller the better)
      return a.relevance-b.relevance
    })

    // todo: sort existing items
    list.innerHTML = ''
    notes.forEach( (item, idx) => {
      if (idx === selection) {
        item.$node.className = 'selected'
      } else {
        item.$node.className =''
      }

      list.appendChild(item.$node)
    })
  })

  input.focus()
}

function close() {
  document.querySelector('#overlay').remove()
  document.querySelector('textarea').focus()
}
