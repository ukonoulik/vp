window.onload = function() {
    let allThumbs = document.querySelectorAll('.thumbs');

    for (let i = 0; i < allThumbs.length; i++) {
        allThumbs[i].addEventListener('click', openModal);
    }

    document.querySelector('#modalClose')
        .addEventListener('click', closeModal);
};

function openModal(e) {
    document.querySelector('#modalImage').src =
        '/gallery/normal/' + e.target.dataset.filename;

    document.querySelector('#modalCaption').textContent =
        e.target.alt;

    document.querySelector('#modal').showModal();
}

function closeModal() {
    document.querySelector('#modal').close();

    document.querySelector('#modalImage').src =
        '/pic/empty.png';

    document.querySelector('#modalCaption').textContent = '';
}