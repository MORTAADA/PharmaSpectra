# PharmaSpectra — version 1.0.0

Prototype local HTML/CSS/JavaScript d’une base de données spectrale de médicaments. Les données chimiques et spectrales doivent rester liées à des sources vérifiables.

## Nouveautés 0.7.0

- Ajout des liens directs NIST de téléchargement JCAMP-DX pour l’IR et l’UV/Visible de l’aspirine.
- Dans la fiche de spectre, l’application distingue la page de référence et le fichier de données.
- Les spectres restent indiqués comme non intégrés tant que les points numériques n’ont pas été importés et validés localement.

## Démarrer

1. Décompresser l’archive.
2. Dans le dossier `PharmaSpectra`, exécuter `python -m http.server 8000`.
3. Ouvrir `http://localhost:8000` dans le navigateur.

Ne pas ouvrir `index.html` directement en `file://`, car le navigateur peut bloquer le chargement du JSON.

## Importer un spectre NIST

Pour l’aspirine, la fiche IR NIST indique une référence Coblentz (réf. 05063), solide en disque KBr, mesurée en transmission avec un Perkin-Elmer 21 et une résolution annoncée de 2 cm⁻¹. Le spectre a été numérisé depuis une copie papier. La page propose un fichier JCAMP-DX :

- Fiche IR : https://webbook.nist.gov/cgi/cbook.cgi?ID=C50782&Index=1&Type=IR-SPEC
- Données IR JCAMP-DX : https://webbook.nist.gov/cgi/cbook.cgi?Index=1&JCAMP=C50782&Type=IR
- Fiche UV/Visible : https://webbook.nist.gov/cgi/cbook.cgi?ID=C50782&Mask=3F90&Units=SI
- Données UV/Visible JCAMP-DX : https://webbook.nist.gov/cgi/cbook.cgi?Index=0&JCAMP=C50782&Type=UVVis

Téléchargez le fichier depuis NIST via le navigateur. Vérifiez les conditions et les droits de réutilisation, puis importez-le avec l’outil d’importation de l’application. Après import, contrôlez les unités et les valeurs avant de marquer le spectre comme intégré. Les liens directs pointent vers NIST et ne signifient pas que les fichiers sont stockés dans ce dépôt.

## Limites scientifiques

- Aucun point spectral n’a été inventé.
- Une référence externe n’est pas équivalente à un jeu de données local.
- La numérisation d’un tracé publié peut introduire une incertitude; cette provenance doit être indiquée.
- Les données NIST sont soumises aux mentions de copyright et conditions de réutilisation indiquées par NIST.


## Version 0.9.0 — structure à côté des spectres

La fiche médicament utilise maintenant une disposition en deux colonnes : la structure chimique et les propriétés (formule, masse molaire, CAS, nom IUPAC) restent visibles à côté du panneau spectral. La mise en page devient une colonne sur les petits écrans. Les images de structure sont chargées depuis les URL PubChem renseignées dans `data/molecules.json`; un lien de secours s’affiche si une image ne peut pas être chargée. Cette modification ne signifie pas que des spectres numériques ont été ajoutés : les courbes nécessitent toujours des points et une source vérifiée.


## Version 0.9.1 — tableau de bord inspiré de la maquette fournie

- Barre supérieure bleu nuit avec recherche globale.
- Navigation latérale et liste compacte des médicaments.
- Structure chimique et composition côte à côte.
- Les quatre panneaux IR, RMN ¹H, RMN ¹³C et UV-Visible sont visibles simultanément dans une grille responsive.
- Chaque panneau indique explicitement si des données numériques ont été intégrées. Aucun tracé fictif n'est généré.
- Sur petit écran, les panneaux passent en une seule colonne.

Note : cette version rapproche la disposition et les couleurs de la capture fournie. Les cartes sans données restent des emplacements informatifs et ne prétendent pas contenir des spectres expérimentaux.


## Version 0.9.5 — recherche de références externes

- Pour les panneaux spectraux sans référence déjà enregistrée, la fiche propose maintenant des liens de recherche vers SDBS et NIST.
- Ces liens sont des points de départ pour la recherche documentaire : ils ne confirment pas qu’un spectre précis existe pour chaque molécule.
- Le statut distingue toujours les références à rechercher des données numériques locales validées.


## Version 0.9.5 — références RMN de l’aspirine

Ajout de références HMDB pour des spectres RMN expérimentaux de l’aspirine : RMN ¹H (600 MHz, H₂O, DSS, 25 °C, pH 7,00) et RMN ¹³C (50,18 MHz, CDCl₃, TMS). Les références et conditions sont affichées, mais les données numériques ne sont pas considérées comme intégrées tant que leurs fichiers n’ont pas été importés et vérifiés. Sources : https://hmdb.ca/spectra/nmr_one_d/1776 et https://hmdb.ca/spectra/nmr_one_d/3097.

## Version 0.9.6 — listes de pics RMN publiées

- Import des couples déplacement chimique / intensité publiés pour les listes de pics RMN ¹H et ¹³C de l’aspirine (HMDB 1776 et 3097, tels qu’affichés par PubChem).
- L’interface affiche ces valeurs dans un tableau, avec une mention explicite « liste de pics publiée — pas de courbe continue ».
- Les valeurs ne sont pas interpolées et aucune courbe expérimentale continue n’est reconstruite à partir de quelques pics.
- Les spectres IR et UV-Visible restent à intégrer sous forme de données numériques vérifiées. La référence IR Coblentz/NIST consultée signale une image numérisée soumise à des restrictions de téléchargement; vérifier la licence et la provenance avant toute intégration.

