import { notify } from './notifications.js'

const EDITOR = document.querySelector('textarea')
const DOCSELECT = document.querySelector('aside select')

const SERVER_DOCS = []


export function list() {
  return fetch(`/api/docs.json`, { credentials: 'same-origin' }).then(r => r.json()).then(docs => {
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
}

export function load(doc) {
  return fetch(`/api/notes/${doc}`,  { credentials: 'same-origin' }).then(n => n.text()).then(note => {
    EDITOR.value = SERVER_DOCS[doc] = note
    autosize.update(EDITOR)
  })
}

export function save(doc) {
  doc = doc || DOCSELECT.value

  return fetch(`/api/notes/${doc}`, {
      credentials: 'same-origin',
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: EDITOR.value })
  }).then(r => {
    SERVER_DOCS[doc] = EDITOR.value
    notify('Saved!', `${doc} - document updated.`)
  })
}

export function sync() {
  return fetch(`/api/sync`, { method: 'post', credentials: 'same-origin' })
  .then(r => r.json()).then(outcome => {
    console.log(outcome)
    // reload file list
    // load selection
  })
}

export function isModified(doc) {
  return fetch(`/api/notes/${doc}`, { credentials: 'same-origin' }).then(n => n.text()).then(note => {

    /*
    Promise.all([
      sha1(note),
      sha1(EDITOR.value),
      sha1(SERVER_DOCS[doc]),
    ]).then(hash => console.log('server: ', hash[0], 'current:', hash[1], 'last:', hash[2] ))
    */

    return ({
      // Modified on server since last load
      server: note !== SERVER_DOCS[doc],
      editor: EDITOR.value !== SERVER_DOCS[doc]
    })
  })
}

/*
function sha1(str) {
  return crypto.subtle.digest('SHA-1', new TextEncoder("utf-8").encode(str)).then(r => hex(r));
}

function hex(buffer) {
  var hexCodes = [];
  var view = new DataView(buffer);
  for (var i = 0; i < view.byteLength; i += 4) {
    // Using getUint32 reduces the number of iterations needed (we process 4 bytes each time)
    var value = view.getUint32(i)
    // toString(16) will give the hex representation of the number without padding
    var stringValue = value.toString(16)
    // We use concatenation and slice for padding
    var padding = '00000000'
    var paddedValue = (padding + stringValue).slice(-padding.length)
    hexCodes.push(paddedValue);
  }

  // Join all the hex strings into one
  return hexCodes.join("");
}
*/
