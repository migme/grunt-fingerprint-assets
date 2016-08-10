"use strict";
var _, crypto, fs, path;

fs = require("fs");

path = require("path");

crypto = require("crypto");

_ = require("lodash");

module.exports = function(grunt) {
  var containsAFingerprint, contentWithHashSubstitutions, stripDestPath;
  stripDestPath = function(file, files) {
    return file.replace(files.orig.dest + "/", "");
  };
  contentWithHashSubstitutions = function(file, hashMap, cdnPrefixForRootPaths) {
    var originalContent, result;
    originalContent = grunt.file.read(file);
    result = _(hashMap).reduce(function(memo, hashedName, originalName) {
      return memo.replace(RegExp("\\/" + originalName, "g"), cdnPrefixForRootPaths + "/" + hashedName).replace(RegExp("" + originalName, "g"), hashedName);
    }, originalContent);
    return {
      result: result,
      madeAnyDifference: result !== originalContent
    };
  };
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

    _(this.files).each(function(files) {
      var algorithmHash, content, hashedName, extension, src;

      src = files.src[0];
            
      

      console.log('src', files.cwd);
      console.log('src exists', grunt.file.exists(files.cwd + '/' + src));

      if (containsAFingerprint(src)) {
        return;
      }
      if (grunt.file.isDir(src)) {
        return grunt.log.debug("Source file `" + src + "` was a directory. Skipping.");
      }
      if (!grunt.file.exists(src)) {
        grunt.log.warn("Source file `" + src + "` not found.");
      }

      // generate hash.
      algorithmHash = crypto.createHash(algorithm);
      extension = path.extname(src);
      content = grunt.file.read(src);
  
      // console.log('content', content);

      hashedName = (path.basename(src, extension)) + "-" + (algorithmHash.update(content).digest("hex")) + extension;

      extensionIncluded = includeOnly.some(function (ext) {
        return '.' + ext === extension;
      });  
      
      if(extensionIncluded) {
        // we need to have a key value pair of:
        // {'a/b/file.js': 'file-dqpaiuc81Vs.js'}

        // now we have both:
        // 1. hashed name.
        // 2. path.
        // generate manifest list.
        manifest[(path.basename(src, extension))] = hashedName;
      }
    });
    console.log('manifest path', manifest);
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, "  "));
    return grunt.log.writeln("asset mapping(s) to " + manifestPath);
  });
};
