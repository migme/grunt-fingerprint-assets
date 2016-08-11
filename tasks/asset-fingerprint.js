"use strict";
var crypto, fs, path;

fs = require("fs");

path = require("path");

crypto = require("crypto");

module.exports = function(grunt) {
  var containsAFingerprint;
  containsAFingerprint = function(fileName) {
    return fileName.match(/\-\w{32}\./);
  };
  return grunt.registerMultiTask("assetFingerprint", "Generates asset fingerprints and appends to a rails manifest", function() {
    var algorithm,
        includeOnly,
        cdnPrefixForRootPaths,
        findAndReplaceFiles,
        keepOriginalFiles,
        manifest = {},
        manifestPath,
        extensionIncluded; // boolean

    manifestPath = this.options({
      manifestPath: "dist/assets.json"
    }).manifestPath;
    
    algorithm = this.options({
      algorithm: "md5"
    }).algorithm;

    findAndReplaceFiles = grunt.file.expand(this.options({
      findAndReplaceFiles: []
    }).findAndReplaceFiles);

    keepOriginalFiles = this.options({
      keepOriginalFiles: true
    }).keepOriginalFiles;

    cdnPrefixForRootPaths = this.options({
      cdnPrefixForRootPaths: ""
    }).cdnPrefixForRootPaths;

    // include only extensions.
    includeOnly = this.options({
      includeOnly: []
    }).includeOnly;



    this.files.forEach(function(files) {
      var algorithmHash, content, hashedName, extension, src;

      files.src.forEach(function (src) {

        // generate abs path with cwd and relative paths
        var absPath = files.cwd + '/' + src;
        if (containsAFingerprint(src)) {
          return;
        }
        if (grunt.file.isDir(absPath)) {
          return grunt.log.debug("Source file `" + src + "` was a directory. Skipping.");
        }
        if (!grunt.file.exists(absPath)) {
          grunt.log.warn("Source file `" + src + "` not found.");
        }        
        
        algorithmHash = crypto.createHash(algorithm);
        extension = path.extname(absPath);

        // check if extension is included
        extensionIncluded = includeOnly.some(function (ext) {
          return '.' + ext === extension;
        })

        if (extensionIncluded) {
          content = grunt.file.read(absPath);          
          hashedName = (path.basename(absPath, extension)) + "-" + (algorithmHash.update(content).digest("hex")) + extension;

          // generate key value pair like:
          // {'a/b/file.js': 'file-dqpaiuc81Vs.js'}

          // now we have both:
          // 1. hashed name.
          // 2. path.
          // generate manifest list.
          manifest[(path.basename(src, extension))] = hashedName;
        }
      });
    });
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, "  "));
    return grunt.log.writeln("asset mapping(s) to " + manifestPath);
  });
};
