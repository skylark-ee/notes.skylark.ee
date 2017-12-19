// Is a polyfill
require('isomorphic-fetch')

// Initial app config
const CONFIG = require('config.json')

// Dropbox API
const Dropbox = require('dropbox')
const fs = require('fs')


// List & download all public notes
let dbx = new Dropbox({ accessToken: CONFIG.ACCESS_TOKEN });
dbx.filesListFolder({path: ''})
  .then(response => {
    fs.writeFileSync('./data/response.json', JSON.stringify(response))

    // Save file list
    docs = getDocs(response)
    fs.writeFileSync('./data/docs.txt', docs.map(f => f.path_display).join('\n'))

    // Save all notes
    return Promise.all(docs.map(
      note => dbx.filesDownload({ path: note.path_lower })
        .then(file => {
          fs.writeFileSync(`./data/notes/${file.name}`, file.fileBinary)
          return response
        })
    ))
  })

  // Upload devlog
  .then(responses => {
    return dbx.filesUpload({
      path: '/notes-devlog.md',
      mode: 'overwrite',
      contents: fs.readFileSync('./devlog.md')
    })
  })

  // Watch out for errors
  .catch(function(error) {
    fs.writeFileSync('./data/error.json', JSON.stringify(error))
    console.log(`Error ${error.status}: see error.json for details`)
  })


// List all markdown files
function getDocs(response) {
  return response.entries.filter(f => f.name.match(/\.md$/))
}
