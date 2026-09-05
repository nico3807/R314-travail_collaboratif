// Page scénarios : charge data/scenarios.json, affiche les fiches en
// accordéon, gère le filtre de vue (Étudiant A / Étudiant B / Les deux)
// et un suivi de progression en mémoire (non persisté entre deux visites,
// volontairement : chaque séance repart d'un état propre).

(function () {
  var list = document.getElementById('scenario-list');
  var progressText = document.getElementById('progress-text');
  var roleButtons = document.querySelectorAll('.role-toggle button');
  var currentView = 'both'; // 'both' | 'a' | 'b'
  var doneCount = 0;
  var total = 0;

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function renderList(items, label) {
    if (!items || !items.length) return '';
    return items.map(function (item) { return '<li>' + escapeHtml(item) + '</li>'; }).join('');
  }

  function renderCommandes(cmds) {
    if (!cmds || !cmds.length) return '';
    return '<div class="info-block commandes-block"><h4>Commandes utiles</h4>' +
      cmds.map(function (c) { return '<code>' + escapeHtml(c) + '</code>'; }).join(' ') +
      '</div>';
  }

  function renderRoleCol(role, cssClass, label) {
    if (!role) return '';
    return '<div class="role-col ' + cssClass + '">' +
      '<h4>' + escapeHtml(label) + (role.resume ? ' — ' + escapeHtml(role.resume) : '') + '</h4>' +
      '<ol>' + role.etapes.map(function (e) { return '<li>' + escapeHtml(e) + '</li>'; }).join('') + '</ol>' +
      '</div>';
  }

  function scenarioMarkup(s) {
    var rolesHtml;
    if (s.solo) {
      rolesHtml = '<div class="grid cols-2">' + renderRoleCol(s.commun, 'role-a', 'Chacun·e de son côté') + '</div>';
    } else {
      var colA = renderRoleCol(s.roleA, 'role-a', 'Étudiant·e A');
      var colB = renderRoleCol(s.roleB, 'role-b', 'Étudiant·e B');
      rolesHtml = '<div class="grid cols-2" data-roles>' +
        (currentView !== 'b' ? colA : '') +
        (currentView !== 'a' ? colB : '') +
        '</div>';
    }

    return (
      '<div class="scenario" id="scenario-' + s.id + '" data-id="' + s.id + '">' +
        '<div class="scenario-head">' +
          '<input type="checkbox" class="scenario-check" aria-label="Marquer le scénario ' + s.id + ' comme réalisé">' +
          '<div class="scenario-num">' + s.id + '</div>' +
          '<h3>' + escapeHtml(s.titre) + '</h3>' +
          '<span class="scenario-meta">' + escapeHtml(s.duree) + '</span>' +
          '<span class="scenario-caret" aria-hidden="true">&#9656;</span>' +
        '</div>' +
        '<div class="scenario-body">' +
          '<p><strong>Objectif —</strong> ' + escapeHtml(s.objectif) + '</p>' +
          (s.contexte ? '<p class="lede">' + escapeHtml(s.contexte) + '</p>' : '') +
          '<div class="roles-wrap">' + rolesHtml + '</div>' +
          renderCommandes(s.commandes) +
          (s.pieges && s.pieges.length ? '<div class="info-block pieges-block"><h4>Pièges fréquents</h4><ul>' + renderList(s.pieges) + '</ul></div>' : '') +
          (s.verification && s.verification.length ? '<div class="info-block verif-block"><h4>Ce qu\'on doit pouvoir vérifier</h4><ul>' + renderList(s.verification) + '</ul></div>' : '') +
        '</div>' +
      '</div>'
    );
  }

  function updateProgress() {
    progressText.textContent = doneCount + ' / ' + total + ' scénarios réalisés';
  }

  function attachHandlers() {
    list.querySelectorAll('.scenario').forEach(function (card) {
      var head = card.querySelector('.scenario-head');
      var check = card.querySelector('.scenario-check');

      head.addEventListener('click', function (evt) {
        if (evt.target === check) return;
        card.classList.toggle('open');
      });

      check.addEventListener('click', function (evt) { evt.stopPropagation(); });
      check.addEventListener('change', function () {
        card.classList.toggle('done', check.checked);
        doneCount += check.checked ? 1 : -1;
        updateProgress();
      });
    });
  }

  function render(data) {
    total = data.scenarios.length;
    list.innerHTML = data.scenarios.map(scenarioMarkup).join('');
    attachHandlers();
    updateProgress();
    // Ouvre le premier scénario par défaut pour inviter à cliquer.
    var first = list.querySelector('.scenario');
    if (first) first.classList.add('open');
  }

  roleButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      roleButtons.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      currentView = btn.getAttribute('data-view');
      if (window.__scenarioData) render(window.__scenarioData);
    });
  });

  fetch('data/scenarios.json')
    .then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then(function (data) {
      window.__scenarioData = data;
      render(data);
    })
    .catch(function (err) {
      list.innerHTML =
        '<div class="callout danger">' +
        '<h4>Impossible de charger data/scenarios.json</h4>' +
        '<p>Cette page charge ses données avec <code>fetch()</code>, ce que les navigateurs bloquent souvent quand un fichier HTML est ouvert directement en double-clic (protocole <code>file://</code>).</p>' +
        '<p><strong>Solution :</strong> dans VSCode, installez l\'extension « Live Server », clic droit sur <code>scenarios.html</code> puis « Open with Live Server » (ou lancez <code>npx serve</code> à la racine du dépôt).</p>' +
        '<p style="color:var(--text-muted);font-size:0.85em">Détail technique : ' + escapeHtml(err.message) + '</p>' +
        '</div>';
    });
})();
