// Is a polyfill
require('isomorphic-fetch')

// Initial app config
const CONFIG = require('../config.json')

// Dropbox API
const Dropbox = require('dropbox')
const dbx = new Dropbox({ accessToken: CONFIG.ACCESS_TOKEN })

const fs = require('fs-extra')

const APIDIR = __dirname+'/../data/api'



// List all markdown files
function getDocs(response) {

  return (typeof response.entries === 'object' ? response.entries : response).map(
    doc => (typeof doc === 'object' ? doc : ({ name: doc }))
  ).filter(
    f => f.name.match(/\.md$/)
  )
}

function localFiles() {
  const dir = fs.readdirSync(APIDIR+'/notes')
  const files = getDocs(dir).map(doc => ({ name: doc.name, content_hash: module.exports.dropboxHash(`${APIDIR}/notes/${doc.name}`) }))

  return files
}

// Resolves file sync issues in a way that avoids data loss
// Uploads edited files if they were unchanged, also new files
// Downloads changed files if they weren't edited, also new files
// Warns about clashes and deleted files
function resolveThreeWay(dbxCached, dbxOnline, local) {
  const outcome = { download: [], upload: [], delete: [], conflict: [], log: [] }

  // Find new online files
  dbxOnline.filter(
    onl => dbxCached.filter(c => c.name === onl.name).length === 0
  ).map(
    newdoc => {
      outcome.download.push(newdoc)
      outcome.log.push(`Downloaded new file: ${newdoc.name}`)
    }
  )

  // Find new local files
  local.filter(
    loc => dbxCached.filter(c => c.name === loc.name).length === 0
  ).map(
    newdoc => {
      outcome.upload.push(newdoc)
      outcome.log.push(`Created new file: ${newdoc.name}`)
    }
  )

  // Find new deleted files
  dbxCached.filter(
    c => dbxOnline.filter(onl => onl.name === c.name).length === 0
  ).map(
    staledoc => {
      outcome.delete.push(staledoc)
      outcome.log.push(`Deleted file: ${staledoc.name}`)
    }
  )

  // Updated files
  dbxCached.forEach(c => {
    const onl = dbxOnline.filter(onl => onl.name === c.name)[0]

    if (onl && onl.content_hash !== c.content_hash) {
      outcome.download.push(onl)
      outcome.log.push(`Updated to newer version: ${onl.name}`)
    }
  })

  // Edited local files
  local.forEach(loc => {
    const c = dbxCached.filter(c => c.name === loc.name)[0]

    if (c && c.content_hash !== loc.content_hash) {
      outcome.upload.push(loc)
      outcome.log.push(`Saving changes: ${loc.name}`)
    }
  })

  // TODO: check for clashes/conflicts
  // Changed on server & locally
  // Changed locally and deleted on server

  return outcome
}

function uploadDropboxFile(file, retries = 3) {
  return dbx.filesUpload({
    path: file.path_lower || '/'+file.name.toLowerCase(),
    mode: 'overwrite',
    contents: fs.readFileSync(`${APIDIR}/notes/${file.name}`)
  })
  .then(_ => console.log(`Synced ↑ ${file.name}`))

  // Watch out for errors
  .catch(error => {
    // too_many_write_operations concurrent file-write error, try again a bit later
    if (error.status === 429) {
      console.log(`[!] Error 429: ${file.name} (retries: ${retries})`)
      return new Promise(resolve => setTimeout(_ => resolve(uploadDropboxFile(file, retries-1)), Math.random()*2000))
    }

    fs.writeFileSync('./data/error.json', JSON.stringify(error, null, 4))
    console.log(`Error ${error.status}: see error.json for details`)
  })
}

function downloadDropboxFile(file) {
  return dbx.filesDownload({ path: file.path_lower || '/'+file.name.toLowerCase() })
    .then(file => {
      // Fix encoding issue for utf8 files
      const b = new Buffer(file.fileBinary, 'binary')

      fs.writeFileSync(`${APIDIR}/notes/${file.name}`, b, 'utf8')
      console.log(`Synced ↓ ${file.name}`)
      return file
    })

    // Watch out for errors
    .catch(error => {
      fs.writeFileSync('./data/error.json', JSON.stringify(error, null, 4))
      console.log(`Error ${error.toString().substring(0,20)}: see error.json for details`)
    })
}

module.exports.dropboxFiles = function() {
  // Only interested in markdown files
  return dbx.filesListFolder({path: ''}).then(response => getDocs(response))
}

module.exports.dropboxFilesCached = function() {
  try {
    return JSON.parse(fs.readFileSync(`${APIDIR}/docs.json`)).filter(
      // Only list files that are originally from dropbox
      file => !!file.rev
    )
  }
  catch (e) {
    return []
  }
}

module.exports.dropboxSync = function(dryRun = false) {
  fs.ensureDirSync(`${APIDIR}/`)
  fs.ensureDirSync(`${APIDIR}/notes`)

  return module.exports.dropboxFiles()
    .then(online => {
      return resolveThreeWay(module.exports.dropboxFilesCached(),online,localFiles())
    })
    .then(outcome => {
      // Upload all changes
      const up = outcome.upload.map(file => dryRun ? Promise.resolve('UL: '+file.name) : uploadDropboxFile(file))

      // Download all files
      const down = outcome.download.map(file => dryRun ? Promise.resolve('DL: '+file.name) : downloadDropboxFile(file))

      // Delete files
      const del = outcome.delete.map(file => dryRun ? Promise.resolve('RM: '+file.name) : Promise.resolve(fs.existsSync(file.name)&&fs.unlinkSync(file.name)))

      // Log
      console.log((dryRun?'[DRY RUN] ':'')+'Sync results:\n> '+outcome.log.join('\n> '))

      return Promise.all(up.concat(down, del)).then(_ => outcome)
    })
    // Update "last sync" cache status
    .then(outcome => {
      return module.exports.dropboxFiles().then(online => {
        if (dryRun) {
          fs.writeFileSync(`${APIDIR}/docs.dry-run.json`, JSON.stringify(online, null, 4), 'utf8')
        } else {
          fs.writeFileSync(`${APIDIR}/docs.json`, JSON.stringify(online, null, 4), 'utf8')
        }
      }).then(_ => outcome)
    })

    // Watch out for errors
    .catch(error => {
      fs.writeFileSync('./data/error.json', JSON.stringify(error, null, 4))
      console.log(error)
      console.log(`Error ${error.status}: see error.json for details`)
    })

}

module.exports.dropboxHash = function(filename) {
  let hasher = require('./dropbox-content-hasher').create()
  let file = fs.readFileSync(filename)

  hasher.update(file)
  let hash = hasher.digest('hex')
  return hash
}

//console.log(localFiles())
//console.log(module.exports.dropboxFilesCached())
//module.exports.dropboxFiles().then(online => {
//  console.log(resolveThreeWay(module.exports.dropboxFilesCached(),online,localFiles()))
//}).catch(e => console.log(e))
