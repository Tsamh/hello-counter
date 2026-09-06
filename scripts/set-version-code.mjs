import { readFileSync, writeFileSync } from 'node:fs';

/**
 * Ecrit le numero de build Android dans app.json.
 *
 * Le versionCode doit strictement augmenter d'une version a l'autre, sinon
 * Android refuse d'installer la mise a jour par dessus l'ancienne. On le tire
 * du compteur d'executions GitHub Actions plutot que de le gerer a la main.
 */

const raw = process.env.VERSION_CODE;
const versionCode = Number(raw);

if (!Number.isInteger(versionCode) || versionCode < 1) {
  throw new Error(`VERSION_CODE invalide : ${JSON.stringify(raw)}`);
}

const configPath = new URL('../app.json', import.meta.url);
const config = JSON.parse(readFileSync(configPath, 'utf8'));

config.expo.android = { ...config.expo.android, versionCode };

writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);

console.log(`versionCode fixe a ${versionCode}`);
