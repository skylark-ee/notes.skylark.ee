'use strict'

const CFG = require('../config.json')

const path = require('path')
const fs = require('fs-extra')
const qs = require('querystring')

const ppc = require('ppc-messaging')

const SESSION_PATH = path.join(__dirname, '../data/session')
fs.ensureDirSync(SESSION_PATH)



module.exports = {
  handler
}

function handler(req, res) {
  // Log in button clicked
  if (req.body && req.body['login']) {
    const originalUrl = req.body['original_url'] || '/'
    const message = {
      extra_fields: CFG.AUTH.extra_fields
    }
    const enc = ppc.encryptMessage(
      CFG.AUTH.client_id,
      CFG.AUTH.public_key,
      message
    )
    fs.writeFileSync(path.join(SESSION_PATH, enc.message_id+'.json'), JSON.stringify({
      timestamp: Date.now(),
      original_url: originalUrl,
    }))

    return res.redirect(CFG.AUTH.server + '?' + qs.stringify({
      c: CFG.AUTH.client,
      pm: enc.contents
    }))
  }

  // Encrypted response will be in `pm` query parameter
  if (!req.query.pm) {
    return res.sendStatus(403)
  }

  const resp = ppc.decryptResponse(CFG.AUTH.client_id, req.query.pm)
  const sk = resp.message['session_id'].split(':')[0]
  fs.writeFileSync(path.join(SESSION_PATH, sk+'.json'), JSON.stringify(resp.message))

  // TODO: shorter lived cookies and reauthenticate with central auth
  // TODO: also make it possible for central auth to revoke sessions (when user removes
  // devices post onto auth endpoint and revoke session)
  res.cookie('$auth', resp.message.session_id, {
    secure: true,
    httpOnly: false, // allow to be used in Fetch
    maxAge: 2*30*24*3600*1000 // 2 months
  })
  //TODO: setcookie for device name, no expiration, use this as default: on auth renewal req.body.extra_fields.skylark_notes_device
  let savedRequest = JSON.parse(fs.readFileSync(path.join(SESSION_PATH, resp.reply_to+'.json')))
  // TODO: remove file
  res.redirect(savedRequest.original_url)
}
