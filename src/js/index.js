const EDITOR = document.querySelector('textarea')
const HOST = window.location.host

autosize(EDITOR)

//fetch(`http://${HOST}/api/notes.json`)
fetch(`http://${HOST}/api/notes/skylark-processes.md`).then(n => n.text()).then(note => {
  EDITOR.value = note
  autosize.update(EDITOR)
})
