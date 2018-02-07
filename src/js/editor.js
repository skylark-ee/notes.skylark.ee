const EDITOR = document.querySelector('textarea')

export default function init() {
  tabHandling()
}

function tabHandling() {
  EDITOR.addEventListener('keydown', e => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const txt = e.target
      const tv = txt.value
      let cur = txt.selectionStart
      let lns = cur

      // Find line start
      while (lns > 0 && (lns<1 || tv[lns-1] !== '\n')) --lns;

      if (e.shiftKey) {
        if (tv.substring(lns,lns+2) == '  ') {
          txt.value = tv.substring(0,lns) + tv.substring(lns+2)
          cur-=2
        }
      } else {
        txt.value = tv.substring(0,lns) + '  ' + tv.substring(lns)
        cur+=2
      }
      // TODO: multiline (selection) tab handling

      txt.selectionStart = txt.selectionEnd = cur
    }
  })
}
