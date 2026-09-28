# Préparation SAÉ — configuration complète

Document interne, destiné à l'enseignant·e. Il décrit tout ce qui a été mis en
place pour que les étudiant·es obtiennent seuls l'accès au dépôt privé
`Test_arcade` et travaillent chacun dans le dossier de leur équipe.

Rien ici n'est secret : les jetons ne sont jamais écrits dans le dépôt.

---

## 1. Vue d'ensemble

Deux dépôts se répartissent le travail :

| Dépôt | Visibilité | Rôle |
|---|---|---|
| `nico3807/R314-travail_collaboratif` | **public** | Le site du TP, le formulaire d'inscription et le robot qui le traite. |
| `nico3807/Test_arcade` | **privé** | Le projet SAÉ. Contient `games/<groupe>/` et le robot qui contrôle les Pull Requests. |

Le formulaire **doit** être sur le dépôt public : un dépôt privé n'est lisible
qu'après invitation, et c'est précisément l'invitation que l'étudiant·e vient
demander. C'est le problème de l'amorçage, et c'est la raison de cette
répartition en deux dépôts.

Le parcours complet, vu de l'étudiant·e :

```
      (dépôt public)                            (dépôt privé)
 formulaire d'inscription
          │
          │  ouvre une issue étiquetée « inscription »
          ▼
 .github/workflows/inscription.yml
          │
          ├─ lit le groupe déclaré, répond, ferme l'issue
          │
          ├─ écrit .github/groupes.json  ─────────────►  Test_arcade
          │
          └─ envoie l'invitation        ─────────────►  Test_arcade
                                                             │
                              l'étudiant·e accepte, clone,   │
                              travaille, ouvre une PR        │
                                                             ▼
                                        .github/workflows/verifier_dossiers.yml
                                        (autorise ou bloque selon groupes.json)
```

---

## 2. Ce qui se passe, dans l'ordre

1. L'étudiant·e ouvre le formulaire depuis la fiche 1 de la page
   « Préparation SAÉ ». **Il ou elle ne saisit pas son pseudo** : GitHub le
   transmet lui-même (`github.event.issue.user.login`). Aucune faute de frappe
   n'est donc possible, ce qui élimine la principale source de pannes.
2. Le seul champ à remplir est une liste déroulante des 20 groupes, plus une
   case de confirmation. L'issue est automatiquement étiquetée `inscription`.
3. Le robot se déclenche, relit le groupe, et **répond dans l'issue** avant de
   la fermer. Si le groupe est illisible, il explique quoi faire et ne ferme
   pas.
4. Le robot met à jour `groupes.json` dans `Test_arcade`, puis envoie
   l'invitation de collaboration.
5. Plus tard, quand l'équipe ouvre une Pull Request sur `Test_arcade`, le robot
   `verifier-acces` vérifie que tous les fichiers touchés sont bien sous
   `games/<son groupe>/`.

Une seconde inscription **corrige** la première : la personne est retirée de
tous les groupes avant d'être ajoutée au nouveau. Un·e étudiant·e qui s'est
trompé·e se dépanne donc tout seul, sans intervention.

---

## 3. Les fichiers, un par un

### Sur le dépôt public

#### `.github/ISSUE_TEMPLATE/inscription.yml`

Le formulaire (GitHub Issue Form). Points à connaître :

- `labels: ["inscription"]` — c'est cette étiquette que le robot teste. Sans
  elle, rien ne se déclenche.
- `type: dropdown`, `id: groupe`, les 20 options, `required: true`.
- Une case à cocher obligatoire (« ce compte est bien le mien »), qui sert
  surtout à faire relire l'avertissement.

Le corps de l'issue est ensuite rendu par GitHub sous cette forme, que le robot
analyse :

```
### Votre groupe

TPA1_groupe1
```

#### `.github/workflows/inscription.yml`

Le robot d'inscription. Quatre étapes.

```yaml
on:
  issues:
    types: [opened, edited]
permissions:
  issues: write
concurrency:
  group: inscription-arcade
  cancel-in-progress: false
```

La **file d'attente** (`concurrency`) n'est pas décorative : les inscriptions
arrivent toutes dans le même quart d'heure de TP. Sans elle, deux exécutions
simultanées pousseraient sur `Test_arcade` en même temps et la seconde serait
rejetée.

| Étape | Ce qu'elle fait |
|---|---|
| `lecture` | Extrait le groupe, valide contre la liste des 20, rédige la réponse, publie trois sorties : `valide`, `groupe`, `arcade_pret`. |
| Répondre | `gh issue comment`, puis `gh issue close` si l'inscription est valide. |
| Inscrire dans `Test_arcade` | Clone, modifie `groupes.json`, commit, push. |
| Inviter | `gh api --method PUT repos/.../collaborators/<pseudo> -f permission=push`. |

La mise à jour de `groupes.json` est **incrémentale** :