## Version 0.9.7 — traçabilité des sources et des données

- Les liens de téléchargement JCAMP-DX NIST pour les spectres IR (Coblentz, réf. 05063) et UV/Visible (Lang, 1962; RAS UV No. 19697) sont documentés comme liens externes.
- Les fichiers JCAMP-DX ne sont pas inclus dans l’archive et les spectres IR/UV-Visible restent « à intégrer » tant que les fichiers n’ont pas été téléchargés, analysés et validés localement.
- Les listes RMN sont explicitement qualifiées de listes de pics publiées; elles ne sont pas des courbes numériques continues et ne sont pas marquées comme fichiers spectraux locaux importés.
- Sources : https://webbook.nist.gov/cgi/cbook.cgi?ID=C50782&Index=1&Type=IR-SPEC ; https://webbook.nist.gov/cgi/cbook.cgi?ID=C50782&Mask=3F90&Units=SI ; https://hmdb.ca/spectra/nmr_one_d/1776 ; https://hmdb.ca/spectra/nmr_one_d/3097.


## Version 0.9.8 — affichage analytique et import local

- Interface de fiche médicament avec quatre cartes de spectres en grille et métadonnées de source.
- Import de fichiers `.jdx`, `.dx`, `.jcamp`, `.csv`, `.tsv` et `.txt` via le bouton « Importer un spectre ».
- Le fichier importé est associé au médicament sélectionné et au type de spectre choisi; l'application trace les points X/Y lus.
- Les imports sont conservés uniquement dans la session du navigateur : ils ne modifient pas le fichier JSON ni ne persistent après rechargement.
- Les métadonnées du fichier et la provenance doivent être vérifiées par l'utilisateur; importer un fichier ne constitue pas en soi une validation scientifique.


## Version 0.9.9 — fiche complète au clic

- Un clic sur un médicament dans la liste actualise la fiche sans changer de page.
- La fiche rassemble l’identité du médicament, l’image de sa structure chimique, la composition et les quatre cartes IR, RMN ¹H, RMN ¹³C et UV-Visible.
- Après sélection, la page défile vers la fiche complète pour la rendre visible, notamment sur mobile.
- Les courbes ne sont dessinées que depuis des données numériques disponibles ; aucune courbe scientifique n’est inventée.


## Version 0.9.10 — affichage de références spectrales réelles

- Les listes de pics RMN publiées pour l’aspirine sont représentées en diagrammes de bâtons, sans relier les pics ni fabriquer de signal continu; les valeurs restent consultables dans un tableau repliable.
- Les cartes IR et UV-Visible affichent les images SVG des spectres de référence publiées par NIST, lorsque le navigateur peut charger ces images. Elles sont explicitement étiquetées comme images de référence externes, et non comme données numériques intégrées.
- Référence IR : Coblentz Society, réf. 05063, solide en disque KBr, transmission, Perkin-Elmer 21, résolution 2 cm⁻¹, spectre numérisé depuis une copie papier. Référence UV/Visible : Lang (éditeur), 1962, RAS UV No. 19697, instrument Unicam SP 500.
- Les fichiers numériques JCAMP-DX ne sont pas inclus localement : la récupération automatique a échoué dans l’environnement de travail. Les liens de téléchargement restent fournis sur les pages NIST.
- Sources : https://webbook.nist.gov/cgi/cbook.cgi?ID=C50782&Index=1&Type=IR-SPEC ; https://webbook.nist.gov/cgi/cbook.cgi?ID=C50782&Mask=3F92 ; https://hmdb.ca/spectra/nmr_one_d/1776 ; https://hmdb.ca/spectra/nmr_one_d/3097 .


## Version 0.9.11 — audit des statuts et des sources

- Le compteur « spectre numérique intégré » compte désormais uniquement les spectres possédant au moins deux points X/Y, et non les simples listes de pics RMN.
- La référence IR Coblentz/NIST est explicitement marquée comme image numérisée sans téléchargement numérique pour cette référence; le lien JCAMP trompeur a été retiré.
- La référence UV/Visible indique que NIST propose un fichier JCAMP-DX, mais que ce fichier n’est pas inclus dans l’archive.
- Les statuts des listes de pics RMN précisent qu’il ne s’agit pas de spectres complets.
- Aucun point spectral artificiel n’a été ajouté.


## Version 0.9.12 — étape 1 : sécurisation des données locales RMN

- Export local des listes de pics RMN ¹H et ¹³C de l’aspirine vers `data/aspirin_nmr_1h_peaks.csv` et `data/aspirin_nmr_13c_peaks.csv`. Les valeurs sont reprises sans modification depuis les listes publiées déjà présentes dans `molecules.json`.
- Ajout de `data/source-audit-aspirin.json` pour consigner les sources, conditions, nombre de pics et limites des données disponibles.
- Les CSV contiennent des pics discrets, pas un signal continu ni un FID expérimental complet.
- Les spectres IR et UV-Visible ne sont toujours pas marqués comme intégrés numériquement localement. L’UV NIST reste à télécharger et vérifier; l’IR Coblentz sélectionné ne propose qu’une image selon la page NIST.
- Étape suivante : récupérer un jeu de données numérique complet de référence pour l’UV-Visible, l’importer localement et vérifier l’axe, les unités et la courbe.


