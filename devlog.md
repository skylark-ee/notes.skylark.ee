# Notes

## TODO
- Two-way Dropbox sync
- New file creation
- [proper menu icons](https://linearicons.com/free)
- Auth
  - setup new device experience (email + device name)
  - save random device id, send to server, server generates auth token, sends via email. user copy-pastes it & done. works until revoked.
- logging
- Private (=personal) docs
- Capture ctrl+s => save current edited doc

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

## Dropbox syncing plan
Need two local buffers (one for a "last-seen Dropbox cache" and one for changed docs).

Syncing goes something like this:

- download Dropbox file list
- mark files changed in Dropbox
- list local files
- add locals that were newly created
- warn of deleted files
- update/upload unchanged Dropbox files if local is changed
- warn if both Dropbox & local versions have changed
- download changed, unedited Dropbox files

### Dropbox hashes
32-character (hex) SHA-256 hashes, created by hashing every 4MB block of the file and then hashing the resulting binary string created from the concatenated hashes. There are [example implementations](https://github.com/dropbox/dropbox-api-content-hasher/blob/master/js-node/dropbox-content-hasher.js) online for popular languages.


## Device Authentication

One-time device authentication using [SMS](https://www.twilio.com/docs/api/messaging/send-messages). Enter e-mail (user identification), e-mail, name and phone is saved in config. For existing users an SMS is sent to their saved phone number with the passkey & session created. If passkey is re-entered correctly, the session is validated as "logged in" and sent to device where it's saved in cookie. The cookie is then used for authentication.

> Your auth code is 912237 - enter this in Skylark Notes to authenticate your new device: Flaki's Spectre on Arch

```
[{
  user: 'istvan@skylark.ee',
  phone: '+19294337980',
  name: 'Flaki'
}, //...
]
```

- [Twilio getting started](https://www.twilio.com/console/sms/getting-started/build)
- [Twilio node (`npm i twilio`)](https://github.com/twilio/twilio-node)
- [docs](https://www.twilio.com/docs/libraries/node)


## Logging

Recommended: [`pino.js`](https://github.com/pinojs/pino)
