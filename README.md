# Cloudlane release

Production website and Cloudlane 1.7.3 distribution. The Windows app uses each user's own Google Desktop OAuth JSON; no publisher registration is bundled. The website includes the complete MIT-licensed app source as an audited download, setup instructions, privacy and terms.

## Netlify

Connect this private repository's main branch, leave base directory and build command empty, and publish dist. netlify.toml already declares it. The website and files in dist are public, including the intended source ZIP; repository privacy does not make deployed downloads private.

## Contents

- dist/: static website and assets.
- dist/downloads/release.json and .part files: exact installer size/hash and segments; the browser verifies and saves one normal MSI.
- dist/downloads/source.zip and source-info.json: complete matching source, version, size and SHA-256.
- dist/setup.html: own Google project/client setup and source/build instructions.
- release-manifest.json: SHA-256 inventory of every deployed file.

Only curated production files belong here. Do not copy account data, SDKs, loose development source or publisher credentials into this repo. Required third-party source/notices are intentionally included in the installer and complete source ZIP. Historical private commits may include older installers with publisher Desktop registrations; do not make history public without an audit.

## Updates and validation

Work in ../cloudlane development. Bump production.json, run python build-production.py, then python publish-release.py. Review and commit/push this release snapshot. Neither script pushes or deploys automatically.

1.7.3 passed 358 app checks, 22 installer checks, native registry OS detection including eight compatibility scenarios, full installer download integrity and downloader failure/retry/cancel checks. Source inventory and checksums passed. The preceding 1.7.2 source ZIP also rebuilt from a clean extraction without warnings/errors. Native install/uninstall and live Google authorization still need normal-user verification; DPAPI and device-namespace probes were explicitly skipped in the restricted build profile. Windows 11 24H2+ x64 remains required; this build is unsigned.

The 1.7.3 update names the app, Start menu folder and shortcuts Cloudlane. The existing installation directory and upgrade family are retained to preserve installed account data and update compatibility.
