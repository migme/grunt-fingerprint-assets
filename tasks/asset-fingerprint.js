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
    var algorithm, cdnPrefixForRootPaths, filesToHashed, findAndReplaceFiles, keepOriginalFiles, manifestPath, manifestList, manifestNoPath;
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
    manifestNoPath = this.options({
      manifestNoPath: false
    }).manifestNoPath;
    filesToHashed = {};
    _(this.files).each(function(files) {
      var algorithmHash, content, dest, destWithHash, extension, src, substitution;
      src = files.src[0];
      dest = files.dest;
      if (containsAFingerprint(src)) {
        return;
      }
      if (grunt.file.isDir(src)) {
        return grunt.log.debug("Source file `" + src + "` was a directory. Skipping.");
      }
      if (!grunt.file.exists(src)) {
        grunt.log.warn("Source file `" + src + "` not found.");
      }
      algorithmHash = crypto.createHash(algorithm);
      extension = path.extname(dest);
      content = grunt.file.read(src);
      destWithHash = (path.dirname(dest)) + "/" + (path.basename(dest, extension)) + "-" + (algorithmHash.update(content).digest("hex")) + extension;
      filesToHashed[stripDestPath(dest, files)] = stripDestPath(destWithHash, files);
    });

    // trim out path
    if (manifestNoPath) {
      var filesToHashedNoPath = {}
      Object.keys(filesToHashed).forEach(function(name, index) {
        var nameSeg = filesToHashed[name].split('/');
        var trimPathName = nameSeg[nameSeg.length-1];
        var hashCode = trimPathName.replace(/.*\-(.*)(\..*)$/g, function ($0, $1, $2) { return $1 });
        filesToHashedNoPath[name] = hashCode;
      })
    }
    var manifestList = (manifestNoPath) ? filesToHashedNoPath : filesToHashed;

    fs.writeFileSync(manifestPath, JSON.stringify(manifestList, null, "  "));
    return grunt.log.writeln("Recorded " + (_(filesToHashed).size()) + " asset mapping(s) to " + manifestPath);
  });
};
