const connectDB = require('../src/db');

// Ühine abifunktsioon sisestatud tekstile.
const tekst = value => typeof value === 'string' ? value.trim() : '';

// Kontrollib, et kuupäev oleks päriselt olemas (nt 2026-02-30 ei sobi).
function kontrolliKuupaev(vaartus) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(vaartus)) return null;
    const [aasta, kuu, paev] = vaartus.split('-').map(Number);
    const kuupaev = new Date(aasta, kuu - 1, paev);
    if (kuupaev.getFullYear() !== aasta || kuupaev.getMonth() + 1 !== kuu ||
        kuupaev.getDate() !== paev) return null;
    return kuupaev;
}

const eestifilm = (req, res) => res.render('eestifilm');

// Filmiinimeste nimekiri
const eestifilmInimesed = async (req, res) => {
    let conn;
    try {
        conn = await connectDB();
        const [personList] = await conn.execute('SELECT * FROM person ORDER BY last_name, first_name');
        res.render('film_inimesed', {personList, notice: null});
    } catch (err) {
        console.log('Filmiinimeste lugemise viga: ' + err);
        res.status(500).render('film_inimesed', {personList: [], notice: 'Andmebaasi lugemine ebaõnnestus.'});
    } finally {
        if (conn) await conn.end();
    }
};

const emptyPersonForm = {
    firstNameInput: '', lastNameInput: '', bornInput: '', deceasedInput: ''
};

const eestifilmInimesedLisa = (req, res) => {
    res.render('lisa_film_inimesed', {notice: 'Ootan sisestust!', ...emptyPersonForm});
};

const eestifilmInimesedLisaPost = async (req, res) => {
    const values = {
        firstNameInput: tekst(req.body.firstNameInput),
        lastNameInput: tekst(req.body.lastNameInput),
        bornInput: tekst(req.body.bornInput),
        deceasedInput: tekst(req.body.deceasedInput)
    };
    const vead = [];
    const bornDate = kontrolliKuupaev(values.bornInput);
    const deceasedDate = values.deceasedInput ? kontrolliKuupaev(values.deceasedInput) : null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!values.firstNameInput) vead.push('Eesnimi on kohustuslik.');
    if (!values.lastNameInput) vead.push('Perekonnanimi on kohustuslik.');
    if (!values.bornInput) vead.push('Sünnikuupäev on kohustuslik.');
    else if (!bornDate) vead.push('Sünnikuupäev ei ole reaalne kuupäev.');
    else if (bornDate > today) vead.push('Sünnikuupäev ei tohi olla tulevikus.');

    if (values.deceasedInput) {
        if (!deceasedDate) vead.push('Surmakuupäev ei ole reaalne kuupäev.');
        else if (deceasedDate > today) vead.push('Surmakuupäev ei tohi olla tulevikus.');
        else if (bornDate && deceasedDate < bornDate) {
            vead.push('Surmakuupäev ei tohi olla sünnikuupäevast varasem.');
        }
    }
    if (vead.length) return res.render('lisa_film_inimesed', {notice: vead.join(' '), ...values});

    let conn;
    try {
        conn = await connectDB();
        await conn.execute(
            'INSERT INTO person (first_name, last_name, born, deceased) VALUES (?,?,?,?)',
            [values.firstNameInput, values.lastNameInput, values.bornInput, values.deceasedInput || null]
        );
        return res.render('lisa_film_inimesed', {
            notice: values.firstNameInput + ' ' + values.lastNameInput + ' on andmebaasi salvestatud!',
            ...emptyPersonForm
        });
    } catch (err) {
        console.log('Filmiinimese salvestamise viga: ' + err);
        return res.status(500).render('lisa_film_inimesed', {
            notice: 'Tekkis viga, andmeid ei salvestatud!', ...values
        });
    } finally {
        if (conn) await conn.end();
    }
};

// Filmide nimekiri ja uue filmi lisamine
const filmid = async (req, res) => {
    let conn;
    try {
        conn = await connectDB();
        const [movieList] = await conn.execute('SELECT * FROM movie ORDER BY title');
        res.render('eestifilmfilmid', {movieList, notice: null});
    } catch (err) {
        console.log('Filmide lugemise viga: ' + err);
        res.status(500).render('eestifilmfilmid', {movieList: [], notice: 'Andmebaasi lugemine ebaõnnestus.'});
    } finally {
        if (conn) await conn.end();
    }
};

const emptyMovieForm = {movieTitle: '', releaseYear: '', duration: '', description: ''};
const filmidLisa = (req, res) => {
    res.render('eestifilmfilmid_add', {notice: 'Ootan sisestust!', ...emptyMovieForm});
};

