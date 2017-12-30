const $ = document.querySelector.bind(document)

const EDITOR = document.querySelector('textarea')
const DOCSELECT = document.querySelector('aside select')
const HOST = window.location.host

autosize(EDITOR)

fetch(`http://${HOST}/api/docs.json`, { credentials: 'same-origin' }).then(r => r.json()).then(docs => {
  DOCSELECT.innerHTML = docs.map(doc => `<option>${doc.name}</option>`).join('')

  let sel=(window.location.hash||'').substring(1);
  console.log(sel)
  if (sel && docs.indexOf(sel)!==-1) {
    DOCSELECT.value = sel;
    load(sel);
  }
})

function load(doc) {
  return fetch(`http://${HOST}/api/notes/${doc}`,  { credentials: 'same-origin' }).then(n => n.text()).then(note => {
    EDITOR.value = note
    autosize.update(EDITOR)
  })
}
function save(doc) {
  return fetch(`/api/notes/${DOCSELECT.value}`, {
      credentials: 'same-origin',
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: EDITOR.value })
  }).then(r => console.log('Saved'))
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
