const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const sharp = require('sharp');

const watermarkFile = "./public/pic/vp_logo_small.png";

//@desc page for uploading photos to gallery
//@route GET /galleryphotoupload
//@access public

const galleryPhotoUpload = (req, res) => {
	res.render('galleryphotoupload');
};

//@desc page for uploading photos to gallery
//@route POST /galleryphotoupload
//@access public

const galleryPhotoUploadPost = async (req, res) => {
	//console.log(req.body);
	//console.log(req.file);
	let conn;
	try {
		//genereerime oma failinime
		const fileName = 'vp_' + Date.now() + '.jpg';
		await fs.rename(req.file.path, req.file.destination + fileName);
		//kontrollin, kas vesimärgi fail on olemas
		const watermarkSettings = [{
			input: watermarkFile,
			gravity: "southeast"
		}];
		if (!await fs.access(watermarkFile).then(() => true).catch(() => false)) {
             //console.log("Vesimärgi faili ei leitud!");
             // Tühjendame seaded, et vesimärki ei proovitaks lisada
             watermarkSettings.length = 0; 
        }
		
		//teeme väiksema veebisõbraliku pildi
		//await sharp(req.file.destination + fileName).resize(800, 500).jpeg({quality: 90}).toFile('./public/gallery/normal/' + fileName);
		let normalImageProcessor = await sharp(req.file.destination + fileName).resize(800, 600).jpeg({quality: 90});
		//lisan vesimärgi
		//console.log("Lisan vesimärgi" + watermarkSettings.length);    
        if (watermarkSettings.length > 0) {
            normalImageProcessor = await normalImageProcessor.composite(watermarkSettings);
        }
		await normalImageProcessor.toFile(process.env.UPLOAD_RESIZED_PATH + fileName);
		
		//teeme pisipildi (100X100)
		await sharp(req.file.destination + fileName).resize(100, 100).jpeg({quality: 90}).toFile(process.env.UPLOAD_THUMBNAIL_PATH + fileName);
		
		//kanname pildi info andmebaasi
		conn = await mysql.createConnection({
			host: process.env.DB_HOST,
			user: process.env.DB_USER,
			password: process.env.DB_PASS,
			database: process.env.DB_DATABASE
		});
		const sqlReq = 'INSERT INTO galleryphotos (filename, origname, alttext, privacy, userid) VALUES (?,?,?,?,?)';
		//const userId = 1; //see on ajutine, kuni teeme kasutajakontod ja sisselogimise
		const userId = req.session.userId;
		const [result] = await conn.execute(sqlReq, [fileName, req.file.originalname, req.body.altInput, req.body.privacyInput, userId]);
		res.render('galleryphotoupload');
	}
	catch (err) {
		console.log('Viga: ' + err);
		res.render('galleryphotoupload');
	}
	finally {
		if(conn){
			await conn.end();
		}
	}
};

module.exports = {
	galleryPhotoUpload,
	galleryPhotoUploadPost
}