```python
# 1. On retire la personne de partout avant de l'ajouter : les corrections
#    de groupe deviennent gratuites.
for k in groupes:
    groupes[k] = [m for m in groupes[k] if m.lower() != auteur.lower()]

# 2. Les pseudos fictifs du groupe visé n'ont plus de raison d'être dès
#    qu'une vraie personne s'y déclare.
groupes[cle] = [m for m in groupes[cle]
                if not re.fullmatch(r"pseudo_etudiant\d*", m)]
groupes[cle].append(auteur)
```

Le push n'a lieu que si `git diff` constate un changement : réinscrire
quelqu'un déjà à sa place ne produit aucun commit. L'invitation est elle aussi
idempotente.

#### `outils/inscrire.py`

Outil de secours côté enseignant, à lancer à la main. Il relit **toutes** les
issues d'inscription et reconstruit le fichier.

```bash
python outils/inscrire.py --arcade "C:/chemin/vers/Test_arcade"              # simulation
python outils/inscrire.py --arcade "C:/chemin/vers/Test_arcade" --appliquer  # pour de vrai
```

> **Attention — il reconstruit au lieu d'ajouter.** Contrairement au robot, ce
> script repart de zéro : tout groupe sans inscription se retrouve avec une
> liste **vide**, et les `pseudo_etudiant*` restants disparaissent. Les
> étudiant·es de ces groupes seraient alors bloqués par `verifier-acces`
> jusqu'à leur inscription. Ne l'utilisez que si le robot est hors service.

Sans `--appliquer`, il n'écrit rien et se contente d'afficher ce qu'il ferait.

#### Les pages du site

- `data/sae.json` — le contenu des 6 fiches ; c'est le seul fichier à modifier
  pour changer le texte.
- `sae.html` — la page, qui réutilise `js/scenarios.js` en lui passant
  `data-source="data/sae.json"` et `data-noun`.

Les 6 fiches :

| # | Titre |
|---|---|
| 1 | Déclarer votre compte GitHub |
| 2 | Rejoindre le dépôt privé et le cloner dans VS Code |
| 3 | Mettre toute l'équipe sur la branche du groupe |
| 4 | Travailler uniquement dans le dossier de jeu de votre équipe |
| 5 | Enregistrer ses modifications (commit) et les envoyer sur GitHub (push) |
| 6 | Faire relire et intégrer votre jeu (Pull Request) |

### Sur le dépôt privé

#### `.github/groupes.json`

La référence unique : qui a le droit d'écrire où.

```json
{
  "games/TPA1_groupe1/": ["Junes-Hope", "MGAME4011"],
  "games/TPA1_groupe2/": ["Vincent1906", "lucasbsq"]
}
```

La **barre finale des clés est significative** : le contrôle est un
`chemin.startswith(cle)`. Sans elle, `games/TPA1_groupe1` autoriserait aussi
`games/TPA1_groupe10/`.

#### `.github/workflows/verifier_dossiers.yml`

Se déclenche sur chaque Pull Request vers `main`.

- Les pseudos listés dans `enseignants = ["nico3807"]` passent sans contrôle.
- L'auteur testé est **`github.event.pull_request.user.login`**, et non
  `github.actor`. La différence compte : `github.actor` désigne la dernière
  personne ayant poussé sur la branche, donc un correctif poussé par
  l'enseignant·e aurait désactivé toute la vérification.
- Les fichiers comparés viennent de `git diff --name-only origin/main...HEAD`,
  d'où le `fetch-depth: 0` du checkout.
- Un seul fichier hors zone fait échouer le job, avec la liste des coupables.

#### Protection de la branche `main`

| Réglage | Valeur |
|---|---|
| Approbations requises | 1 |
| Contrôle obligatoire | `verifier-acces` |
| Appliqué aux administrateurs | **non** |
| Push forcés | non |

Les deux conditions se cumulent : le robot au vert **et** une approbation.
C'est ce qui rend la relecture entre coéquipiers non facultative.

« Appliqué aux administrateurs : non » est délibéré. C'est ce qui permet au
robot d'inscription de pousser `groupes.json` directement sur `main` avec un
jeton appartenant à `nico3807`. Si vous activez ce réglage, **le robot cesse de
fonctionner**.

---

## 4. Le secret `TOKEN_ARCADE`

Le `GITHUB_TOKEN` fourni par GitHub Actions ne vaut que pour le dépôt qui
exécute le workflow. Pour écrire dans `Test_arcade` et y inviter des gens, il
faut un jeton personnel.

