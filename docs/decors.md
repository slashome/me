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

## Le rig

La figure est **articulée**, pas dessinée d'un bloc : chaque partie est un `<g>`
avec son pivot déclaré en CSS (`transform-origin`).

```
rig
├─ head        (crâne, chignon, bandana, lunettes, bouche) — pivot à la nuque
├─ torso       (chemise, collier)                          — pivot aux hanches
├─ arm × 2     └─ forearm └─ hand (+ bague)                — pivots épaule, coude, poignet
└─ leg × 2     └─ shin    └─ foot                          — pivots hanche, genou, cheville
```

Le coup de pied thaï n'est plus un échange de deux calques mais une **rotation de
la cuisse et du tibia** : c'est le rig qui bouge, donc n'importe quelle autre pose
s'écrit de la même façon.

Les membres du côté opposé sont à 68 % d'opacité — c'est ce qui donne la
profondeur sans avoir à dessiner deux fois.

## L'animation reste à concevoir

Les trois modes `draw`, `idle` et `vibrate` ont été retirés. Ils traitaient
l'animation comme un réglage global, alors que la scène demande l'inverse : une
**orchestration**. Un chat qui pousse le couvercle d'une poubelle, une bouffée de
vapeur, un coup de pied — ce sont des évènements qui se répondent et se décalent,
pas trois boucles qui tournent chacune dans son coin.

Ce qui reste en place aujourd'hui — respiration, fumée, coup de pied — est
**provisoire**, et c'est bien de trois boucles indépendantes qu'il s'agit. Une
étude est en cours sur la bonne chaîne : timeline, anticipation, retour
d'équilibre, intervalles non mécaniques, interaction au survol, et ce qu'une
bibliothèque apporterait par rapport au CSS.

Ce qui est déjà tranché : la scène reste **entièrement décorative**, elle est
coupée par `prefers-reduced-motion`, et le site est complet sans elle.

## Les décors, et leur registre

Une seule scène pour l'accueil aujourd'hui. D'autres viendront ; le tirage entre
elles n'est pas posé, il n'aurait rien à tirer.

Une scène est un composant complet — décor **et** personnage — sous
`scenes/`. Ce n'est pas un fond auquel on ajoute une figure : la pose du
personnage dépend du décor, et les deux s'écrivent ensemble.

| Nom | État | Ce que c'est |
|---|---|---|
| `alley` | ✅ en place | De face, adossé à un mur, dans une ruelle. Deux murs en fuite, une lampe chaude, quelques accessoires au trait |

| `atelier` | ⏳ à faire | Assis, penché sur quelque chose |
| `garde` | ⏳ à faire | En garde de boxe thaï, immobile |
| `nuit` | ⏳ à faire | De dos, face à un horizon |

⚠️ **Ce fichier est le registre.** Un décor qui n'y figure pas n'existe pas :
c'est ici qu'on ajoute une ligne avant d'écrire le SVG.
