const fs = require('fs-extra');
const path = require('path');
const archiver = require('archiver');

// Destination folder - replace with your actual folder
let destinationFolder = path.join(__dirname, '..', process.argv[2] || 'tee-time-check-crawler-lambda');

// Get the name of the destination folder without the parent directory part
let destinationFolderName = path.basename(destinationFolder);

// Function to copy all files except node_modules
async function copyFiles(source, destination) {
  // Clear out the contents of the destination folder
  await fs.emptyDir(destination);

  // Get all files and folders in the current directory
  let files = await fs.readdir(source);

  // Files or directories to exclude
  const excludedItems = ['node_modules', '.env', 'lambda.js', '.bin', 'README.md'];

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

// Function to delete the existing zip file
async function deleteExistingZip(zipFilePath) {
  try {
    await fs.remove(zipFilePath);
    console.log(`Deleted existing zip file: ${zipFilePath}`);
  } catch (err) {
    console.error(`Error deleting existing zip file: ${err}`);
  }
}

// Use the functions
async function run() {

  // Prepare the zip file path
  const zipFilePath = path.join(__dirname, `${destinationFolderName}.zip`);

  // Delete the existing zip file if it exists
  await deleteExistingZip(zipFilePath);

  await copyFiles('.', destinationFolder);
  
  // Create the new zip file
  await zipDirectory(destinationFolder, zipFilePath);

  // Delete the destination directory
  await fs.remove(destinationFolder);
}

run().catch(console.error);
