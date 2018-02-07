'use strict'

const CFG = require('../config.json')

const path = require('path')
const fs = require('fs-extra')

const SESSION_PATH = path.join(__dirname, '../data/session')



module.exports = {
  handler
}

function handler(req, res, next) {
  if (req.cookies['$auth']) {
    const cookieSID = req.cookies['$auth']
    const sessPrefix = cookieSID.split(':')[0]

    let sessionData
    try {
      sessionData = JSON.parse(fs.readFileSync(path.join(SESSION_PATH, sessPrefix+'.json')))
    }
    catch(e) {
      // There was a problem checking the session cookie, mark session as invalid
      // and have the user re-authenticate their session
      console.log(e)
      sessionData = undefined
    }

    // Validate session
    if (sessionData && sessionData.session_id === cookieSID) return next()
  }

  // Show login button.
  // Pass current full url and redirect to it after successful auth (incl. #fragment)
  res.status(403).send(`
    <!doctype html>
    <html>
      <head><meta charset="utf8"><title>Login required</title>
      <style>
        body, html { min-height: 100%; background: #1DA1F2 }
        body { display: flex; justify-content: center; align-items: center; margin: 0; min-height: 100vh }
        button { font-size: 2em; padding: 1em }
      </style></head>
      <body>
      <form action="${CFG.AUTH.url}" method="post">
        <button name="login" value="1">Log in</button>
      </form>
      <script>document.forms[0].insertAdjacentHTML('beforeend', '<input type="hidden" name="original_url" value="'+window.location.href+'">')</script>
      </body>
    </html>
  `)
}
