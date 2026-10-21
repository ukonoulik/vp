const mysql = require('mysql2/promise');
const fs = require('fs').promises; 
const sharp = require('sharp');
//@desc page for uploading photos to gallery 
//@route GET /galleryphotoupload
//@access public

const galleryPhotoUpload =(req, res) => {
	res.render('galleryphotoupload');
};

//@desc page for uploading photos to gallery
//@route POST /galleryphotoupload
//@access public 

const galleryPhotoUploadPost = async (req, res) => {
	//console.log(req.body); 
	//console.log(req.file);
	try {
		const fileName = 'vp_' + Date.now() + '.jpg';
		await fs.rename(req.file.path, req.file.destination + fileName);	
		await sharp(req.file.destination + fileName).resize(800, 500).jpeg({quality: 90}).toFile(
		'./public/gallery/normal/' + fileName);
		await sharp(req.file.destination + fileName).resize(100, 100).jpeg({quality: 90}).toFile(
		'./public/gallery/thumbs/' + fileName);
		conn = await mysql.createConnection({
			host: process.env.DB_HOST,
			user: process.env.DB_USER,
			password: process.env.DB_PASS,
			database: process.env.DB_DATABASE
		});
		const sqlReq = 'INSERT INTO galleryphotos (filename, origname, alttext, privacy, userid) VALUES (?,?,?,?,?)';
		const userId = 1; //AJUTINE, KUNI KASUTAJAKONTOD JA LOGIN 
		const [result] = await conn.execute(sqlReq, [fileName, req.file.originalname, req.body.altInput,
		req.body.privacyInput, userId]);
		res.render('galleryphotoupload');
	}
	catch(err) {
		console.log('Viga: ' + err);
		res.render('galleryphotosupload');
	}	
	finally {
		if(conn) {
			await conn.end();
		}
	}
};


module.exports = {
   galleryPhotoUpload,
   galleryPhotoUploadPost
};
