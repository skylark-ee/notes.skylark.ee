import { notify } from './notifications.js'
import { isModified, save, load } from './persistence.js'

const EDITOR = document.querySelector('textarea')
const DOCSELECT = document.querySelector('aside select')


export default function init() {
  document.addEventListener('visibilitychange', handleVisibilityChange, false);
  window.addEventListener('blur', handleVisibilityChange, false)
  EDITOR.addEventListener('focus', handleVisibilityChange, false)
  EDITOR.addEventListener('blur', handleVisibilityChange, false)

  console.log('Autosave mode active.')
}

// Check for unsaved modifications on tab blur/focus, and save them
// automatically if there were no conflicts (server's version updated)
// Similarly, update to latest server version if there were no unsaved
// local changes.
function handleVisibilityChange(e) {
  const doc = DOCSELECT.value

  isModified(doc).then(({ server, editor }) => {
    // Modified in editor, but not on server => autosave
    if (editor && !server) {
      save(doc).then(_ => console.log(`Auto-saved: ${doc}`))
    }
    // Modified on server, but not in editor => reload
    if (server && !editor) {
      load(doc).then(_ => console.log(`Fetched new version: ${doc}`))
    }

    // TODO: Conflict, modified on both

  })
}