## Version 0.9.13 — étape 2 : préparation à l’intégration UV-Visible

- Confirmation sur la page NIST que le spectre UV/Visible de l’aspirine (Lang, 1962; RAS UV No. 19697; instrument Unicam SP 500) possède un téléchargement JCAMP-DX.
- L’environnement de construction ne peut pas récupérer le corps du fichier, car le serveur renvoie le type MIME `chemical/x-jcamp-dx` que l’outil de consultation ne sait pas importer et que l’environnement local ne peut pas joindre directement. Le fichier n’est donc pas inclus dans cette version; aucune donnée n’a été simulée.
- Ajout d’un bouton « Exporter JSON » : après import d’un fichier numérique, l’utilisateur peut exporter les points intégrés pour les conserver et les examiner avant remplacement manuel de `data/molecules.json`.
- Si un JCAMP-DX utilise un encodage compressé non pris en charge, l’application affiche un message explicite et suggère un export CSV depuis la source plutôt que de tracer des valeurs incorrectes.
- Source NIST : https://webbook.nist.gov/cgi/cbook.cgi?ID=C50782&Mask=608&Units=SI ; lien JCAMP-DX : https://webbook.nist.gov/cgi/cbook.cgi?Index=0&JCAMP=C50782&Type=UVVis .


## Version 0.9.14 — import plus strict

- Prise en charge explicite des blocs JCAMP-DX non compressés `XYDATA` et `XYPOINTS`, ainsi que des fichiers CSV/TSV et des paires numériques séparées par espaces.
- Les fichiers JCAMP-DX compressés (ASDF/SQZ/DIF/DUP) sont signalés clairement et ne sont pas interprétés à tort comme des données numériques ordinaires. Exportez-les en CSV/XY non compressé depuis le logiciel/source d’origine.
- Un tracé continu est affiché uniquement pour des points X/Y présents. Une liste de pics reste un diagramme de bâtons et n’est pas présentée comme un spectre complet.
- Cette version améliore l’importation, mais **n’ajoute pas de nouvelles mesures expérimentales à la base**. Les données UV/IR numériques de l’aspirine doivent encore être récupérées depuis une source vérifiable.

## Version 0.9.15 — règles communes de validation

Cette version applique une règle permanente à toutes les molécules : une carte visible ne signifie pas qu'un spectre expérimental complet est disponible.

- L'import vérifie désormais que l'axe X est plausible pour le type choisi (IR : cm⁻¹; UV-Visible : nm; RMN : ppm) et refuse les données hors plage de contrôle au lieu de les tracer silencieusement.
- Un fichier importé par l'utilisateur n'est plus associé automatiquement à une URL générique ni présenté comme une source validée. Il est étiqueté « Import à vérifier » jusqu'à vérification de la provenance, des unités et des conditions.
- Les listes de pics restent des diagrammes de bâtons, jamais une courbe interpolée présentée comme expérimentale.
- Un script d'audit réutilisable est fourni : `node scripts/audit-dataset.mjs`. Il recherche les erreurs structurelles, les valeurs non numériques et les plages X suspectes, et signale les données sans source ou les spectres absents.
- Pour chaque spectre ajouté, conserver le nom et l'URL de la source, la citation, le format de données, les unités, le solvant/état de l'échantillon et les paramètres instrumentaux disponibles. Ne jamais combler une donnée manquante par une courbe inventée.

**Limite connue :** les plages du script sont des contrôles de plausibilité généraux, pas des limites physiques universelles. Un avertissement ou une réussite technique ne certifie pas l'authenticité d'une mesure. La v0.9.15 n'ajoute pas de nouveaux points expérimentaux à la base; l'accès aux données de référence doit encore être vérifié pour chaque médicament.

## Version 0.9.16 — audit reproductible de la complétude spectrale

- Le script `scripts/audit-dataset.mjs` vérifie systématiquement les quatre types attendus (IR, RMN ¹H, RMN ¹³C et UV-Visible) pour chaque médicament.
- Il produit `data/spectral-audit-report.json`, un rapport détaillé qui distingue les courbes numériques, les listes de pics, les images de référence et les spectres pour lesquels aucune donnée n’est déclarée.
- Le rapport consigne les sources et fichiers déclarés, les valeurs hors plages de plausibilité et les avertissements de provenance. Les plages sont des garde-fous, pas une certification scientifique.
- Exécution : `node scripts/audit-dataset.mjs` depuis le dossier du projet.
- Cette version améliore la traçabilité et empêche de confondre présence d’une carte et complétude scientifique. Elle n’ajoute pas de mesures expérimentales qui n’ont pas pu être récupérées et vérifiées.

### Politique d’intégration des données originales

Pour chaque médicament, rechercher d’abord le fichier de données expérimental publié (par exemple JCAMP-DX, XY/CSV, FID/NMRML ou format natif documenté). Conserver le fichier source, son URL, la citation, les conditions expérimentales, les unités et le type de signal. Une liste de pics ou une image ne doit jamais être transformée en courbe complète en inventant/interpolant des points. Si les données complètes ne sont pas accessibles légalement ou techniquement, garder le statut incomplet et noter précisément le blocage.


## Version 0.9.17 — correction des axes et contrôle JCAMP-DX

