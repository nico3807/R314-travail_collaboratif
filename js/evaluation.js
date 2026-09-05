// Page évaluation : charge data/evaluation.json, affiche la grille de
// critères à cocher et calcule le score en direct (en mémoire, à usage
// de l'enseignant pendant l'observation du binôme — rien n'est envoyé
// ni conservé après un rechargement de page).

(function () {
  var list = document.getElementById('eval-list');
  var scoreValue = document.getElementById('score-value');
  var scoreBar = document.getElementById('score-bar-fill');
  var scoreTotalLabel = document.getElementById('score-total-label');

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function render(data) {
    scoreTotalLabel.textContent = '/ ' + data.total;

    list.innerHTML = data.criteres.map(function (c) {
      return (
        '<label class="eval-row" for="crit-' + c.id + '">' +
          '<input type="checkbox" id="crit-' + c.id + '" data-points="' + c.points + '">' +
          '<span>' + escapeHtml(c.libelle) + '</span>' +
          '<span class="pts">' + c.points + ' pt' + (c.points > 1 ? 's' : '') + '</span>' +
        '</label>'
      );
    }).join('');

    var checkboxes = list.querySelectorAll('input[type="checkbox"]');

    function recompute() {
      var score = 0;
      checkboxes.forEach(function (cb) {
        if (cb.checked) score += Number(cb.getAttribute('data-points'));
      });
      scoreValue.textContent = score;
      scoreBar.style.width = Math.round((score / data.total) * 100) + '%';
    }

    checkboxes.forEach(function (cb) { cb.addEventListener('change', recompute); });
    recompute();
  }

  fetch('data/evaluation.json')
    .then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then(render)
    .catch(function (err) {
      list.innerHTML =
        '<div class="callout danger">' +
        '<h4>Impossible de charger data/evaluation.json</h4>' +
        '<p>Ouvrez cette page via un serveur local (extension « Live Server » de VSCode, ou <code>npx serve</code>) plutôt qu\'en double-clic sur le fichier.</p>' +
        '<p style="color:var(--text-muted);font-size:0.85em">Détail technique : ' + escapeHtml(err.message) + '</p>' +
        '</div>';
    });
})();
