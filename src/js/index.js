import { notify } from './notifications.js'

const $ = document.querySelector.bind(document)

const EDITOR = document.querySelector('textarea')
const DOCSELECT = document.querySelector('aside select')
const HOST = window.location.host

autosize(EDITOR)

fetch(`/api/docs.json`, { credentials: 'same-origin' }).then(r => r.json()).then(docs => {
  DOCSELECT.innerHTML = docs.map(doc => `<option>${doc.name}</option>`).join('')

  let sel=(window.location.hash||'').substring(1);

  if (sel && docs.filter(d => d.name === sel).length) {
    setTimeout(_ => {
      console.log('Switched to', sel)
      DOCSELECT.value = sel
      load(sel)
    }, 50);
  } else {
    window.location.hash = ''
    load(docs[0].name)
  }
})

function load(doc) {
  return fetch(`/api/notes/${doc}`,  { credentials: 'same-origin' }).then(n => n.text()).then(note => {
    EDITOR.value = note
    autosize.update(EDITOR)
  })
}
function save(doc) {
  doc = doc || DOCSELECT.value

  return fetch(`/api/notes/${doc}`, {
      credentials: 'same-origin',
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: EDITOR.value })
  }).then(r => notify('Saved!', `${doc} - document updated.`))
}

function sync() {
  return fetch(`/api/sync`, { method: 'post', credentials: 'same-origin' })
  .then(r => r.json()).then(outcome => {
    console.log(outcome)
    // reload file list
    // load selection
  })

}

$('aside ul :nth-child(1)>button').addEventListener('click', event => $('aside').classList.toggle('closed'))

$('aside ul :nth-child(2)>button').addEventListener('click', event => load(DOCSELECT.value))
$('aside ul :nth-child(3)>button').addEventListener('click', event => save(DOCSELECT.value).then(_ => $('aside').classList.add('closed')))

$('aside ul :nth-child(4)>button').addEventListener('click', event => {
  let s = parseInt(EDITOR.style.fontSize)
  EDITOR.style.fontSize = (isNaN(s) ? 110 : s+10)+'%'
  autosize.update(EDITOR)
})
$('aside ul :nth-child(5)>button').addEventListener('click', event => {
  let s = parseInt(EDITOR.style.fontSize)
  EDITOR.style.fontSize = (isNaN(s) ? 90 : s-10)+'%'
  autosize.update(EDITOR)
})

DOCSELECT.addEventListener('change', event => {
  window.location.hash = `#${event.target.value}`
  load(event.target.value)
})


$('aside ul :nth-child(6)>button').addEventListener('click', event => sync())


$('aside ul :nth-child(7)>button').addEventListener('click', event => {
  let filename = prompt('Enter filename:\n(.md will be appended automatically)', 'unnamed')

  // Append markdown extension
  if (!filename.match(/\.md$/)) filename += '.md'

  DOCSELECT.insertAdjacentHTML( 'beforeend', `<option>${filename}</option>`)
  DOCSELECT.value = filename

  EDITOR.value = ''
  save(filename).then(_ => load(filename))

  window.location.hash = `#${filename}`
})

// Capture Ctrl+S and save the doc instead of popping up the native save dialog
document.addEventListener('keydown', (e) => {
  if (e.key === "s" && e.ctrlKey) {
    e.preventDefault()

    console.log('Saving!', e)
    save(DOCSELECT.value)
  }
})
