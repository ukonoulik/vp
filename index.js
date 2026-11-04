const express = require('express');
const dateTimeET = require('./src/dateTimeET.js');
const fs = require('fs').promises;
const mysql = require('mysql2/promise');
require('dotenv').config();

const textRef = 'public/txt/vanasonad.txt';
const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({extended: true}));

//avaleht
app.get('/', async (req, res) => {
    const day = dateTimeET.dayET();
    const date = dateTimeET.dateET();
    const time = dateTimeET.timeET();
    let latestGalleryPhoto = null;
    let conn;

    try {
        conn = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_DATABASE
        });

        const sqlReq = 'SELECT filename, alttext FROM galleryphotos WHERE id=(SELECT MAX(id) FROM galleryphotos WHERE privacy=? AND deleted IS NULL)';
        const [photos] = await conn.execute(sqlReq, [3]);
        latestGalleryPhoto = photos[0] || null;
    }
    catch (err) {
        console.log('Avalehe foto lugemise viga: ' + err);
    }
    finally {
        if (conn) await conn.end();
    }

    res.render('index', {day, date, time, latestGalleryPhoto});
});

//eelmise kodutöö leht
app.get('/miks-tlu', (req, res) => {
    res.render('miks-tlu');
});

//vanasõnade leht
app.get('/vanasona', async (req, res) => {
    try {
        const data = await fs.readFile(textRef, 'utf8');
        const folkWisdom = data.split(';');
        const wisdom = folkWisdom[Math.round(Math.random() * (folkWisdom.length - 1))];
        res.render('wisdom', {wisdom: wisdom});
    }
    catch (err) {
        console.log('Vanasõna lugemise viga: ' + err);
        res.render('wisdom', {wisdom: 'Vanasõna ei leitud'});
    }
});

//olemasolevad alamlehed
app.use('/eestifilm', require('./routes/eestifilmRoutes'));
app.use('/visits', require('./routes/visitsRoutes'));
app.get('/regvisit', (req, res) => res.redirect('/visits/regvisit'));
app.post('/regvisit', (req, res) => res.redirect(307, '/visits/regvisit'));
app.get('/lastvisit', (req, res) => res.redirect('/visits'));

//fotode üleslaadimine ja galerii
app.use('/galleryphotoupload', require('./routes/galleryPhotoUploadRoutes'));
app.use('/gallery', require('./routes/galleryRoutes'));

module.exports = app;
app.listen(5312);
