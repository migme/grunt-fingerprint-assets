# grunt-asset-fingerprint

[![Build Status](https://travis-ci.org/testdouble/grunt-asset-fingerprint.png?branch=master)](https://travis-ci.org/testdouble/grunt-asset-fingerprint)

### Overview

This plugin is originated from [here](https://github.com/migme/grunt-fingerprint-assets). Bryan Huang (I specify the name of the person to blame.) modified it to serve the purposes of both browser caching *javascript files* and free up *CDN* space. We plan to use *filename{hash_code}* for version controlling instead of copying everything to *CDN* after every *jenkin* jobs that jacks up spaces in *CDN*. We only replace the hash that code is different from the previous version.

### What does it do

generate a *hashMap* js script which exports a `filepath: {hash_code}` map:

```
{
  "hotkey_emoticon_map.js": "./hotkey_emoticon_map-f1a849810b01e81a43fedd7b6e4d7a81.js",
  "main.js": "./main-0c9eaf8c88f5045b2db989bc54ef44c2.js",
  "mig33_backbone.js": "./mig33_backbone-f7be238c619ca5e4d15b8a7b01ce48c7.js",
  ...
}
```

### Config

```js
assetFingerprint: {
  "options": {
    "manifestPath": "dist/hashMap.js" // generates hashMap.js to dist folder.
  },
  "dist": {
    "files": [
      {
        "expand": true,
        "cwd": "app/scripts",
        "src": ['**/*.js']
      }
    ]
  }
}
```
## Running Specs

no tests are written at the moment.