- Correction de l’orientation de l’axe X : les spectres IR et RMN sont désormais affichés selon la convention usuelle décroissante de gauche à droite. Les valeurs des graduations suivent la même orientation que la courbe.
- Le lecteur JCAMP-DX non compressé applique désormais `XFACTOR` et `YFACTOR` et vérifie le nombre de points annoncé par `NPOINTS` lorsqu’il est fourni. Un désaccord bloque l’import au lieu d’accepter silencieusement un fichier potentiellement tronqué ou mal décodé.
- La validation technique n’est pas une validation scientifique : la compression JCAMP-DX (ASDF/SQZ/DIF/DUP) n’est toujours pas prise en charge et doit être convertie en XY/CSV depuis une source ou un logiciel compatible.
- Aucun point spectral expérimental n’a été ajouté dans cette version. Le réseau de l’environnement de construction ne permet pas de récupérer le fichier NIST original; le spectre UV-Visible de l’aspirine reste à télécharger et vérifier avant intégration locale.

## Version 0.9.18 — traçabilité renforcée à l’import

- Lors de l’import d’un spectre, l’application demande désormais le nom de la source, l’URL, la référence bibliographique, les conditions expérimentales et les unités des axes.
- Les métadonnées manquantes sont explicitement signalées; remplir les champs ne constitue pas à lui seul une validation. Elles doivent être comparées au fichier original et à sa publication.
- Le statut reste `imported_needs_source_review`; un contrôle de plage numérique ne prouve ni l’authenticité ni l’intégrité scientifique du signal.
- Aucun nouveau point expérimental n’a été ajouté dans cette version. La source NIST propose un téléchargement JCAMP-DX pour l’UV-Visible de l’aspirine, mais le fichier brut n’a pas pu être récupéré dans l’environnement de construction. Le téléchargement doit être obtenu depuis la page NIST et importé pour vérifier le nombre de points, les unités et les métadonnées.


## Version 0.9.19 — exploration multi-source et image UV NIST

- Ajout sur chaque fiche médicament d’un explorateur documentaire avec liens de recherche vers PubChem, NIST Chemistry WebBook, HMDB, SDBS (AIST/Japon) et SpectraBase. Ces liens sont des pistes de recherche, pas une affirmation que le spectre est disponible ou téléchargé.
- Pour l’aspirine, l’image de référence UV/Visible NIST utilise désormais l’URL de l’image PNG servie par NIST, plus adaptée à l’affichage direct que l’URL SVG. Référence : Lang (éditeur), 1962; RAS UV No. 19697; instrument Unicam SP 500.
- Le dossier `data/source-audit-aspirin.json` documente la vérification croisée entre NIST, HMDB et les références affichées dans PubChem, ainsi que les limites de disponibilité.
- Les listes expérimentales HMDB restent des listes de pics (11 en ¹H et 9 en ¹³C), pas des courbes NMR complètes. Les données numériques JCAMP-DX UV NIST ne sont toujours pas intégrées localement; le spectre IR Coblentz NIST sélectionné reste une image numérisée.
- Aucune donnée spectrale synthétique n’a été ajoutée. Le rapport d’audit est régénéré par `node scripts/audit-dataset.mjs`.

- Complément de recherche (v0.9.19) : ajout de l’image UV/Visible NIST du paracétamol, source Lang (éditeur), 1965; RAS UV No. 19635; instrument Hilger Uvispek. Le JCAMP-DX est annoncé par NIST mais n’est pas encore intégré localement. La page HMDB confirme aussi une entrée de RMN ¹H expérimentale du paracétamol (400 MHz, DMSO-d6, JEOL, TMS), avec liste CSV disponible; ces pics ne sont pas encore importés. Voir `data/source-audit-paracetamol.json`.


## Version 0.9.20 — seconde passe de recherche multi-source

- Ajout de `data/source-research-round2.json`, registre de recherche pour l’aspirine et le paracétamol, avec liens NIST UV-Visible, référence HMDB RMN ¹H du paracétamol, catalogue des téléchargements HMDB et portail SDBS/AIST.
- Le catalogue HMDB confirme la disponibilité de jeux de données de FID RMN et de listes de pics, tout en précisant les exigences de citation et de réutilisation : https://www.hmdb.ca/downloads.
- Le NIST annonce des fichiers JCAMP-DX pour les références UV-Visible de l’aspirine (Lang, 1962; RAS UV No. 19697; Unicam SP 500) et du paracétamol (Lang, 1965; RAS UV No. 19635; Hilger Uvispek). Les fichiers bruts ne sont pas présents dans cette archive.
- La page HMDB du paracétamol a renvoyé une erreur 403 dans cette session; ses conditions sont donc conservées comme données issues de l’audit précédent et non déclarées nouvellement revérifiées.
- **Aucun nouveau point spectral numérique n’a été ajouté dans cette version.** Les sources sont mieux organisées, mais il reste à télécharger puis valider les fichiers originaux avant de tracer des courbes numériques.


## Version 0.9.21 — sources RMN expérimentales du paracétamol

- Ajout des références HMDB des spectres 1D expérimentaux ¹H (400 MHz, DMSO-d6, JEOL, TMS) et ¹³C (22,53 MHz, DMSO-d6, JEOL, TMS) au profil du paracétamol.
- Les pages HMDB indiquent des listes de pics CSV disponibles, mais leurs octets n’ont pas pu être récupérés dans l’environnement de construction; aucune nouvelle valeur ni courbe n’a donc été inventée ou importée.
- Référence distincte à un spectre ¹H prédit HMDB (400 MHz, D₂O) documentée dans `data/source-audit-paracetamol-nmr.json`; il reste explicitement prédit et n’est pas présenté comme expérimental.
- HMDB signale que la redistribution commerciale de données téléchargées nécessite une permission explicite et une attribution appropriée.


