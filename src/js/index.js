import { notify } from './notifications.js'
import { list as listDocuments, save, load, sync } from './persistence.js'
import { default as initAutosave } from './autosave.js'
import { default as initEditor } from './editor.js'
import { default as initQuickswitch } from './quickswitch.js'

const $ = document.querySelector.bind(document)

const EDITOR = document.querySelector('textarea')
const DOCSELECT = document.querySelector('aside select')

autosize(EDITOR)

listDocuments()
initAutosave()
initEditor()
initQuickswitch()

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
