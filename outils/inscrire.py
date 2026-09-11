#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Relève les inscriptions déposées par les étudiant·es sur le dépôt public
R314-travail_collaboratif, puis :

  1. reconstruit '.github/groupes.json' dans le dépôt privé Test_arcade ;
  2. envoie les invitations de collaboration correspondantes.

Par sécurité, le script ne fait RIEN par défaut : il affiche ce qu'il ferait.
Il faut lui passer --appliquer pour qu'il écrive et invite pour de vrai.

Prérequis : la commande 'gh' installée et authentifiée (gh auth status).

Exemples
--------
    python outils/inscrire.py --arcade "C:/chemin/vers/Test_arcade"
    python outils/inscrire.py --arcade "C:/chemin/vers/Test_arcade" --appliquer
"""

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

DEPOT_INSCRIPTIONS = "nico3807/R314-travail_collaboratif"
DEPOT_ARCADE = "nico3807/Test_arcade"

GROUPES = (
    [f"TPA1_groupe{i}" for i in range(1, 7)]
    + [f"TPA2_groupe{i}" for i in range(1, 7)]
    + [f"TPB1_groupe{i}" for i in range(1, 9)]
)


def gh(*args: str) -> str:
    """Appelle 'gh' et renvoie sa sortie, en s'arrêtant net en cas d'échec."""
    res = subprocess.run(
        ["gh", *args], capture_output=True, text=True, encoding="utf-8"
    )
    if res.returncode != 0:
        print(f"\n[ERREUR] gh {' '.join(args)}\n{res.stderr.strip()}", file=sys.stderr)
        sys.exit(1)
    return res.stdout


def lire_inscriptions() -> dict:
    """
    Renvoie {pseudo: (groupe, numero_issue)}.

    Les demandes sont parcourues de la plus ancienne à la plus récente, si
    bien qu'une seconde inscription écrase la première : c'est ainsi qu'un·e
    étudiant·e corrige une erreur de groupe sans intervention de notre part.
    """
    brut = gh(
        "issue", "list",
        "--repo", DEPOT_INSCRIPTIONS,
        "--label", "inscription",
        "--state", "all",
        "--limit", "300",
        "--json", "number,author,body,createdAt",
    )
    issues = sorted(json.loads(brut), key=lambda i: i["createdAt"])

    retenues, ignorees = {}, []
    for issue in issues:
        pseudo = (issue.get("author") or {}).get("login")
        bloc = re.search(
            r"###\s*Votre groupe\s*\n+(.+?)(?:\n###|\Z)", issue.get("body") or "", re.S
        )
        groupe = bloc.group(1).strip().splitlines()[0].strip() if bloc else ""
        if not pseudo or groupe not in GROUPES:
            ignorees.append((issue["number"], pseudo, groupe))
            continue
        retenues[pseudo] = (groupe, issue["number"])

    for numero, pseudo, groupe in ignorees:
        print(f"  ignoree : demande #{numero} de {pseudo} (groupe illisible : {groupe!r})")

    return retenues


def construire_mapping(inscriptions: dict) -> dict:
    """Produit le dictionnaire attendu par le robot 'verifier-acces'."""
    mapping = {f"games/{g}/": [] for g in GROUPES}
    for pseudo, (groupe, _) in sorted(inscriptions.items()):
        mapping[f"games/{groupe}/"].append(pseudo)
    return mapping


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--arcade", required=True,
        help="Chemin du clone local de Test_arcade (celui qui contient .github/).",
    )
    parser.add_argument(
        "--appliquer", action="store_true",
        help="Écrire groupes.json et envoyer les invitations. Sans cette option, "
             "le script se contente d'afficher ce qu'il ferait.",
    )
    args = parser.parse_args()

    arcade = Path(args.arcade).expanduser().resolve()
    cible = arcade / ".github" / "groupes.json"
    if not cible.exists():
        sys.exit(f"[ERREUR] Introuvable : {cible}\nVérifiez l'option --arcade.")

    print(f"Lecture des inscriptions sur {DEPOT_INSCRIPTIONS} ...")
    inscriptions = lire_inscriptions()
    if not inscriptions:
        sys.exit("Aucune inscription exploitable. Rien à faire.")

    mapping = construire_mapping(inscriptions)
    ancien = json.loads(cible.read_text(encoding="utf-8"))

    # --- Compte rendu ---------------------------------------------------
    print(f"\n{len(inscriptions)} inscription(s) retenue(s), réparties ainsi :\n")
    vides = []
    for dossier, membres in mapping.items():
        groupe = dossier.removeprefix("games/").rstrip("/")
        if membres:
            print(f"  {groupe:<16} {', '.join(membres)}")
        else:
            vides.append(groupe)
    if vides:
        print(f"\n  Groupes encore vides ({len(vides)}) : {', '.join(vides)}")
        print("  Leurs membres seront bloqués par le robot tant qu'ils ne se")
        print("  seront pas inscrits. Relancez ce script après leur inscription.")

    # '--paginate' sans '--jq' concatene plusieurs tableaux JSON, ce qui n'est
    # plus du JSON valide : on demande donc directement les pseudos, un par ligne.
    deja = {
        ligne.strip().lower()
        for ligne in gh("api", f"repos/{DEPOT_ARCADE}/collaborators",
                        "--paginate", "--jq", ".[].login").splitlines()
        if ligne.strip()
    }
    a_inviter = [p for p in sorted(inscriptions) if p.lower() not in deja]
    print(f"\nInvitations à envoyer : {len(a_inviter)}")
    for pseudo in a_inviter:
        print(f"  + {pseudo}")

    if mapping == ancien and not a_inviter:
        print("\nTout est déjà à jour.")
        return

    if not args.appliquer:
        print("\n--- SIMULATION ---")
        print("Rien n'a été modifié. Relancez avec --appliquer pour agir.")
        return

    # --- Application ----------------------------------------------------
    cible.write_text(
        json.dumps(mapping, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"\nÉcrit : {cible}")

    for pseudo in a_inviter:
        gh("api", "--method", "PUT",
           f"repos/{DEPOT_ARCADE}/collaborators/{pseudo}",
           "-f", "permission=push")
        print(f"  invitation envoyée à {pseudo}")

    print("\nIl reste à publier le fichier :")
    print(f'  cd "{arcade}"')
    print("  git add .github/groupes.json")
    print('  git commit -m "Met a jour les groupes depuis les inscriptions"')
    print("  git push origin main")


if __name__ == "__main__":
    main()
