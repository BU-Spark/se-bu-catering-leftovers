// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const fs = require('fs');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Create a dummy InternalBytecode.js file to prevent Metro symbolication errors
// This is a workaround for Metro trying to symbolicate stack traces from minified code
const internalBytecodePath = path.join(__dirname, 'InternalBytecode.js');
if (!fs.existsSync(internalBytecodePath)) {
  fs.writeFileSync(internalBytecodePath, '// Dummy file for Metro symbolication\n', 'utf8');
}

module.exports = config;