## Version 0.9.22 — liens directs vers les références identifiées

- Ajout de liens spécifiques sur les fiches de l’aspirine (JCAMP-DX UV-Visible NIST) et du paracétamol (RMN ¹H/¹³C expérimentales HMDB, ainsi qu’une RMN ¹H prédite clairement séparée).
- Le lien HMDB ¹H expérimental confirme 400 MHz, DMSO-d₆, JEOL et TMS; la page annonce un CSV de pics de 279 octets. La récupération de ses octets a échoué dans l’environnement de recherche (403), donc aucun pic n’a été ajouté.
- Le NIST annonce un téléchargement JCAMP-DX UV-Visible pour l’aspirine (Lang, 1962; RAS UV No. 19697; Unicam SP 500), mais ce fichier n’est pas encore présent dans l’archive.
- Les détails, statuts et limites sont consignés dans `data/source-research-round3.json`.
- **Aucun nouveau point spectral n’a été intégré** : cette version améliore l’accès aux sources originales sans présenter les références comme des données déjà téléchargées.


## Version 0.9.23 — quatrième ronde de recherche documentaire

- Ajout de `data/source-research-round4.json` avec vérification des portails officiels HMDB, MiMeDB et SDBS, ainsi que de la référence de format JCAMP-DX de l’IUPAC.
- Documentation des formats annoncés par HMDB (FID RMN, listes de pics TXT et XML) et MiMeDB (FID, listes de pics et XML), sans prétendre que chaque médicament y est présent.
- Ajout de références spécifiques vérifiées pour le paracétamol (¹H RMN HMDB et UV-Visible NIST) et rappel des conditions expérimentales disponibles.
- Aucun fichier spectral brut ni point numérique nouveau n’a été intégré dans cette ronde : les téléchargements n’ont pas pu être récupérés et validés localement.
- Sources : https://www.hmdb.ca/downloads ; https://mimedb.org/downloads ; https://sdbs.db.aist.go.jp/sdbs/cgi-bin/cre_index.cgi?lang=eng ; https://iupac.org/what-we-do/digital-standards/jcamp-dx/ .


## Recherche spectrale — round 5 (v0.9.24)

Ajout de `data/source-research-round5.json` avec des notices HMDB vérifiées pour le paracétamol : ¹H 400 MHz, ¹³C 22,53 MHz, un second enregistrement ¹H 500 MHz et une expérience 2D HSQC. Ces notices restent des références externes : aucun fichier CSV/FID ni aucune nouvelle courbe numérique n’a été importé dans cette version. Les données 2D HSQC ne remplacent pas les spectres 1D demandés. Vérifier les conditions et les droits de redistribution avant réutilisation.

## Mise à jour v0.9.25 — liste de pics expérimentale du paracétamol
- Intégration locale de la liste de pics ¹H NMR associée à l'entrée HMDB 2079, via les couples déplacement/intensité publiés dans la section Spectral Information de PubChem (CID 1983).
- Le fichier `data/paracetamol_nmr_1h_hmdb2079_peaks.csv` conserve les valeurs publiées sans interpolation ni fusion des pics proches.
- Il s'agit d'une liste de pics expérimentale, pas d'un FID ni d'un spectre numérique continu. Le spectre ¹³C expérimental HMDB 2773 reste documenté mais son CSV n'est pas intégré faute d'accès au contenu vérifiable.


## Version 0.9.27 — liste de pics ¹³C du paracétamol

- Ajout de six couples déplacement chimique / intensité publiés pour le spectre expérimental HMDB 2773 (Acetaminophen, 22,53 MHz, DMSO-d6, JEOL, référence TMS).
- Fichier local : `data/paracetamol_nmr_13c_hmdb2773_peaks.csv`.
- Les valeurs sont reprises de la section Spectral Information de PubChem, CID 1983, qui relie le spectre HMDB 2773.
- L'interface les affiche comme une liste de pics et un diagramme en bâtons; aucune courbe continue n'est reconstruite.
- Source HMDB : https://hmdb.ca/spectra/nmr_one_d/2773 ; page PubChem : https://pubchem.ncbi.nlm.nih.gov/compound/1983#section=Spectral-Information


## Mise à jour v0.9.28 — Ibuprofène ¹³C NMR

Intégration de 10 couples déplacement/intensité publiés pour le spectre expérimental HMDB 2954 (50.32 MHz, CDCl3, référence TMS), tels qu'affichés dans les informations spectrales PubChem. Fichier local : `data/ibuprofen_nmr_13c_hmdb2954_peaks.csv`. Il s'agit d'une liste de pics, pas d'un spectre continu. Le HSQC HMDB 1744 est documenté séparément et n'est pas assimilé à un spectre 1D.


## Mise à jour v0.9.29 — recherche UV-Visible de l'ibuprofène

