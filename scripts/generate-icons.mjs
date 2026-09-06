import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

/**
 * Genere les icones de l application, sans aucune dependance externe.
 *
 * Le motif est un plus et un moins, en rapport avec le compteur. Tout est
 * dessine par programme, donc net a n importe quelle taille et modifiable
 * en changant les constantes ci dessous.
 *
 * Usage : node scripts/generate-icons.mjs
 */

// Palette. Le bleu reprend celui de la valeur du compteur dans l ecran.
const FOND = [37, 99, 235]; // #2563eb
const MOTIF = [255, 255, 255]; // blanc

// Geometrie, exprimee en fraction de la taille de l image, pour rester
// identique quelle que soit la resolution demandee.
//
// Contrainte Android : sur une icone adaptative, seul un disque central
// d environ 66 pour cent de la largeur est garanti visible, le reste peut
// etre rogne par le masque du lanceur. Le motif tient dans un rayon de
// 158 sur 512, soit largement a l interieur des 170 autorises.
const G = {
  epaisseur: 50 / 512,
  brasDemiLongueur: 78 / 512,
  plusDecalageY: -56 / 512,
  moinsDecalageY: 112 / 512,
  moinsDemiEpaisseur: 25 / 512,
  rayonCoins: 12 / 512,
};

const SUR_ECHANTILLONNAGE = 4;

function dansRectangleArrondi(x, y, cx, cy, demiL, demiH, r) {
  const dx = Math.abs(x - cx);
  const dy = Math.abs(y - cy);
  if (dx > demiL || dy > demiH) return false;
  const rayon = Math.min(r, demiL, demiH);
  const ix = dx - (demiL - rayon);
  const iy = dy - (demiH - rayon);
  if (ix <= 0 || iy <= 0) return true;
  return ix * ix + iy * iy <= rayon * rayon;
}

function dansMotif(x, y, taille) {
  const c = taille / 2;
  const e = G.epaisseur * taille;
  const bras = G.brasDemiLongueur * taille;
  const r = G.rayonCoins * taille;
  const plusY = c + G.plusDecalageY * taille;
  const moinsY = c + G.moinsDecalageY * taille;

  // Barre horizontale du plus
  if (dansRectangleArrondi(x, y, c, plusY, bras, e / 2, r)) return true;
  // Barre verticale du plus
  if (dansRectangleArrondi(x, y, c, plusY, e / 2, bras, r)) return true;
  // Le moins
  if (dansRectangleArrondi(x, y, c, moinsY, bras, G.moinsDemiEpaisseur * taille, r)) {
    return true;
  }
  return false;
}

/**
 * Dessine une image RGBA.
 * @param {number} taille cote de l image en pixels
 * @param {object} options
 * @param {number[] | null} options.fond couleur de fond, ou null pour transparent
 * @param {number[] | null} options.motif couleur du motif, ou null pour ne pas le dessiner
 */
function dessiner(taille, { fond, motif }) {
  const pixels = Buffer.alloc(taille * taille * 4);
  const pas = 1 / SUR_ECHANTILLONNAGE;
  const echantillons = SUR_ECHANTILLONNAGE * SUR_ECHANTILLONNAGE;

  for (let y = 0; y < taille; y += 1) {
    for (let x = 0; x < taille; x += 1) {
      let couverture = 0;

      if (motif) {
        // Sur echantillonnage : on teste plusieurs points par pixel pour
        // obtenir des bords lisses plutot qu en escalier.
        for (let sy = 0; sy < SUR_ECHANTILLONNAGE; sy += 1) {
          for (let sx = 0; sx < SUR_ECHANTILLONNAGE; sx += 1) {
            const px = x + (sx + 0.5) * pas;
            const py = y + (sy + 0.5) * pas;
            if (dansMotif(px, py, taille)) couverture += 1;
          }
        }
        couverture /= echantillons;
      }

      const i = (y * taille + x) * 4;

      if (fond) {
        // Motif compose sur le fond opaque. Sans motif, on pose l aplat seul.
        for (let k = 0; k < 3; k += 1) {
          pixels[i + k] = motif
            ? Math.round(fond[k] + (motif[k] - fond[k]) * couverture)
            : fond[k];
        }
        pixels[i + 3] = 255;
      } else {
        // Fond transparent : la couverture devient l alpha.
        for (let k = 0; k < 3; k += 1) pixels[i + k] = motif[k];
        pixels[i + 3] = Math.round(couverture * 255);
      }
    }
  }

  return pixels;
}

