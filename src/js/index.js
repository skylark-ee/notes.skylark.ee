const $ = document.querySelector.bind(document)

const EDITOR = document.querySelector('textarea')
const HOST = window.location.host

autosize(EDITOR)

//fetch(`http://${HOST}/api/notes.json`)
fetch(`http://${HOST}/api/notes/skylark-processes.md`).then(n => n.text()).then(note => {
  EDITOR.value = note
  autosize.update(EDITOR)
})


$('aside ul :nth-child(1)>button').addEventListener('click', event => $('aside').classList.toggle('closed'))

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