const filmidLisaPost = async (req, res) => {
    const values = {
        movieTitle: tekst(req.body.titleInput),
        releaseYear: tekst(req.body.yearInput),
        duration: tekst(req.body.durationInput),
        description: tekst(req.body.descriptionInput)
    };
    const year = Number(values.releaseYear);
    const minutes = Number(values.duration);
    if (!values.movieTitle) {
        return res.render('eestifilmfilmid_add', {notice: 'Filmi pealkiri puudub.', ...values});
    }
    if (!values.releaseYear || !Number.isInteger(year) || year < 1888 || year > new Date().getFullYear()) {
        return res.render('eestifilmfilmid_add', {notice: 'Valmimisaasta on vigane.', ...values});
    }
    if (!values.duration || !Number.isInteger(minutes) || minutes <= 0) {
        return res.render('eestifilmfilmid_add', {notice: 'Kestus on vigane.', ...values});
    }

    let conn;
    try {
        conn = await connectDB();
        await conn.execute(
            'INSERT INTO movie (title, release_year, duration_minutes, description) VALUES (?,?,?,?)',
            [values.movieTitle, year, minutes, values.description || null]
        );
        return res.render('eestifilmfilmid_add', {notice: 'Film salvestati!', ...emptyMovieForm});
    } catch (err) {
        console.log('Filmi lisamise viga: ' + err);
        return res.status(500).render('eestifilmfilmid_add', {notice: 'Filmi ei õnnestunud salvestada.', ...values});
    } finally {
        if (conn) await conn.end();
    }
};

// Ametite nimekiri ja uue ameti lisamine
const ametid = async (req, res) => {
    let conn;
    try {
        conn = await connectDB();
        const [professionList] = await conn.execute('SELECT * FROM profession ORDER BY title');
        res.render('eestifilmametid', {professionList, notice: null});
    } catch (err) {
        console.log('Ametite lugemise viga: ' + err);
        res.status(500).render('eestifilmametid', {professionList: [], notice: 'Andmebaasi lugemine ebaõnnestus.'});
    } finally {
        if (conn) await conn.end();
    }
};

const emptyProfessionForm = {title: '', description: ''};
const ametidLisa = (req, res) => {
    res.render('eestifilmametid_add', {notice: 'Ootan sisestust!', ...emptyProfessionForm});
};

const ametidLisaPost = async (req, res) => {
    const values = {title: tekst(req.body.title), description: tekst(req.body.description)};
    if (!values.title || !values.description) {
        return res.render('eestifilmametid_add', {notice: 'Sisesta ameti nimetus ja kirjeldus.', ...values});
    }

    let conn;
    try {
        conn = await connectDB();
        await conn.execute('INSERT INTO profession (title, description) VALUES (?, ?)', [values.title, values.description]);
        return res.render('eestifilmametid_add', {notice: 'Amet salvestati!', ...emptyProfessionForm});
    } catch (err) {
        console.log('Ameti salvestamise viga: ' + err);
        return res.status(500).render('eestifilmametid_add', {notice: 'Ametit ei õnnestunud salvestada.', ...values});
    } finally {
        if (conn) await conn.end();
    }
};

// Seoste sisestamiseks loeme kõik kolm rippmenüüd andmebaasist.
async function loeValikud(conn) {
    const [personList] = await conn.execute('SELECT id, first_name, last_name FROM person ORDER BY last_name, first_name');
    const [movieList] = await conn.execute('SELECT id, title FROM movie ORDER BY title');
    const [professionList] = await conn.execute('SELECT id, title FROM profession ORDER BY title');
    return {
        personList,
        movieList,
        professionList: professionList.map(profession => ({
            ...profession,
            isActor: tekst(profession.title).toLocaleLowerCase('et') === 'näitleja'
        }))
    };
}

const emptyRelationForm = {personInput: '', movieInput: '', professionInput: '', characterInput: ''};

// GET /eestifilm/lisa_seos
const seosLisa = async (req, res) => {
    let conn;
    try {
        conn = await connectDB();
        const valikud = await loeValikud(conn);
        res.render('eestifilmseos_add', {notice: 'Vali inimene, film ja amet.', ...valikud, ...emptyRelationForm});
    } catch (err) {
        console.log('Seose vormi andmete lugemise viga: ' + err);
        res.status(500).render('eestifilmseos_add', {
            notice: 'Rippmenüüde andmeid ei õnnestunud lugeda.',
            personList: [], movieList: [], professionList: [], ...emptyRelationForm
        });
    } finally {
        if (conn) await conn.end();
    }
};