function tableCrc() {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  return table;
}

const CRC = tableCrc();

function crc32(buffer) {
  let crc = -1;
  for (let i = 0; i < buffer.length; i += 1) {
    crc = (crc >>> 8) ^ CRC[(crc ^ buffer[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

function bloc(type, donnees) {
  const longueur = Buffer.alloc(4);
  longueur.writeUInt32BE(donnees.length, 0);
  const corps = Buffer.concat([Buffer.from(type, 'ascii'), donnees]);
  const controle = Buffer.alloc(4);
  controle.writeUInt32BE(crc32(corps), 0);
  return Buffer.concat([longueur, corps, controle]);
}

/**
 * Ecrit un PNG RGBA 8 bits. Le format est assez simple pour se passer
 * d une bibliotheque : signature, entete, donnees compressees, fin.
 */
function ecrirePng(chemin, taille, pixels) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const entete = Buffer.alloc(13);
  entete.writeUInt32BE(taille, 0);
  entete.writeUInt32BE(taille, 4);
  entete[8] = 8; // 8 bits par canal
  entete[9] = 6; // RGBA
  entete[10] = 0; // compression standard
  entete[11] = 0; // filtrage standard
  entete[12] = 0; // pas d entrelacement

  // Chaque ligne est prefixee d un octet de filtre, ici 0 pour aucun filtre.
  const largeurLigne = taille * 4;
  const brut = Buffer.alloc((largeurLigne + 1) * taille);
  for (let y = 0; y < taille; y += 1) {
    brut[y * (largeurLigne + 1)] = 0;
    pixels.copy(brut, y * (largeurLigne + 1) + 1, y * largeurLigne, (y + 1) * largeurLigne);
  }

  const contenu = Buffer.concat([
    signature,
    bloc('IHDR', entete),
    bloc('IDAT', deflateSync(brut, { level: 9 })),
    bloc('IEND', Buffer.alloc(0)),
  ]);

  writeFileSync(chemin, contenu);
  return contenu.length;
}

const assets = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets');

const aProduire = [
  // Icone generique et iOS : carree, fond plein, aucun masque applique.
  { fichier: 'icon.png', taille: 1024, fond: FOND, motif: MOTIF },
  // Couche avant de l icone adaptative Android : motif seul sur transparent.
  { fichier: 'android-icon-foreground.png', taille: 512, fond: null, motif: MOTIF },
  // Couche arriere : aplat de couleur, sans motif.
  { fichier: 'android-icon-background.png', taille: 512, fond: FOND, motif: null },
  // Couche monochrome des themes Android 13 et suivants : Android la recolore
  // lui meme, seule la transparence compte.
  { fichier: 'android-icon-monochrome.png', taille: 432, fond: null, motif: MOTIF },
  // Ecran de demarrage.
  { fichier: 'splash-icon.png', taille: 1024, fond: null, motif: MOTIF },
  // Onglet du navigateur pour la cible web.
  { fichier: 'favicon.png', taille: 48, fond: FOND, motif: MOTIF },
];

for (const { fichier, taille, fond, motif } of aProduire) {
  const pixels = dessiner(taille, { fond, motif });
  const octets = ecrirePng(join(assets, fichier), taille, pixels);
  console.log(`${fichier.padEnd(32)} ${taille} x ${taille}   ${octets} octets`);
}

console.log('\nIcones regenerees. Les couleurs se changent en haut de ce fichier.');
