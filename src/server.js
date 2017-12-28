const path = require('path')
const fs = require('fs-extra')
const express = require('express')

const dropbox = require('./dropbox')

const API_PATH = path.join(__dirname, '../data/api/')

const app = new express()

app.use(express.static(path.join(__dirname, 'www')))
app.use(express.static(path.join(__dirname, '../data/build/')))
app.use('/api', express.static(API_PATH, { etag: false, maxAge: 0 }))

app.post('/api/notes/:filename', express.json(), (req,res) => {
  fs.writeFileSync(`${API_PATH}/notes/${req.params.filename}`, req.body.contents)
  res.sendStatus(200)
})

app.post('/api/sync', express.json(), (req,res) => {
  dropbox.dropboxSync().then(outcome => {
    res.json({ log: outcome.log })
  })
})

app.listen(3000, _ => console.log(`Started on :3000`))
