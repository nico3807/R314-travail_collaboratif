// Rendu des fiches en accordéon, avec un suivi de progression en mémoire
// (non persisté entre deux visites, volontairement : chaque séance repart
// d'un état propre). Le fichier de données et le libellé du compteur sont
// lus sur le conteneur, ce qui permet de servir aussi bien la page
// Scénarios (deux rôles, filtre de vue) que la page Préparation SAÉ
// (fiches solo). Le filtre de rôle ne s'active que si la barre existe.

(function () {
  var list = document.getElementById('scenario-list');
  var source = list.getAttribute('data-source') || 'data/scenarios.json';
  var noun = list.getAttribute('data-noun') || 'scénarios réalisés';
  var progressText = document.getElementById('progress-text');
  var roleButtons = document.querySelectorAll('.role-toggle button');
  var modal = document.getElementById('modal');
  var modalContenu = document.getElementById('modal-contenu');
  var currentView = 'both'; // 'both' | 'a' | 'b'
  var doneCount = 0;
  var total = 0;
  // Contenus des pop-ups, indexés au fil du rendu : le bouton ne porte que
  // l'indice, ce qui évite de sérialiser du HTML dans un attribut.
  var popups = [];

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

  // Une étape porte soit une capture (image/alt), soit plusieurs (images: []).
  function renderFigures(source) {
    if (!source) return '';
    var figures = source.images || (source.image ? [source] : []);
    return figures.map(function (fig) {
      return '<figure class="etape-figure">' +
        '<img src="' + escapeHtml(fig.image) + '" alt="' + escapeHtml(fig.alt || '') + '" loading="lazy">' +
        '</figure>';
    }).join('');
  }

  function renderPopupBouton(popup) {
    var index = popups.push(popup) - 1;
    return ' <button type="button" class="popup-btn" data-popup="' + index + '">' +
      escapeHtml(popup.bouton) + '</button>';
  }

  function renderEtape(etape) {
    if (typeof etape === 'string') return '<li>' + escapeHtml(etape) + '</li>';
    return '<li>' + escapeHtml(etape.texte) +
      (etape.popup ? renderPopupBouton(etape.popup) : '') +
      renderFigures(etape) +
      '</li>';
  }

  function renderRoleCol(role, cssClass, label) {
    if (!role) return '';
    return '<div class="role-col ' + cssClass + '">' +
      '<h4>' + escapeHtml(label) + (role.resume ? ' — ' + escapeHtml(role.resume) : '') + '</h4>' +
      '<ol>' + role.etapes.map(renderEtape).join('') + '</ol>' +
      '</div>';
  }

  function scenarioMarkup(s) {
    var rolesHtml;
    if (s.solo) {
      rolesHtml = '<div class="grid cols-2">' +
        renderRoleCol(s.commun, 'role-a', s.commun.label || 'Chacun·e de son côté') +
        '</div>';
    } else {
      // Les binômes du TP s'appellent Théodora et PLK ; la fiche SAÉ réutilise
      // les deux colonnes pour d'autres rôles et fournit alors ses libellés.
      var colA = renderRoleCol(s.roleA, 'role-a', (s.roleA && s.roleA.label) || 'Théodora');
      var colB = renderRoleCol(s.roleB, 'role-b', (s.roleB && s.roleB.label) || 'PLK');
      rolesHtml = '<div class="grid cols-2" data-roles>' +
        (currentView !== 'b' ? colA : '') +
        (currentView !== 'a' ? colB : '') +
        '</div>';
    }

    return (
      '<div class="scenario" id="scenario-' + s.id + '" data-id="' + s.id + '">' +
        '<div class="scenario-head">' +
          '<input type="checkbox" class="scenario-check" aria-label="Marquer « ' + escapeHtml(s.titre) + ' » comme réalisé">' +
          '<div class="scenario-num">' + s.id + '</div>' +
          '<h3>' + escapeHtml(s.titre) + '</h3>' +
          (s.duree ? '<span class="scenario-meta">' + escapeHtml(s.duree) + '</span>' : '') +
          '<span class="scenario-caret" aria-hidden="true">&#9656;</span>' +
        '</div>' +
        '<div class="scenario-body">' +
          '<p><strong>Objectif —</strong> ' + escapeHtml(s.objectif) + '</p>' +
          (s.contexte ? '<p class="lede">' + escapeHtml(s.contexte) + '</p>' : '') +
          (s.alerte ? '<div class="info-block interdit-block"><h4>' + escapeHtml(s.alerte.titre) + '</h4><ul>' + renderList(s.alerte.items) + '</ul></div>' : '') +
          '<div class="roles-wrap">' + rolesHtml + '</div>' +
          renderCommandes(s.commandes) +
          (s.pieges && s.pieges.length ? '<div class="info-block pieges-block"><h4>Pièges fréquents</h4><ul>' + renderList(s.pieges) + '</ul></div>' : '') +
          (s.verification && s.verification.length ? '<div class="info-block verif-block"><h4>Ce qu\'on doit pouvoir vérifier</h4><ul>' + renderList(s.verification) + '</ul>' + renderFigures(s.verificationImage) + '</div>' : '') +
        '</div>' +
      '</div>'
    );
  }

  function updateProgress() {
    if (progressText) progressText.textContent = doneCount + ' / ' + total + ' ' + noun;
  }

  function popupMarkup(p) {
    var html = '<h3>' + escapeHtml(p.titre) + '</h3>';
    if (p.intro) html += '<p>' + escapeHtml(p.intro) + '</p>';
    if (p.tableau) {
      html += '<table class="popup-table"><thead><tr>' +
        p.tableau.entetes.map(function (t) { return '<th scope="col">' + escapeHtml(t) + '</th>'; }).join('') +
        '</tr></thead><tbody>' +
        p.tableau.lignes.map(function (ligne) {
          return '<tr>' + ligne.map(function (cell, i) {
            return i === 0
              ? '<th scope="row">' + escapeHtml(cell) + '</th>'
              : '<td>' + escapeHtml(cell) + '</td>';
          }).join('') + '</tr>';
        }).join('') +
        '</tbody></table>';
    }
    if (p.sousTitre) html += '<h4>' + escapeHtml(p.sousTitre) + '</h4>';
    if (p.choix) {
      html += '<ul>' + p.choix.map(function (c) {
        return '<li><strong>' + escapeHtml(c.label) + '</strong> : ' + escapeHtml(c.texte) + '</li>';
      }).join('') + '</ul>';
    }
    if (p.conclusion) html += '<p>' + escapeHtml(p.conclusion) + '</p>';
    return html;
  }

  function ouvrirPopup(index) {
    modalContenu.innerHTML = popupMarkup(popups[index]);
    modal.hidden = false;
    modal.querySelector('.modal-close').focus();
  }

  function fermerPopup() {
    modal.hidden = true;
  }

  if (modal) {
    modal.addEventListener('click', function (evt) {
      if (evt.target === modal || evt.target.closest('.modal-close')) fermerPopup();
    });

    document.addEventListener('keydown', function (evt) {
      if (evt.key === 'Escape' && !modal.hidden) fermerPopup();
    });
  }

  function attachHandlers() {
    list.querySelectorAll('.popup-btn').forEach(function (btn) {
      btn.addEventListener('click', function (evt) {
        evt.stopPropagation();
        ouvrirPopup(Number(btn.getAttribute('data-popup')));
      });
    });

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
    popups = [];
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

  fetch(source)
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
        '<h4>Impossible de charger ' + escapeHtml(source) + '</h4>' +
        '<p>Cette page charge ses données avec <code>fetch()</code>, ce que les navigateurs bloquent souvent quand un fichier HTML est ouvert directement en double-clic (protocole <code>file://</code>).</p>' +
        '<p><strong>Solution :</strong> dans VSCode, installez l\'extension « Live Server », clic droit sur la page puis « Open with Live Server » (ou lancez <code>npx serve</code> à la racine du dépôt).</p>' +
        '<p style="color:var(--text-muted);font-size:0.85em">Détail technique : ' + escapeHtml(err.message) + '</p>' +
        '</div>';
    });
})();