- Ajout de `data/source-research-round8.json` documentant une étude expérimentale UV-Visible de l'acide ibuprofène dans l'eau déionisée (190–300 nm, pas de 0,2 nm, 20/30/40 °C, Shimadzu UV-2401PC, trois répétitions).
- Les maxima rapportés (223, 258 nm épaule, 265 et 273 nm) sont enregistrés comme caractéristiques bibliographiques, et non comme points numériques mesurés.
- L'article indique que les données sont disponibles sur demande; aucune série brute absorbance/longueur d'onde vérifiable n'a été récupérée. En conséquence, aucune courbe UV numérique n'a été ajoutée.
- Une recherche IR supplémentaire est documentée; aucun fichier JCAMP-DX IR de l'ibuprofène n'a été téléchargé et validé dans cette ronde.
- Sources : https://doi.org/10.1016/j.heliyon.2023.e21260 ; https://pmc.ncbi.nlm.nih.gov/articles/PMC8271527/ ; https://iupac.org/what-we-do/digital-standards/jcamp-dx/ .


## Version 0.9.30 — référence IR SDBS pour l'ibuprofène

- Ajout de `data/source-research-round9.json` et d'une référence IR externe SDBS/AIST pour l'entrée SDBS 41004. La fiche répertorie deux acquisitions : Nujol (SDBS-IR2013-77206ND) et pastille KBr (SDBS-IR2013-80589ND).
- **Réserve d'identité :** SDBS 41004 correspond explicitement au (S)-(+)-ibuprofène; il ne faut pas l'assimiler sans précaution à un échantillon racémique.
- La référence est ajoutée comme ressource externe uniquement : aucun fichier numérique de points IR n'a été téléchargé/validé et aucune courbe n'est créée.
- Le site SDBS/AIST demande une autorisation préalable pour l'utilisation commerciale/profit-making. Vérifier ses conditions et citer la base.
- Un jeu Zenodo contenant des lectures UV-Vis brutes pour des essais de libération de formulations ibuprofène/Poloxamer a été repéré; il ne s'agit pas d'un spectre intrinsèque du principe actif pur et il n'est donc pas versé dans la fiche UV du médicament.
- Sources : https://sdbs.db.aist.go.jp/CompoundLanding.aspx?sdbsno=41004 ; https://zenodo.org/records/20633445 .


## Source research round 10 (v0.9.31)

Added a provenance-only audit covering an ibuprofen ATR-IR reference in SpectraBase (Aldrich sample, reported 99% purity), the AIST/SDBS enantiopure ibuprofen record and its listed IR/NMR records, and the University of Strathclyde paracetamol single-crystal dataset whose description includes UV-Vis measurements (CC BY 4.0). An RSC supplementary document was recorded as a literature cross-check for approximate ibuprofen IR bands. No new numerical spectral points were imported in this round; see `data/source-research-round10.json` for identity caveats, access/rights notes and integration decisions.


## Source research round 11 (v0.9.32)

- Added `data/source-research-round11.json` with three distinct source types: a peer-reviewed UV/Vis absorption-maxima dataset, the SWGDRUG FTIR-ATR reference library, and IUPAC JCAMP-DX format guidance.
- The Nature/Scientific Data dataset reports 18,309 experimentally determined UV/Vis absorption maxima records and provides CSV/JSON/MongoDB data. These are maxima/associated extinction coefficients, not automatically complete wavelength-intensity curves; compound identity and experimental conditions must be matched before import.
- SWGDRUG reports 832 structurally confirmed FTIR-ATR spectra and downloadable formats including JCAMP-DX. Inclusion of ibuprofen or any target medicine is not assumed; check the compound list first.
- IUPAC JCAMP-DX documentation is recorded as a file-format standard, not as an experimental spectral source.
- **No new experimental spectrum points or full curves were imported in v0.9.32.** This is a source-discovery and provenance update only.


## Version 0.9.33 — compatibilité JCAMP-DX et stratégie de validation

- Ajout de `data/source-research-round12.json` documentant `readJDX`, JSpecView et la norme IUPAC JCAMP-DX.
- Clarification des formats actuellement acceptés par l'importeur : CSV/TSV/TXT en paires numériques, JCAMP-DX `XYDATA`/`XYPOINTS` non compressés. Les encodages ASDF/SQZ/DIF/DUP restent explicitement refusés.
- Aucun nouveau point spectral n'a été ajouté : les bibliothèques de lecture/conversion sont des outils logiciels, pas des sources de mesures expérimentales.
- Politique de validation recommandée avant prise en charge de l'ASDF : tests de référence sur les facteurs X/Y, `NPOINTS`, `FIRSTX`, `LASTX`, `DELTAX`, contrôles de continuité et comparaison des points décodés à un lecteur indépendant.
- Références : https://bryanhanson.github.io/readJDX/articles/readJDX.html ; https://pmc.ncbi.nlm.nih.gov/articles/PMC2203984/ ; https://old.iupac.org/jcamp/protocols/dxir01.pdf .

## Version 0.9.34 — détection plus sûre des encodages JCAMP-DX

- Correction de la détection des encodages ASDF dans le bloc de données XY : le codage SQZ/DIF/DUP est généralement représenté par les caractères des valeurs, et pas nécessairement annoncé dans l'étiquette `XYDATA`.
- L'importeur inspecte désormais le bloc XY et refuse explicitement les données compressées non décodées, au lieu de risquer de les interpréter comme des nombres ordinaires.
- Ajout de `data/jcamp-compatibility-matrix.json`, qui décrit précisément les formats acceptés, refusés et les contrôles d'intégrité.
- Référence technique : `readJDX` 0.6.4 documente AFFN, PAC, SQZ, DIF, DUP et DIFDUP. Cette référence confirme aussi que la décompression JCAMP exige des contrôles d'intégrité et que les fichiers multiblocs/2D demandent un traitement spécifique.
- Important : cette version améliore la détection et le rejet sûr; elle n'implémente pas encore le décodage SQZ/DIF/DUP/PAC et n'ajoute aucun nouveau point spectral expérimental.


