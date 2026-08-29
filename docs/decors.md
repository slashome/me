# Décors

Le décor est la scène derrière chaque écran : dégradés, silhouette, atmosphère.
Il est **entièrement décoratif** — `aria-hidden`, `pointer-events: none`, et rien
de ce qu'il montre n'est une information. Un lecteur d'écran ne le voit pas, et
le site reste complet sans lui.

## Le personnage

Registre : **Fido Dido** — trait blanc, formes simples, corps très allongé,
grandes chaussures. Déplacements mous à la Gaston Lagaffe, pour plus tard.

| Trait | Rendu |
|---|---|
| Grand, fin | corps étiré sur un `viewBox` de 220 × 560 |
| Bandana | bandeau au front, deux pans qui retombent à droite |
| Petit chignon | disque au sommet du crâne |
| Lunettes parfaitement rondes, verres rouges | deux cercles de rayon égal, remplis de rouge sourd, avec une lueur |
| Collier de bois | perles alternées clair / sombre, une perle de métal au centre |
| Bague en argent, pouce **gauche** | anneau `#cfd4d8` |
| Bague en obsidienne, pouce **droit** | anneau `#2a2530` |

Les couleurs des perles et des bagues sont les seules du site à ne pas venir des
jetons de la scène : elles décrivent des matières, pas une interface.

## Animations

Trois, toutes en CSS, toutes coupées par `prefers-reduced-motion`.

| Animation | Durée | Ce qu'elle fait |
|---|---|---|
| **Respiration** | 5,2 s, en boucle | le buste se dilate de 1,8 % et remonte de 2 px |
| **Fumée de cigarette électronique** | 6 s, trois bouffées décalées | trois disques montent, grossissent et s'effacent |
| **Coup de pied thaï** | 17 s, deux images | la jambe part et revient en 1,5 % du cycle, soit ~250 ms |

Le coup de pied est fait en `steps(1)` sur deux groupes qui s'échangent : deux
images, pas d'interpolation. C'est ce qui le rend sec.

## Les décors, et leur registre

L'intention est d'en avoir **plusieurs, tirés au hasard** à chaque visite. Un
seul existe aujourd'hui, donc le tirage n'est pas encore posé : il coûtera ~150
octets de JavaScript le jour où il aura quelque chose à tirer.

| Nom | État | Ce que c'est |
|---|---|---|
| `veille` | ✅ en place | Le personnage debout à droite, braise en bas à gauche |
| `atelier` | ⏳ à faire | Assis, penché sur quelque chose |
| `garde` | ⏳ à faire | En garde de boxe thaï, immobile |
| `nuit` | ⏳ à faire | De dos, face à un horizon |

⚠️ **Ce fichier est le registre.** Un décor qui n'y figure pas n'existe pas :
c'est ici qu'on ajoute une ligne avant d'écrire le SVG.
