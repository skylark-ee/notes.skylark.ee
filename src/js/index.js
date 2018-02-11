import { notify } from './notifications.js'
import { list as listDocuments, save, load, sync } from './persistence.js'
import { default as initAutosave } from './autosave.js'
import { default as initEditor } from './editor.js'
import { default as initQuickswitch } from './quickswitch.js'

const $ = document.querySelector.bind(document)

const EDITOR = document.querySelector('textarea')
const DOCSELECT = document.querySelector('aside select')


listDocuments()
initAutosave()
initEditor()
initQuickswitch()

$('aside ul button[name="menu"]').addEventListener('click', event => $('aside').classList.toggle('closed'))

$('aside ul button[name="loaddoc"]').addEventListener('click', event => load(DOCSELECT.value))
$('aside ul button[name="savedoc"]').addEventListener('click', event => save(DOCSELECT.value).then(_ => $('aside').classList.add('closed')))

$('aside ul button[name="incfontsize"]').addEventListener('click', event => {
  let s = parseInt(EDITOR.style.fontSize)
  EDITOR.style.fontSize = (isNaN(s) ? 110 : s+10)+'%'
})
$('aside ul button[name="decfontsize"]').addEventListener('click', event => {
  let s = parseInt(EDITOR.style.fontSize)
  EDITOR.style.fontSize = (isNaN(s) ? 90 : s-10)+'%'
})

DOCSELECT.addEventListener('change', event => {
  window.location.hash = `#${event.target.value}`
  load(event.target.value)
})


$('aside ul button[name="startsync"]').addEventListener('click', event => sync())


$('aside ul button[name="newdoc"]').addEventListener('click', event => {
  let filename = prompt('Enter filename:\n(.md will be appended automatically)', 'unnamed')
  if (!filename) return

  // Append markdown extension
  if (!filename.match(/\.md$/)) filename += '.md'

  DOCSELECT.insertAdjacentHTML( 'beforeend', `<option>${filename}</option>`)
  DOCSELECT.value = filename

  EDITOR.value = ''
  save(filename).then(_ => load(filename))

  window.location.hash = `#${filename}`
  listDocuments()
})

// Capture Ctrl+S and save the doc instead of popping up the native save dialog
document.addEventListener('keydown', (e) => {
  if (e.key === "s" && (e.ctrlKey || e.metaKey)) {
    e.preventDefault()

    console.log('Saving!', e)
    save(DOCSELECT.value)
  }
})
