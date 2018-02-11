'use strict'

import { default as STATE } from './state.js'
import { notify } from './notifications.js'
import { isModified, save, switchTo as loadAndSwitch } from './persistence.js'


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
  // Hook quickswitch overlay to Ctrl+L or a menu button click
  document.querySelector('aside ul button[name="quickswitch"]').addEventListener('click', open)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'l' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      open(e)
    }
    if (e.key === 'Enter') {
      // TODO: use STATE or a module-wide selection variable instead
      switchTo(document.querySelector('#overlay .selected').textContent.trim())
    }
  }, true)

  // Swipe down on menu button for quick switch
  let swipe
  document.querySelector('aside ul button[name="menu"]').addEventListener('touchstart', e => {
    e.preventDefault()
    swipe = { start: e.touches[0].screenY }
  })
  document.querySelector('aside ul button[name="menu"]').addEventListener('touchmove', e => {
    swipe.move = e.touches[0].screenY
  })
  document.querySelector('aside ul button[name="menu"]').addEventListener('touchend', e => {
    console.log(swipe)

    if (swipe.move - swipe.start > 20) {
      open()
    }
  })

  const css = document.createElement('link')
  css.rel = 'stylesheet'
  css.href = '/css/quickswitch.css'
  document.head.appendChild(css)

  console.log('QuickSwitch enabled.')
}



function switchTo(newdoc) {
  const doc = STATE.get('activeDocument')
  const DOCSELECT = document.querySelector('aside select')

  isModified(doc).then(({ server, editor }) => {
    let save = Promise.resolve()

    // Modified in editor, but not on server => autosave
    if (editor && !server) {
      save = save(doc).then(_ => console.log(`Saved: ${doc}`))
    }

    if (editor && server) {
      return notify('Document switch prevented', `Local changes to ${doc} conflict with online copy — cancelled document switching to prevent data loss.`)
    }

    save
      .then(_ => loadAndSwitch(newdoc))
      .then(_ => {
        // Close overlay
        close()

        // Close menu
        document.querySelector('aside').classList.add('closed')

        // Focus editor
        document.querySelector('textarea').focus()
        // TODO: remember last cursor/scroll position
        document.querySelector('textarea').selectionStart = 0
        document.querySelector('textarea').selectionEnd = 0
      })
  })
}

function open() {
  document.body.insertAdjacentHTML('beforeend', html);

  const input = document.querySelector('#overlay input')
  const list = document.querySelector('#overlay .switchmatch')

  // Touch-friendly close
  list.addEventListener('click', close)

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