## Version 0.9.35 — prise en charge des lignes JCAMP-DX au format PAC

- L'importeur extrait désormais les champs numériques signés compacts dans les blocs `XYDATA`, en plus des lignes AFFN séparées par espaces.
- Le parseur conserve les exposants scientifiques (`E-` / `E+`) au lieu de les traiter comme des séparateurs PAC.
- Les facteurs X/Y et le contrôle `NPOINTS` restent appliqués.
- Les encodages pseudo-chiffres SQZ/DIF/DUP restent explicitement refusés : leur décodage nécessite une gestion des points de contrôle entre lignes et des répétitions DIFDUP.
- Des tests automatisés couvrent PAC, AFFN, XYPOINTS, facteurs, exposants et rejet des données compressées non prises en charge.

Correctif supplémentaire v0.9.35 : le routage du bloc `XYDATA` / `XYPOINTS` se base maintenant sur le nom du LDR (`##XYDATA` ou `##XYPOINTS`), et non sur sa valeur (`(X++(Y..Y))` / `(XY..XY)`). Un test de régression couvre ce cas.


## Version 0.9.36 — décodage ASDF / SQZ / DIF / DUP

- Implémentation locale du décodage des pseudo-chiffres JCAMP-DX : SQZ positif/négatif, DIF positif/négatif et DUP.
- Prise en charge du mode DIFDUP, où les répétitions portent sur la différence précédente.
- Gestion du Y-checkpoint répété au début des lignes de continuation après une ligne DIF.
- Les facteurs X/Y et le contrôle strict `NPOINTS` sont conservés après décompression.
- Les caractères ou séquences ASDF invalides provoquent une erreur explicite; aucune valeur de remplacement n'est inventée.
- Tests locaux couvrant AFFN, PAC, SQZ, DIF avec checkpoint, DIFDUP, DUP, XYPOINTS, exposants, facteurs et NPOINTS.

Limite : cette version traite les blocs 1D `XYDATA` et `XYPOINTS`. Les fichiers JCAMP multiblocs, `LINK`, `NTUPLES` et RMN 2D ne sont pas aplatis ni pris en charge par ce parseur. Les tests utilisent des fixtures synthétiques conformes aux règles de codage; avant usage réglementaire, comparer les imports à des fichiers instrumentaux de référence et à un lecteur indépendant.


## Version 0.9.37 — sécurité des ordonnées manquantes

- Le marqueur JCAMP-DX `?` (ordonnée manquante ou hors échelle) est désormais détecté explicitement.
- L’import est interrompu avec un message clair au lieu de supprimer implicitement la mesure et de relier artificiellement les points voisins.
- Ajout d’un test de non-régression pour ce marqueur et d’un test ciblé pour la répétition DUP d’une différence.
- Aucun nouveau spectre expérimental ni aucune valeur scientifique n’a été ajouté dans cette version.
- Référence normative : IUPAC JCAMP-DX 4.24, sections ASDF et symbole de donnée invalide.


## Version 0.9.38 — refus explicite des fichiers multidimensionnels et multi-blocs

- Détection et refus explicite des fichiers `NTUPLES`, `DATA TYPE=LINK`, `BLOCKS` et des fichiers contenant plusieurs blocs `TITLE`.
- Cette protection évite le comportement dangereux consistant à ne lire que la première page ou le premier bloc tout en laissant croire que le fichier complet a été importé.
- Ajout de tests de non-régression pour `NTUPLES` et les fichiers multi-blocs.
- Les imports restent limités à un bloc 1D `XYDATA` ou `XYPOINTS`. Aucun nouveau spectre expérimental n’a été ajouté.
- Références : la spécification IUPAC décrit les fichiers comme un ou plusieurs blocs; les variantes NTUPLES et LINK exigent une gestion structurelle dédiée.


## Version 0.9.39 — validation des bornes X JCAMP-DX

- Le lecteur compare désormais le premier et le dernier X décodés de `XYDATA` aux en-têtes `FIRSTX` et `LASTX`, après application de `XFACTOR`.
- Une tolérance de 0,51 pas d’échantillonnage accepte les arrondis d’en-tête; une incohérence est signalée et bloque l’import plutôt que d’afficher un axe potentiellement faux.
- Tests de régression ajoutés pour les bornes correctes et les en-têtes `FIRSTX`/`LASTX` erronés.
- Aucun nouveau point spectral expérimental n’a été ajouté. Les formats `NTUPLES`, `LINK` et multiblocs restent explicitement refusés jusqu’à l’implémentation d’un lecteur page/bloc conscient.


## Version 0.9.40 — canaux RMN réels et imaginaires 1D

- Le lecteur accepte désormais les formes `XYDATA=(X++(R..R))` et `XYDATA=(X++(I..I))`, en plus de la forme Y classique.
- Le type du canal (`real` ou `imaginary`) est conservé dans les métadonnées de l’import afin de ne pas confondre les deux signaux.
- Les autres variable-lists XYDATA non implémentées sont rejetées explicitement.
- Tests de non-régression ajoutés pour les deux canaux RMN 1D et le rejet d’une variable-list inconnue.
- `NTUPLES`, `LINK`, fichiers multi-blocs et RMN 2D restent non pris en charge; aucun aplatissement ni fusion automatique n’est effectué.
- Aucun nouveau spectre expérimental ni point spectral n’a été ajouté dans cette version.
- Référence : IUPAC JCAMP-DX NMR 1993 décrit les formes `R` et `I` et leur codage indépendant; OpenReadout documente également les canaux réel/imaginaire et les pages NTUPLES.


