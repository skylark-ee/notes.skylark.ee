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

function filesInBoth(source1, source2) {
  // All files in source 1...
  return source1.filter(
    // ...that can also be found in source 2
    s1 => source2.filter(s2 => s2.name === s1.name).length > 0
  )
}
function filesNotInTheOther(source1, source2) {
  // All files in source 1...
  return source1.filter(
    // ...that are not represented in source 2
    s1 => source2.filter(s2 => s2.name === s1.name).length === 0
  )
}
function filesWhere(source1, source2, criteria) {
  return source1.filter(
    s1 => source2.filter(s2 => s2.name === s1.name && criteria(s1,s2)).length > 0
  )
}
function filesDiscard(source, criteria) {
  let idx
  while ((idx = source.findIndex(criteria)) >= 0) {
    source.splice(idx,1)
  }
}

// Resolves file sync issues in a way that avoids data loss
// Uploads edited files if they were unchanged, also new files
// Downloads changed files if they weren't edited, also new files
// Warns about clashes and deleted files
function resolveThreeWay(dbxCached, dbxOnline, local) {
  const outcome = { download: [], upload: [], delete: [], conflict: [], log: [] }

  // Find new online files
  // (all files currently online, that we don't know of in the list of cached docs)
  filesNotInTheOther(dbxOnline, dbxCached)
  .forEach(
    newdoc => {
      outcome.download.push(newdoc)
      outcome.log.push(`Download new file: ${newdoc.name}`)
    }
  )

  // Find new local files
  // (all local files that weren't originally from Dropbox, so they are not in cached docs)
  filesNotInTheOther(local, dbxCached)
  .forEach(
    newdoc => {
      outcome.upload.push(newdoc)
      outcome.log.push(`Create new file: ${newdoc.name}`)
    }
  )

  // Find new deleted files
  // (all files that were previously in dropbox (cached), but now are gone (online))
  filesNotInTheOther(dbxCached, dbxOnline)
  .forEach(
    staledoc => {
      outcome.delete.push(staledoc)
      outcome.log.push(`Delete file: ${staledoc.name}`)
    }
  )

  // Updated files
  // (all cached files that have been changed in dropbox changed since the last sync)
  filesWhere(dbxCached, dbxOnline, (c,o) => c.content_hash !== o.content_hash)
  .forEach(doc => {
    outcome.download.push(doc)
    outcome.log.push(`Download changes: ${doc.name}`)
  })

  // Edited local files
  // (all files in the filesystem that are originally from dropbox but has changed locally)
  filesWhere(dbxCached, local, (c,l) => c.content_hash !== l.content_hash)
  .forEach(doc => {
    outcome.upload.push(doc)
    outcome.log.push(`Save changes: ${doc.name}`)
  })

  // Conflicting sync
  // (a file is queued for both upload & download)
  filesInBoth(outcome.upload, outcome.download)
  .forEach(doc => {
    // Register conflict
    outcome.conflict.push(doc)
    outcome.log.push(`Conflicts prevented changes: ${doc.name}`)

    // Prevent changes
    filesDiscard(outcome.upload, up => doc.name===up.name)
    filesDiscard(outcome.download, dl => doc.name===dl.name)
  })
  // TODO: Changed locally and deleted on server

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

function deleteLocalFile(file) {
  const path = `${APIDIR}/notes/${file.name}`

  return Promise.resolve().then(_ => {
    if (fs.existsSync(path)) {
      fs.unlinkSync(path)

      console.log(`Removed × ${file.name}`)
    }
  })

  // Handle errors
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
      const del = outcome.delete.map(file => dryRun ? Promise.resolve('RM: '+file.name) : deleteLocalFile(file))

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
