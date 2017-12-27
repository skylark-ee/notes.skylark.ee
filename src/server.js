const path = require('path')
const express = require('express')

const app = new express()

app.use(express.static(path.join(__dirname, 'www')))
app.use(express.static(path.join(__dirname, '../data/build/')))
app.use('/api', express.static(path.join(__dirname, '../data/api/')))

app.listen(3000, _ => console.log(`Started on :3000`))
