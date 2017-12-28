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
  return response.entries.filter(f => f.name.match(/\.md$/))
}


module.exports.dropboxSync = function() {
  return dbx.filesListFolder({path: ''})
    .then(response => {
      fs.writeFileSync('./data/response.json', JSON.stringify(response))

      // Save file list
      docs = getDocs(response)
      fs.ensureDirSync(APIDIR);
      fs.writeFileSync(`${APIDIR}/docs.json`, JSON.stringify(docs.map(f => f.path_display.substring(1))))

      return docs
    })

    // Save all notes
    .then(docs => {
      fs.ensureDirSync(APIDIR+'/notes')
      return Promise.all(docs.map(
        note => dbx.filesDownload({ path: note.path_lower })
          .then(file => {
            fs.writeFileSync(`${APIDIR}/notes/${file.name}`, file.fileBinary)
            console.log(`Synced ${file.name}`)
            return file
          })
      ))
    })

    // Watch out for errors
    .catch(error => {
      fs.writeFileSync('./data/error.json', JSON.stringify(error))
      console.log(error)
      console.log(`Error ${error.status}: see error.json for details`)
    })

}


module.exports.dropboxSave = function() {
  return dbx.filesUpload({
    path: '/notes-devlog.md',
    mode: 'overwrite',
    contents: fs.readFileSync('./devlog.md')
  })

  // Watch out for errors
  .catch(error => {
    fs.writeFileSync('./data/error.json', JSON.stringify(error))
    console.log(`Error ${error.status}: see error.json for details`)
  })

}


module.exports.dropboxHash = function(filename) {
  let hasher = require('./dropbox-content-hasher').create()
  let file = fs.readFileSync(filename)

  hasher.update(file)
  let hash = hasher.digest('hex')
  console.log(hash)
  return hash
}
