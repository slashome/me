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
| **Respiration** | 5,2 s, en boucle libre | le buste se dilate de 2 % |
| **Fumée de cigarette électronique** | 6 s, trois bouffées décalées | trois disques montent, grossissent et s'effacent |
| **Couvercle de la poubelle** | au survol | se soulève de 16 px en dépassant, puis se pose |

⚠️ **Le coup de pied thaï est abandonné**, et probablement définitivement. C'était
la seule animation qui exigeait des images dessinées en plus du rig, pour deux
dixièmes de seconde qu'on ne voit qu'une fois par visite. Le rapport coût/effet
ne tenait pas. Le rig des jambes reste articulé : il ne coûte rien et servira à
une pose, pas à un mouvement.

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

## L'orchestration

Le défaut d'origine a un nom : la **dérive de phase**. Trois animations en
`infinite` de durées différentes sont trois horloges libres — leur composition ne
se répète qu'au PPCM des périodes, et entre-temps elles produisent des
coïncidences non voulues. C'est ce qui donne la sensation d'écran de veille.

Un jeu 2D ne fait jamais ça : il a des **clips** finis et nommés, des **canaux**
(un clip actif au maximum par canal), et un **ordonnanceur**. La scène reprend
cette structure.

### Le cycle maître

```css
.decor-scene { --cycle: 47s; }
```

Tout ce qui est un **évènement remarquable** partage cette durée. Aucun ne
l'utilise aujourd'hui — le chat sera le premier. Même durée = phase verrouillée = aucune dérive, et la
chorégraphie est exacte sans une ligne de JavaScript. 47 s est premier et plus
long qu'une visite ordinaire : le cycle ne se répète quasiment jamais devant
quelqu'un.

Ce qui est de l'**ambiance** — respiration, vapeur — reste en boucles libres. La
dérive y est un atout : ce sont des textures, pas des évènements, et leur
périodicité ne se remarque pas.

> **Règle : ambiance = boucles libres. Évènement = phase verrouillée.**

### Trois temps, jamais un

Un clip crédible a une **anticipation**, une **action**, un **retour d'équilibre**.
Le couvercle de la poubelle dépasse sa position avant de s'y poser, et c'est ce
dépassement qui donne le poids. Une articulation qui s'arrête pile à sa cible a
l'air d'un servomoteur.

`animation-timing-function` se déclare **dans** un keyframe et s'applique au
segment qui suit — c'est ce qui permet un easing par segment sans découper
l'animation.

### Les canaux

| Canal | Ce qu'il possède |
|---|---|
| `body` | jambes, tibias, pieds, torse |
| `head` | tête |
| `arm` | bras, avant-bras, main |
| `props` | poubelle, chat |
| `fx` | vapeur |

Un clip actif au maximum par canal, sinon deux animations écrivent le même
`transform` et l'une écrase l'autre — l'artefact le plus difficile à
diagnostiquer.

### Ce qui viendra en JavaScript, et ce qui n'en dépendra pas

Un ordonnanceur d'environ un kilo-octet ajoutera la seule chose que le CSS ne
sait pas faire : **l'imprévisibilité**. Intervalles tirés selon une loi
exponentielle — un processus sans mémoire, donc sans cadence audible, là où un
tirage uniforme s'entend encore comme un rythme — et jitter sur la pose et le
tempo.

**Il améliore, il ne porte pas.** Sans lui, la scène retombe sur le cycle maître,
qui est déjà juste. C'est la propriété la plus importante de l'architecture.

## L'interaction

Le décor est en `pointer-events: none`. On rouvre **chirurgicalement**, jamais
globalement : `.prop { pointer-events: auto }`.

Deux pièges :

- un tracé en `fill: none` n'est survolable que sur son trait, à quelques pixels
  près. D'où un rectangle `__hit` en **`fill: transparent`** — `transparent`
  reçoit les évènements, `none` ne les reçoit pas ;
- le décor est `aria-hidden`. Y placer un élément focusable fabriquerait un arrêt
  de tabulation muet. **Rien n'est donc focusable** : le survol est un bonus
  souris, et l'animation périodique montre la même chose à tout le monde. Rien
  n'est perdu, puisque rien de ce que montre le décor n'est une information.

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