// POST /eestifilm/lisa_seos
const seosLisaPost = async (req, res) => {
    const values = {
        personInput: tekst(req.body.personInput),
        movieInput: tekst(req.body.movieInput),
        professionInput: tekst(req.body.professionInput),
        characterInput: tekst(req.body.characterInput)
    };
    let conn;
    try {
        conn = await connectDB();
        const valikud = await loeValikud(conn);
        const showForm = (notice, clear = false, status = 200) => res.status(status).render('eestifilmseos_add', {
            notice, ...valikud, ...(clear ? emptyRelationForm : values)
        });
        const personId = Number(values.personInput);
        const movieId = Number(values.movieInput);
        const professionId = Number(values.professionInput);

        if (!values.personInput || !values.movieInput || !values.professionInput ||
            !Number.isSafeInteger(personId) || !Number.isSafeInteger(movieId) ||
            !Number.isSafeInteger(professionId) ||
            !valikud.personList.some(p => Number(p.id) === personId) ||
            !valikud.movieList.some(m => Number(m.id) === movieId) ||
            !valikud.professionList.some(p => Number(p.id) === professionId)) {
            return showForm('Vali rippmenüüdest olemasolev inimene, film ja amet.');
        }

        const profession = valikud.professionList.find(p => Number(p.id) === professionId);
        // Näitlejale saab määrata tegelaskuju; teiste ametite korral see lahter ei kehti.
        const characterName = profession.isActor ? values.characterInput : '';
        if (characterName.length > 255) {
            return showForm('Tegelaskuju nimi on liiga pikk (kuni 255 märki).');
        }

        // Enne salvestamist kontrollime täpselt samade väärtustega seost.
        const [existing] = await conn.execute(
            `SELECT id FROM person_in_movie
             WHERE person_id = ? AND movie_id = ? AND profession_id = ? AND character_name = ?
             LIMIT 1`,
            [personId, movieId, professionId, characterName]
        );
        if (existing.length) {
            return showForm('Selline seos on juba olemas! Uut seost ei salvestatud.');
        }

        await conn.execute(
            'INSERT INTO person_in_movie (person_id, movie_id, profession_id, character_name) VALUES (?,?,?,?)',
            [personId, movieId, professionId, characterName]
        );
        return showForm('Seos salvestati!', true);
    } catch (err) {
        console.log('Seose salvestamise viga: ' + err);
        const notice = err.code === 'ER_DUP_ENTRY' ?
            'Selline seos on juba olemas! Uut seost ei salvestatud.' :
            'Seost ei õnnestunud salvestada.';
        // Kui rippmenüüd said loetud, proovime need ka vea korral uuesti ette anda.
        let valikud = {personList: [], movieList: [], professionList: []};
        if (conn) {
            try { valikud = await loeValikud(conn); } catch (_) { /* andmebaas pole saadaval */ }
        }
        return res.status(err.code === 'ER_DUP_ENTRY' ? 200 : 500).render('eestifilmseos_add', {
            notice, ...valikud, ...values
        });
    } finally {
        if (conn) await conn.end();
    }
};

// GET /eestifilm/seosed – filmi, inimese ja ameti seosed koos tegelaskujudega
const seosed = async (req, res) => {
    let conn;
    try {
        conn = await connectDB();
        const [relationList] = await conn.execute(
            `SELECT m.title AS movie_title, m.release_year,
                    p.first_name, p.last_name,
                    pr.title AS profession_title, mp.character_name
             FROM person_in_movie mp
             JOIN movie m ON m.id = mp.movie_id
             JOIN person p ON p.id = mp.person_id
             JOIN profession pr ON pr.id = mp.profession_id
             ORDER BY m.title, p.last_name, p.first_name, pr.title, mp.character_name`
        );
        res.render('eestifilmseosed', {relationList, notice: null});
    } catch (err) {
        console.log('Seoste lugemise viga: ' + err);
        res.status(500).render('eestifilmseosed', {
            relationList: [], notice: 'Seoseid ei õnnestunud andmebaasist lugeda.'
        });
    } finally {
        if (conn) await conn.end();
    }
};

module.exports = {
    eestifilm,
    eestifilmInimesed, eestifilmInimesedLisa, eestifilmInimesedLisaPost,
    filmid, filmidLisa, filmidLisaPost,
    ametid, ametidLisa, ametidLisaPost,
    seosed, seosLisa, seosLisaPost
};