## Version 0.9.41 — extraction des métadonnées JCAMP-DX

L’importateur extrait désormais, lorsqu’ils sont présents, les champs d’en-tête JCAMP-DX : titre, type/classe de données, unités et facteurs X/Y, limites et nombre de points, noyau observé, fréquence RMN, solvant, nombre d’accumulations, séquence d’impulsions, appareil, date, origine et propriétaire. Les champs vendor spécifiques commençant par un point sont conservés séparément. Les conditions détectées préremplissent le champ de vérification à l’import. Ces métadonnées restent des déclarations du fichier source : elles ne prouvent ni l’identité de l’échantillon ni la qualité expérimentale. NTUPLES, LINK et les fichiers multi-blocs restent explicitement refusés dans cette version.


## Version 0.9.42 — NTUPLES RMN 1D (canaux R/I)

Cette version ajoute une prise en charge volontairement limitée des fichiers JCAMP-DX `NTUPLES` de RMN unidimensionnelle :

- reconnaissance de la structure `X/R/I/N` et de ses variables indépendantes/dépendantes/de page ;
- décodage séparé des pages `N=1` (canal réel `R`) et `N=2` (canal imaginaire `I`) ;
- réutilisation du décodeur XYDATA existant pour les données de chaque page, avec facteurs et contrôle `NPOINTS` ;
- conservation des deux tableaux dans `jcamp_channels` lors de l’import et de l’export JSON ; le canal réel est utilisé comme trace principale lorsqu’il existe ;
- refus explicite des structures NTUPLES multidimensionnelles, des séries et des pages non conformes. Les fichiers LINK et multiblocs restent refusés.

Le support ne signifie pas que toutes les variantes NTUPLES sont compatibles. Les unités de l’axe doivent toujours être vérifiées contre le fichier source, et les données importées restent soumises à validation de provenance et de conditions expérimentales. Les tests utilisent un fixture synthétique de structure NTUPLES 1D ; aucune nouvelle mesure expérimentale n’est ajoutée à la base dans cette version.


## Version 0.9.43 — visualisation interactive des canaux NTUPLES R/I

- Les cartes RMN issues d’un import NTUPLES 1D proposent maintenant trois vues : canal réel R, canal imaginaire I et comparaison superposée R + I.
- Les deux signaux restent distincts; aucune somme, moyenne ou correction de phase automatique n’est appliquée.
- La comparaison utilise une même échelle Y couvrant les deux canaux et conserve leur signe; le canal imaginaire est tracé en pointillés.
- Les contrôles indisponibles sont désactivés si le fichier ne contient qu’un seul canal.
- Le canal réel reste l’affichage initial lorsqu’il est disponible.
- Aucun point spectral ni spectre expérimental n’a été ajouté ou généré dans cette version.

Référence scientifique : IUPAC précise que les blocs réel et imaginaire sont en quadrature et que le canal imaginaire sert généralement à la correction de phase; il ne doit donc pas être additionné naïvement au canal réel.


## Version 0.9.44 — correction de phase zéro interactive (RMN NTUPLES)

- Ajout d’un réglage PH0 de −180° à +180° pour les imports NTUPLES 1D qui contiennent les deux canaux R et I.
- La rotation complexe est appliquée à l’aperçu : R′ = R cos(φ) − I sin(φ), I′ = R sin(φ) + I cos(φ).
- Le réglage agit sur les deux canaux et fonctionne dans les vues R, I et comparaison; retour à 0° disponible.
- Les tableaux originaux restent inchangés; la correction n’est pas écrite dans les données importées ni exportées.
- Les canaux doivent avoir le même nombre de points et des coordonnées X alignées; sinon la correction est refusée.
- Cette version ne réalise pas de correction de phase du premier ordre, de correction automatique, ni de traitement du FID/FFT. Aucun nouveau point spectral expérimental n’est ajouté.

Références : recommandations de prétraitement RMN sur la distinction PH0/PH1 et la vérification visuelle de la phase; la rotation zéro-ordre agit de façon constante sur tous les points.

## Version 0.9.45 — correction de phase PH0 + PH1 (RMN NTUPLES)

- Conservation du réglage PH0 (phase constante sur tous les points).
- Ajout du réglage PH1 : variation linéaire totale de phase entre les deux extrémités de la série, avec pivot au centre de l'index des points.
- Application de la rotation complexe point par point aux canaux R et I; les vues Réel, Imaginaire et Comparaison utilisent les canaux corrigés.
- Réinitialisation simultanée de PH0 et PH1.
- Les tableaux sources R/I ne sont jamais modifiés; la correction reste une transformation d'aperçu et n'est pas intégrée à l'export.
- Vérification du nombre de points, de l'alignement des abscisses et de la validité numérique des deux angles.
- PH1 n'est pas une correction automatique : le réglage manuel doit être évalué visuellement selon le spectre et le sens d'acquisition. Aucun nouveau point spectral expérimental n'est ajouté.

Convention d'interface : PH1 indique la variation totale entre les extrémités; le point pivot est au milieu de la séquence de points. Cette convention explicite facilite la reproductibilité, mais peut différer des conventions de signe/position de pivot de certains logiciels RMN.
