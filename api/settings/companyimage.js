const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
 destination: (req, file, cb) => {
  let extension = file.originalname.split('.');
  let accepted = ['jpeg', 'png', 'jpg'];

  if (accepted.includes(extension[1])) {
   const destinationPath = path.join(__dirname, './company');
   // Delete previous images in the folder
   const files = fs.readdirSync(destinationPath);
   files.forEach((file) => {
    fs.unlinkSync(path.join(destinationPath, file));
   });

   cb(null, path.join(destinationPath));
  } else {
   cb(new Error('File type jpeg, png, jpg required'));
  }
 },
 filename: (req, file, cb) => {
  const uniqueSuffix = 'companylogo' + path.extname(file.originalname);
  cb(null, uniqueSuffix);
 }
});

const upload = multer({ storage }).single('file')

module.exports = upload;
