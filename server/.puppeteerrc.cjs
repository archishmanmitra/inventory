const {join} = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Download Chrome to this folder
  cacheDirectory: join(__dirname, '.cache'),
  
  // Use the system Chrome if available (for production)
  executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
  
  // Skip downloading if executable path is set
  skipChromeDownload: !!process.env.PUPPETEER_EXECUTABLE_PATH,
};
