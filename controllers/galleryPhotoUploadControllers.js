const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');

//Fotode kaustad loeme .env failist
const originalPath = process.env.UPLOAD_ORIGINAL_PATH || './public/gallery/orig/';
const resizedPath = process.env.UPLOAD_RESIZED_PATH || './public/gallery/normal/';
const thumbnailPath = process.env.UPLOAD_THUMBNAIL_PATH || './public/gallery/thumbs/';

const galleryPhotoUpload = (req, res) => {
    res.render('galleryphotoupload', {notice: ''});
};

const galleryPhotoUploadPost = async (req, res) => {
    if (!req.file) {
        return res.render('galleryphotoupload', {notice: 'Palun vali JPG-foto!'});
    }

    let conn;
    try {
        const fileName = 'vp_' + Date.now() + '.jpg';
        const originalFile = path.join(originalPath, fileName);

        await fs.mkdir(resizedPath, {recursive: true});
        await fs.mkdir(thumbnailPath, {recursive: true});
        await fs.rename(req.file.path, originalFile);

        //Normaalsuuruses pildile vesimärk alla paremale
        await sharp(originalFile)
            .resize(800, 500)
            .composite([{input: './public/pic/vp_logo_small.png', gravity: 'southeast'}])
            .jpeg({quality: 90})
            .toFile(path.join(resizedPath, fileName));

        //Väike eelvaade ilma vesimärgita
        await sharp(originalFile)
            .resize(100, 100)
            .jpeg({quality: 90})
            .toFile(path.join(thumbnailPath, fileName));

        conn = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_DATABASE
        });

        const sqlReq = 'INSERT INTO galleryphotos (filename, origname, alttext, privacy, userid) VALUES (?,?,?,?,?)';
        const userId = 1; //Ajutine, kuni kasutajakontod on valmis
        await conn.execute(sqlReq, [fileName, req.file.originalname, req.body.altInput || null,
            req.body.privacyInput, userId]);

        res.render('galleryphotoupload', {notice: 'Foto on üles laaditud!'});
    }
    catch (err) {
        console.log('Foto üleslaadimise viga: ' + err);
        res.render('galleryphotoupload', {notice: 'Foto üleslaadimine ebaõnnestus.'});
    }
    finally {
        if (conn) await conn.end();
    }
};

//Galerii: privaatsus 2 ja 3
const gallery = async (req, res) => {
    let conn;
    let photos = [];

    try {
        conn = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_DATABASE
        });

        const sqlReq = 'SELECT filename, alttext FROM galleryphotos WHERE privacy >= ? AND deleted IS NULL ORDER BY id DESC';
        const [results] = await conn.execute(sqlReq, [2]);
        photos = results;
    }
    catch (err) {
        console.log('Galerii lugemise viga: ' + err);
    }
    finally {
        if (conn) await conn.end();
    }

    res.render('gallery', {photos});
};

module.exports = {galleryPhotoUpload, galleryPhotoUploadPost, gallery};
