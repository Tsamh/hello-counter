const { withAppBuildGradle } = require('expo/config-plugins');

/**
 * Injecte une configuration de signature "release" dans le build.gradle
 * genere par expo prebuild.
 *
 * La configuration est conditionnee a la presence de la propriete Gradle
 * MYAPP_RELEASE_STORE_FILE. Sans elle, la compilation retombe sur la cle de
 * debug, ce qui permet de compiler en local sans detenir les secrets.
 */

const SIGNING_CONFIG = `
        release {
            if (project.hasProperty('MYAPP_RELEASE_STORE_FILE')) {
                storeFile file(MYAPP_RELEASE_STORE_FILE)
                storePassword MYAPP_RELEASE_STORE_PASSWORD
                keyAlias MYAPP_RELEASE_KEY_ALIAS
                keyPassword MYAPP_RELEASE_KEY_PASSWORD
            }
        }`;

const SIGNING_CHOICE =
  "signingConfig project.hasProperty('MYAPP_RELEASE_STORE_FILE') ? signingConfigs.release : signingConfigs.debug";

const DEBUG_SIGNING_LINE = 'signingConfig signingConfigs.debug';

function withReleaseSigning(config) {
  return withAppBuildGradle(config, (gradleConfig) => {
    let contents = gradleConfig.modResults.contents;

    const anchor = 'signingConfigs {';
    const anchorIndex = contents.indexOf(anchor);
    if (anchorIndex === -1) {
      throw new Error(
        'with-release-signing : bloc signingConfigs introuvable dans app/build.gradle'
      );
    }
    const insertAt = anchorIndex + anchor.length;
    contents = contents.slice(0, insertAt) + SIGNING_CONFIG + contents.slice(insertAt);

    // Le buildType debug reference la cle de debug avant le buildType release.
    // La derniere occurrence est donc celle du buildType release.
    const targetIndex = contents.lastIndexOf(DEBUG_SIGNING_LINE);
    if (targetIndex === -1) {
      throw new Error(
        'with-release-signing : ligne signingConfig du buildType release introuvable'
      );
    }
    contents =
      contents.slice(0, targetIndex) +
      SIGNING_CHOICE +
      contents.slice(targetIndex + DEBUG_SIGNING_LINE.length);

    gradleConfig.modResults.contents = contents;
    return gradleConfig;
  });
}

module.exports = withReleaseSigning;
