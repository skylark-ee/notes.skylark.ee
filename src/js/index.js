const EDITOR = document.querySelector('textarea')

autosize(EDITOR)

//fetch(`http://notes.skylark.local/api/notes.json`)
fetch(`http://notes.skylark.local/api/notes/skylark-processes.md`).then(n => n.text()).then(note => {
  EDITOR.value = note
  autosize.update(EDITOR)
})
