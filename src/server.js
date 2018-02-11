'use strict'

const CFG = require('../config.json')

const path = require('path')
const fs = require('fs-extra')

const express = require('express')
const cookieParser = require('cookie-parser')

const dropbox = require('./dropbox')

const API_PATH = path.join(__dirname, '../data/api')



const app = new express()
app.use(cookieParser())


// Authentication handler (has to come before auth cookie handling)
app.all('/auth', express.urlencoded({ extended: false }), require('./server-auth').handler)

// Auth cookie handling
app.use(require('./server-session').handler)


// JS-bundle
app.get('/js/bundle.js', (req,res) => {
  const rollup = require('rollup')
  rollup.rollup({
    input: __dirname+'/js/index.js'
  })
    .then(bundle => bundle.generate({
      format: 'iife',
      sourcemap: 'inline'
    }))
    .then(result => {
      res.type('application/javascript').send(result.code)
    })
    .catch(e => {
      console.log(e)
      res.status(500).send('/* ROLLUP: '+e+' */')
    })
})

// Static asset hosting
app.use(express.static(path.join(__dirname, 'www')))
app.use(express.static(path.join(__dirname, '../data/build/')))
app.use('/api', express.static(API_PATH, { etag: false, maxAge: 0 }))

// Store a document
app.post('/api/notes/:filename', express.json(), (req,res) => {
  const filename = req.params.filename

  fs.writeFileSync(`${API_PATH}/notes/${filename}`, req.body.contents)

  // Update docs.json if this is a new file
  const docsfile = fs.readFileSync(`${API_PATH}/docs.json`).toString()
  const docs = JSON.parse(docsfile)
  if (!docs.filter(d => d.name === filename).length) {
    docs.push({ name: filename, size: req.body.contents.length, content_hash: '' })
  }
  fs.writeFileSync(`${API_PATH}/docs.json`, JSON.stringify(docs))


  res.sendStatus(200)
})

// Start Dropbox two-way syinc
app.post('/api/sync', express.json(), (req,res) => {
  dropbox.dropboxSync().then(outcome => {
    res.json({ log: outcome.log })
  })
})


// Start server
app.listen(3000, _ => console.log(`Started on :3000`))
