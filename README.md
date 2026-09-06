# Hello Counter

Application Android construite avec Expo et React Native, publiée automatiquement à chaque `git push`.

L'application elle même est volontairement minimale : un titre, un compteur, trois boutons. Le sujet du projet n'est pas l'application, c'est la **chaîne de développement complète** qui la porte, du code source jusqu'à l'installation sur un téléphone.

## Ce que fait la chaîne

Un `git push` sur `main` déclenche un enchaînement entièrement automatique :

```
   PC                              GITHUB                      TELEPHONE
+----------+                  +---------------+              +--------------+
|  code    |  expo start      |               |              |   Expo Go    |
|  .tsx    | -------------------- wifi ------------------->  | apercu live  |
|          |                  |               |              +--------------+
|          |  git push        |  Actions      |
|          | ---------------> |  types        |
+----------+                  |  tests        |
                              |  prebuild     |
                              |  gradle       |              +--------------+
                              |  signature    |              |  app.apk     |
                              |  Release  ------------------>|  installee   |
                              +---------------+ telechargt   +--------------+
```

Vérification des types, tests unitaires, génération du projet Android natif, compilation Gradle, signature avec une clé de release, contrôle du certificat obtenu, puis publication d'une GitHub Release contenant l'APK.

Si les types ou les tests échouent, la chaîne s'arrête et **aucun APK n'est publié**. Ce comportement a été vérifié en cassant volontairement un test.

## Stack

| | |
|---|---|
| Application | Expo SDK 57, React Native, TypeScript strict |
| Tests | Jest via le préréglage `jest-expo` |
| Compilation | Gradle sur GitHub Actions, runner `ubuntu-latest` |
| Distribution | GitHub Releases |

## Développer

```bash
npm install
npm start
```

Scanner le QR code affiché avec l'application Expo Go, sur un téléphone connecté au même wifi que le PC. Le code se recharge tout seul à chaque sauvegarde.

Si le téléphone ne parvient pas à joindre le PC, le réseau isole probablement les appareils entre eux :

```bash
npx expo start --tunnel
```

## Vérifier

```bash
npm run typecheck
npm test
```

Ces deux commandes tournent aussi en intégration continue, avant toute compilation.

## Structure

```
App.tsx                        point d'entree
src/
  counter.ts                   logique pure, sans React
  counter.test.ts              tests unitaires
  CounterScreen.tsx            ecran
plugins/
  with-release-signing.js      injecte la signature release dans le build Gradle
scripts/
  set-version-code.mjs         numero de build tire du compteur GitHub Actions
.github/workflows/build.yml    la chaine
```

La logique du compteur est isolée dans un module sans dépendance à React. Ce n'est pas de la sur ingénierie sur trois boutons : c'est ce qui rend l'étape de test de la chaîne réelle plutôt que décorative, puisqu'elle s'exécute en quelques millisecondes sans environnement de rendu.

Le dossier `android/` n'est pas versionné. Il est régénéré par `expo prebuild` à chaque compilation, à partir de `app.json`.

## Installer sur un téléphone

Le dépôt est privé, les fichiers des Releases ne sont donc pas téléchargeables sans être connecté à GitHub.

1. se connecter à GitHub depuis le navigateur du téléphone
2. ouvrir la dernière Release du dépôt
3. télécharger le fichier `.apk`
4. autoriser l'installation depuis cette source quand Android le demande
5. installer

Depuis le PC, en solution de repli : `gh release download --pattern "*.apk"`, puis transfert par câble.

## Signature

L'APK est signé avec une clé de release personnelle, absente du dépôt. Quatre secrets GitHub la portent : `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`.

Le workflow encadre la signature de deux contrôles : il refuse de compiler si un secret manque, et il relit le certificat de l'APK produit pour vérifier qu'il ne s'agit pas de la clé de debug. Sans eux, une erreur de configuration produirait un APK d'apparence normale mais impossible à mettre à jour ensuite.

Le fichier de clé doit être sauvegardé hors du dépôt. Sa perte rendrait impossible toute mise à jour de l'application déjà installée.
