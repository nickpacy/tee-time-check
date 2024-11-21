const fs = require('fs-extra');
const path = require('path');
const archiver = require('archiver');

// Destination folder - replace with your actual folder
let destinationFolder = path.join(__dirname, '..', process.argv[2] || 'algotee-crawler-lambda');

// Destination folder - replace with your actual folder
let destinationFolderName = path.basename(destinationFolder);

// Function to create a zip file
function zipDirectory(source, out) {
  const archive = archiver('zip', { zlib: { level: 9 } });
  const stream = fs.createWriteStream(out);
  
  return new Promise((resolve, reject) => {
    archive.glob("**/*", { 
      cwd: source, 
      ignore: [
        'node_modules/**', // Ignore the node_modules folder
        '.env', // Ignore the .env file
        path.basename(out) // Ignore the zip file itself
      ]  

    })
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
  
  // Create the new zip file
  await zipDirectory(__dirname, zipFilePath);
}

run().catch(console.error);
