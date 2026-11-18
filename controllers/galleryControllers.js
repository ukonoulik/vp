const mysql = require('mysql2/promise');

//@desc Photogallery opening page 
//@route GET /gallery
//@access private

const galleryHome = async (req, res) => {
	res.redirect('/gallery/1');
};

//@desc Photogallery page 
//@route GET /gallery/:page 
//@access private

const galleryPage = async (req, res) => {
	let page = parseInt(req.params.page);
	const privacy = 2;
	let skip = 0;
	const limit = 5;
	console.log('Lehekülg: ' + page);
	//kontrollime, et poleks liiga väike lk number või, et number oleks ikka olemas
	if(page < 1 || isNaN(page)){
		page = 1;
	}
	
	let conn;
	
	try {
		conn = await mysql.createConnection({
			host: process.env.DB_HOST,
			user: process.env.DB_USER,
			password: process.env.DB_PASS,
			database: process.env.DB_DATABASE
		});
		//teeme kindlaks, palju üldse sobivaid fotosid on
		let sqlReq = 'SELECT count(id) AS photos FROM galleryphotos WHERE privacy >= ? AND deleted IS NULL';
		const [countResult] = await conn.execute(sqlReq, [privacy]);
		const photoCount = countResult[0].photos;
		//kui leheküljenumber on liiga suur
		if((page - 1) * limit >= photoCount){
			page = Math.max(1, Math.ceil(photoCount / limit));
		}
		//fikseerime, palju pilte tuleb vahele jätta
		skip = (page - 1) * limit;
		//teeme navigatsioonilingid
		//tagasi liikumine
		let galleryLinks;
		if(page === 1){
			galleryLinks = 'Eelmine leht &nbsp;&nbsp;&nbsp; | &nbsp;&nbsp;&nbsp;';
		} else {
			galleryLinks = `<a href="/gallery/${page - 1}">Eelmine leht</a> &nbsp;&nbsp;&nbsp; | &nbsp;&nbsp;&nbsp;`;
		}
		//edasi liikumine
		if(page * limit >= photoCount){
			galleryLinks += 'Järgmine leht';
		} else {
			galleryLinks += `<a href="/gallery/${page + 1}">Järgmine leht</a>`;
		}
		//loeme vajalikud fotod		
		sqlReq = 'SELECT id, filename, alttext FROM galleryphotos WHERE privacy >= ? AND deleted IS NULL LIMIT ?,?';
		const [photos] = await conn.execute(sqlReq, [privacy, skip, limit]);
		let galleryData = [];
		for (let i = 0; i < photos.length; i ++){
			let altTtext = "Galeriipilt";
			if(photos[i].alttext != ""){
				altText = photos[i].alttext;
			}
			galleryData.push({id: photos[i].id, src: photos[i].filename, alt: altText});
		}
		res.render('gallery', {galleryData: galleryData, imagehref: process.env.GALLERY_THUMBNAIL, links: galleryLinks});
	}
	catch (err) {
		console.log('Viga: ' + err);
		galleryLinks = 'Eelmine leht &nbsp;&nbsp;&nbsp; | &nbsp;&nbsp;&nbsp Järgmine leht';
		res.render('gallery', {galleryData: [], imagehref: process.env.GALLERY_THUMBNAIL, links: galleryLinks});
	}
	finally {
		if(conn){
			await conn.end();
		}
	}
	
	//res.render('gallery');
};



const myGalleryPage = async (req, res) => {
	let page = parseInt(req.params.page);
	const privacy = 2;
	let skip = 0;
	const limit = 5;
	
	let conn;
	try {
		const sqlReq = 'SELECT id, filename, alttext FROM galleryphotos WHERE privacy >= ? AND deleted IS NULL LIMIT ?';
		conn = await mysql.createConnection({
			host: process.env.DB_HOST,
			user: process.env.DB_USER,
			password: process.env.DB_PASS,
			database: process.env.DB_DATABASE
		});
		const [photos] = await conn.execute(sqlReq, [req.session.userId]);
		let galleryData = [];
		for (let i = 0; i < photos.length; i ++){
			let altText = "Galeriipilt";
			if(photos[i].alttext != ""){
				altText = photos[i].alttext;
			}
			galleryData.push({id: photos[i].id, src: photos[i].filename, alt: altText});
		}
		res.render('mygallery', {galleryData: galleryData, imagehref: process.env.GALLERY_NORMAL});
	}
	catch (err) {
			console.log('Viga: ' + err);
			res.render('mygallery', {galleryData: [], imagehref: process.env.GALLERY_NORMAL});
	}
	finally {
			if(conn){
					await conn.end();
		}
	}
};


module.exports = {
	galleryHome,
	myGalleryPage,
	galleryPage
}