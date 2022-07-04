const multer = require('multer');

// img uplod
const date = new Date();
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './upload/');
  },
  filename: (req, file, cb) => {
    cb(
      null,
      `${process.env.APP_NAME}-${date.getFullYear()}-${
        date.getMonth() + 1
      }-${date.getDate()}-${date.getTime()}-${file.originalname}`
    );
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg'
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const upload = multer({ storage: fileStorage, fileFilter: fileFilter });
module.exports = upload;
