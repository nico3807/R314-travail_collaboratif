// Rend cliquables les huit vignettes de l'illustration « Vocabulaire
// essentiel de Git ». Les définitions ne sont pas dupliquées ici : elles
// restent dans le HTML, sous forme de cartes que ce script masque. Sans
// JavaScript, les cartes s'affichent donc normalement sous l'image, qui
// redevient une simple illustration : rien n'est perdu.

(function () {
  var figure = document.getElementById('vocabulaire');
  var fiches = document.getElementById('vocab-fiches');
  var aide = document.getElementById('vocab-aide');
  var modal = document.getElementById('modal');
  var contenu = document.getElementById('modal-contenu');
  if (!figure || !fiches || !modal || !contenu) return;

  fiches.hidden = true;
  if (aide) aide.hidden = false;

  // Retenu à l'ouverture pour rendre le focus au bon endroit à la fermeture,
  // sinon la navigation au clavier repart du haut de la page.
  var origine = null;

  function ouvrir(bouton) {
    var fiche = document.getElementById(bouton.getAttribute('data-fiche'));
    if (!fiche) return;
    contenu.innerHTML = fiche.innerHTML;
    modal.hidden = false;
    origine = bouton;
    modal.querySelector('.modal-close').focus();
  }

  function fermer() {
    modal.hidden = true;
    if (origine) origine.focus();
  }

  figure.addEventListener('click', function (evt) {
    var bouton = evt.target.closest('.vocab-zone');
    if (bouton) ouvrir(bouton);
  });

  modal.addEventListener('click', function (evt) {
    if (evt.target === modal || evt.target.closest('.modal-close')) fermer();
  });

  document.addEventListener('keydown', function (evt) {
    if (evt.key === 'Escape' && !modal.hidden) fermer();
  });
})();