**Créer le jeton** — dans les réglages du *compte* (pas d'un dépôt) :
Settings → Developer settings → Personal access tokens → Fine-grained tokens.

| Champ | Valeur |
|---|---|
| Repository access | Only select repositories → `Test_arcade` |
| Contents | Read and write (pour pousser `groupes.json`) |
| Administration | Read and write (pour inviter les collaborateurs) |

**Le déposer** — sur le dépôt *public*, dans
Settings → Secrets and variables → Actions → New repository secret,
sous le nom exact `TOKEN_ARCADE`.

Deux remarques :

- Le jeton n'est affiché qu'une fois, à sa création.
- **Il expire.** À son expiration, le robot continuera de répondre aux
  étudiant·es et de fermer les issues, mais n'écrira plus rien et n'invitera
  plus personne. Pensez à le renouveler avant chaque rentrée.

Le workflow sait se comporter correctement quand le jeton est absent : la
réponse faite à l'étudiant·e devient « votre enseignant·e vous enverra
l'invitation prochainement » au lieu de promettre un courriel. C'est le rôle de
la sortie `arcade_pret`.

---

## 5. Détails de conception qui ne se devinent pas

Ces points ont chacun coûté un aller-retour ; les modifier à la légère casse
l'ensemble.

**Le contexte `secrets` n'est pas lisible depuis un `if:`.** Ni au niveau du
job, ni au niveau de l'étape. D'où le détour : l'étape `lecture` évalue
`${{ secrets.TOKEN_ARCADE != '' }}` dans un `env:`, puis l'écrit dans
`$GITHUB_OUTPUT`. Les étapes suivantes testent
`steps.lecture.outputs.arcade_pret == 'true'`.

**`GITHUB_ENV` n'est pas lisible dans l'étape qui l'écrit.** Une variable
posée ainsi n'existe qu'à partir de l'étape *suivante*. Pour transmettre une
valeur, c'est `$GITHUB_OUTPUT` qu'il faut, pas `$GITHUB_ENV`.

**Le corps de l'issue est écrit par n'importe qui sur Internet.** Le dépôt est
public. Ce texte ne doit donc jamais être interpolé dans un script shell : il
transite par une variable d'environnement (`CORPS`), et le script Python le lit
via `os.environ`.

**`gh api --paginate` sans `--jq` ne produit pas du JSON valide.** Il
concatène plusieurs tableaux. D'où le `--jq '.[].login'` puis un découpage
ligne à ligne dans `inscrire.py`.

**Les accents dans les sorties Python.** Les workflows posent
`PYTHONIOENCODING: utf-8`, sans quoi le commentaire publié dans l'issue perd
ses accents.

**Pas d'étiquette par groupe.** Une première version voulait étiqueter chaque
issue avec son groupe : `gh issue edit --add-label` échoue tant que les 20
étiquettes n'existent pas. L'idée a été abandonnée.

---

## 6. Exploitation courante

### Vérifier que tout va bien

```bash
# Les dernières exécutions du robot
gh run list --repo nico3807/R314-travail_collaboratif --workflow inscription.yml --limit 10

# Qui est inscrit où
gh api repos/nico3807/Test_arcade/contents/.github/groupes.json --jq '.content' | base64 -d

# Le secret est-il en place ?
gh secret list --repo nico3807/R314-travail_collaboratif
```

### Relevé à la dernière vérification

- 42 demandes d'inscription traitées ; 50 exécutions du robot, dont 49 en
  succès et 1 annulée (la file d'attente ayant fait son travail).
- 33 étudiant·es réellement inscrits.
- 4 groupes encore garnis de pseudos fictifs, donc personne ne s'y est déclaré :
  `TPA1_groupe4`, `TPA2_groupe5`, `TPB1_groupe2`, `TPB1_groupe8`.

Tant qu'un groupe reste fictif, ses membres seront **bloqués par
`verifier-acces`** à leur première Pull Request. C'est le comportement voulu,
mais c'est aussi le moment où l'on reçoit un message d'étudiant paniqué : la
réponse est toujours « refaites l'étape 1 ».

### Diagnostic

| Symptôme | Cause la plus probable |
|---|---|
| Le robot répond mais `groupes.json` ne bouge pas | `TOKEN_ARCADE` absent ou expiré. |
| « impossible de lire votre groupe » | Issue écrite à la main au lieu du formulaire. |
| Le push du robot est rejeté | « Appliqué aux administrateurs » a été activé sur `main`. |
| Une PR est bloquée alors que le dossier est bon | Le pseudo n'est pas dans `groupes.json`, ou la barre finale manque à la clé. |
| `gh` dit « not logged into any GitHub hosts » depuis `inscrire.py` | Le Python du Microsoft Store n'atteint pas le trousseau Windows. Lancez le script avec un autre interpréteur Python. |

---

## 7. Limites connues

- **Aucune vérification d'identité.** N'importe qui sur Internet peut ouvrir le
  formulaire et s'inscrire dans un groupe, et recevra une invitation au dépôt
  privé. Pour une SAÉ en petite promotion c'est acceptable, mais c'est un choix
  à assumer consciemment : la seule barrière est que l'URL du formulaire n'est
  pas diffusée en dehors du cours. Surveillez la liste des collaborateurs.
- Un·e étudiant·e peut se déclarer dans le groupe d'un·e autre. Rien ne
  l'empêche ; la correction se fait par une nouvelle inscription.
- Les deux illustrations de la page Concepts deviennent illisibles sur
  téléphone, faute de version simplifiée pour petits écrans.
