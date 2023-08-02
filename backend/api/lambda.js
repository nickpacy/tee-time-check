const fs = require('fs-extra');
const path = require('path');
const archiver = require('archiver');

// Destination folder - replace with your actual folder
let destinationFolder = path.join(__dirname, '..', process.argv[2] || 'tee-time-check-api-lambda');

// Get the name of the destination folder without the parent directory part
let destinationFolderName = path.basename(destinationFolder);

// Function to copy all files except node_modules
async function copyFiles(source, destination) {
  // Clear out the contents of the destination folder
  await fs.emptyDir(destination);

  // Get all files and folders in the current directory
  let files = await fs.readdir(source);

  // Files or directories to exclude
  const excludedItems = ['api_lambda', 'node_modules', 'setup.txt', '.env', 'lambda.js', '.bin'];

  // Filter out the excluded files/directories
  files = files.filter(file => !excludedItems.includes(file));

  // Copy each file/folder
  for (let file of files) {
    let sourcePath = path.join(source, file);
    let destinationPath = path.join(destination, file);
    await fs.copy(sourcePath, destinationPath);
  }

  // Copy the contents of the node_modules separately
  let nodeModulesSource = path.join(source, 'node_modules');
  let nodeModulesFiles = await fs.readdir(nodeModulesSource);

  for (let file of nodeModulesFiles) {
    let sourcePath = path.join(nodeModulesSource, file);
    let destinationPath = path.join(destination, file);
    await fs.copy(sourcePath, destinationPath);
  }
}

// Function to create a zip file
function zipDirectory(source, out) {
    var archive = archiver('zip', { zlib: { level: 9 }});
    var stream = fs.createWriteStream(out);
  
    return new Promise((resolve, reject) => {
      archive.glob("**/*", { cwd: source })
        .on('error', reject)
        .pipe(stream);
  
      stream.on('close', resolve);
      archive.finalize();
    });
  }

// Use the functions
async function run() {
  await copyFiles('.', destinationFolder);
  await zipDirectory(destinationFolder, `${path.join(__dirname, `${destinationFolderName}.zip`)}`);

  // Delete the destination directory
  await fs.remove(destinationFolder);
}

run().catch(console.error);
