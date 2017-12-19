# Notes

## Dropbox
- [JS API](https://www.dropbox.com/developers/documentation/javascript#tutorial)
  - `npm i dropbox`
  - [documentation](http://dropbox.github.io/dropbox-sdk-js/)
  - [examples](https://github.com/dropbox/dropbox-sdk-js/tree/master/examples/javascript)
  - [Note: fetch api is required: `npm i isomorphic-fetch`](https://www.npmjs.com/package/isomorphic-fetch)
  - [OAuth](https://www.dropbox.com/developers/reference/oauth-guide)
  - File Request
    - for receiving large files, etc. (up to 2/20GB) from anyone
    - [docs](https://www.dropbox.com/help/files-folders/create-file-request)
- Create App w/ permissions
  - [Dropbox App console](https://www.dropbox.com/developers/apps)
- [API Explorer](https://dropbox.github.io/dropbox-api-v2-explorer/#files_list_folder)
  - `filesListFolder` to list folder contents
  - `filesDownload` to download file (with path)
  - `filesUpload` to upload file
    - (Upload arguments](http://dropbox.github.io/dropbox-sdk-js/global.html#FilesCommitInfo)


## Licence: Apache 2.0
- [choosealicence](https://choosealicense.com/licenses/apache-2.0/)


## Editor: ProseMirror
- [prosemirror.net](https://prosemirror.net/)
- [markdown in ProseMirror](https://prosemirror.net/examples/markdown/)


## Module bundling: rollup.js
- [rollupjs.org](https://rollupjs.org/)
- `ENOSPC` error - watcher needs fix for [maximum file watches](https://stackoverflow.com/questions/16748737/grunt-watch-error-waiting-fatal-error-watch-enospc#comment28148277_17437601)

## Serving: express.js
- [`express.static`](https://expressjs.com/en/4x/api.html#example.of.express.static)
