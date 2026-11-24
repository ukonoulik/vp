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
    const limit = 5;
    if (page < 1 || isNaN(page)) page = 1;
    let conn;

    try {
        conn = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_DATABASE
        });

        const [countResult] = await conn.execute(
            'SELECT count(id) AS photos FROM galleryphotos WHERE privacy >= ? AND deleted IS NULL',
            [privacy]
        );

        const photoCount = countResult[0].photos;

        if ((page - 1) * limit >= photoCount) {
            page = Math.max(1, Math.ceil(photoCount / limit));
        }

        const skip = (page - 1) * limit;

        let galleryLinks = page === 1
            ? 'Eelmine leht'
            : `<a href="/gallery/${page - 1}">Eelmine leht</a>`;

        galleryLinks += ' &nbsp;&nbsp;&nbsp; | &nbsp;&nbsp;&nbsp; ';

        galleryLinks += page * limit >= photoCount
            ? 'Järgmine leht'
            : `<a href="/gallery/${page + 1}">Järgmine leht</a>`;

        const [photos] = await conn.execute(
            'SELECT id, filename, alttext FROM galleryphotos WHERE privacy >= ? AND deleted IS NULL ORDER BY id LIMIT ?,?',
            [privacy, skip, limit]
        );

        let galleryData = [];

        for (let i = 0; i < photos.length; i++) {
            galleryData.push({
                id: photos[i].id,
                src: photos[i].filename,
                alt: photos[i].alttext || 'Galeriipilt'
            });
        }

        res.render('gallery', {
            galleryData,
            imagehref: process.env.GALLERY_THUMBNAIL || '/gallery/thumbs/',
            links: galleryLinks
        });

    } catch (err) {
        console.log('Viga: ' + err);
        res.status(500).render('gallery', {
            galleryData: [],
            imagehref: process.env.GALLERY_THUMBNAIL || '/gallery/thumbs/',
            links: 'Galerii laadimine ebaõnnestus'
        });
    } finally {
        if (conn) await conn.end();
    }
};

const myGalleryPage = async (req, res) => {
    let conn;

    try {
        conn = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_DATABASE
        });

        const sqlReq = 'SELECT id, filename, alttext FROM galleryphotos WHERE userid = ? AND deleted IS NULL';

        const [photos] = await conn.execute(
            sqlReq,
            [req.session.userId]
        );

        let galleryData = [];

        for (let i = 0; i < photos.length; i++) {
            galleryData.push({
                id: photos[i].id,
                src: photos[i].filename,
                alt: photos[i].alttext || 'Galeriipilt'
            });
        }

        res.render('mygallery', {
            galleryData,
            imagehref: process.env.GALLERY_THUMBNAIL || '/gallery/thumbs/'
        });

    } catch (err) {
        console.log('Viga: ' + err);
        res.status(500).send('Galerii laadimine ebaõnnestus');
    } finally {
        if (conn) await conn.end();
    }
};

const editPhoto = async (req, res) => {
    let conn;

    try {
        conn = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_DATABASE
        });

        const sqlReq = 'SELECT id, filename, alttext, privacy FROM galleryphotos WHERE id = ? AND userid = ? AND deleted IS NULL';

        const [photos] = await conn.execute(
            sqlReq,
            [req.params.id, req.session.userId]
        );

        if (photos.length === 0) {
            return res.status(404).send('Fotot ei leitud!');
        }

        res.render('editphoto', {
            photo: photos[0],
            imagehref: process.env.GALLERY_NORMAL || '/gallery/normal/'
        });

    } catch (err) {
        console.log('Viga: ' + err);
        res.status(500).send('Foto laadimine ebaõnnestus');
    } finally {
        if (conn) await conn.end();
    }
};

const editPhotoPost = async (req, res) => {
    let conn;

    try {
        conn = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_DATABASE
        });

        const [photos] = await conn.execute(
            'SELECT id FROM galleryphotos WHERE id = ? AND userid = ? AND deleted IS NULL',
            [req.params.id, req.session.userId]
        );

        if (photos.length === 0) {
            return res.status(404).send('Fotot ei leitud!');
        }

        if (req.body.photoDelete) {
            await conn.execute(
                'UPDATE galleryphotos SET deleted = NOW() WHERE id = ? AND userid = ? AND deleted IS NULL',
                [req.params.id, req.session.userId]
            );

        } else {
            const privacy = Number(req.body.privacyInput);
            const alttext = req.body.altInput;

            if (![1, 2, 3].includes(privacy) || typeof alttext !== 'string' || alttext.length > 256) {
                return res.status(400).send('Vigased andmed!');
            }

            await conn.execute(
                'UPDATE galleryphotos SET privacy = ?, alttext = ? WHERE id = ? AND userid = ? AND deleted IS NULL',
                [privacy, alttext, req.params.id, req.session.userId]
            );
        }

        res.redirect('/gallery/my');

    } catch (err) {
        console.log('Viga: ' + err);
        res.status(500).send('Foto muutmine ebaõnnestus');
    } finally {
        if (conn) await conn.end();
    }
};

module.exports = {
    galleryHome,
    myGalleryPage,
    galleryPage,
    editPhoto,
    editPhotoPost
};