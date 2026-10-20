const fs = require('fs').promises;
const path = require('path');
const dateTimeET = require('../src/dateTimeET');

const regTextRef = path.join(__dirname, '../public/txt/visits.txt');

// GET /visits – külastuste avaleht viimase registreeritud külastusega
const visits = async (req, res) => {
    let message;
    try {
        const data = await fs.readFile(regTextRef, 'utf8');
        const entries = data.split(';').map(entry => entry.trim()).filter(Boolean);
        const lastVisit = entries.at(-1);

        if (!lastVisit) {
            message = 'Ühtegi külastust ei ole veel registreeritud.';
        } else {
            const [name, date, time] = lastVisit.split(',').map(part => part.trim());
            message = 'Viimati registreeriti külastus ' + date + ', kell ' + time + ', kui seda tegi ' + name + '.';
        }
    } catch (err) {
        if (err.code === 'ENOENT') {
            message = 'Ühtegi külastust ei ole veel registreeritud.';
        } else {
            console.log('Külastuste lugemise viga: ' + err);
            message = 'Külastuste faili ei õnnestunud lugeda.';
        }
    }
    res.render('visits', {message});
};

// GET /visits/regvisit
const regvisit = (req, res) => {
    res.render('regvisit', {notice: null, nameInput: null});
};

// POST /visits/regvisit
const regvisitPost = async (req, res) => {
    const nameInput = (req.body.nameInput || '').trim();
    if (!nameInput || /[;,\r\n]/.test(nameInput)) {
        return res.render('regvisit', {
            notice: 'Sisesta nimi (ilma koma ja semikoolonita).',
            nameInput
        });
    }

    try {
        const date = dateTimeET.dateET();
        const time = dateTimeET.timeET();
        await fs.appendFile(regTextRef, nameInput + ', ' + date + ', ' + time + ';', 'utf8');
        return res.render('regvisit', {notice: 'Külastus on registreeritud!', nameInput: null});
    } catch (err) {
        console.log('Külastuse salvestamise viga: ' + err);
        return res.render('regvisit', {notice: 'Külastust ei õnnestunud salvestada.', nameInput});
    }
};

module.exports = {visits, regvisit, regvisitPost};
