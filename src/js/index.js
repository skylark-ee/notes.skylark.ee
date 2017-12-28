const $ = document.querySelector.bind(document)

const EDITOR = document.querySelector('textarea')
const DOCSELECT = document.querySelector('aside select')
const HOST = window.location.host

autosize(EDITOR)

fetch(`http://${HOST}/api/docs.json`).then(r => r.json()).then(docs => {
  DOCSELECT.innerHTML = docs.map(doc => `<option>${doc}</option>`).join('')
})

function load(doc) {
  return fetch(`http://${HOST}/api/notes/${doc}`).then(n => n.text()).then(note => {
    EDITOR.value = note
    autosize.update(EDITOR)
  })
}
function save(doc) {
  return fetch(`/api/notes/${DOCSELECT.value}`, {
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: EDITOR.value }) }
  ).then(r => console.log('Saved'))
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
  load(event.target.value)
})
