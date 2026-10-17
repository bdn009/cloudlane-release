# Cloudlane release

Production website repository. `dist/` contains the deployable landing page and verified Cloudlane 1.7.1 production installer segments, built with the separate `cloudlane-production` Google Desktop registration. The browser combines the segments into one normal MSI download. There is no framework build or dependency installation.

## Netlify

Import this repository from GitHub. Use branch `main`, leave base directory and build command empty, and set publish directory to `dist`. The included `netlify.toml` already declares that directory. Connect only this release repository to Netlify.

## Update

Make changes in the separate `cloudlane development` repository. Build a production installer with `python build-production.py`, then run `python publish-release.py`, review the release diff, and commit/push this repository. Do not rebuild an already published version; bump `production.json` first. The publish script requires the verified production installer, validates site/download behavior and verifies every copied file against `release-manifest.json`. The development test installer is not copied into production. Neither script pushes or deploys automatically.

Only production files, hosting configuration, this guide and a checksum manifest belong here. Do not copy app source, developer tools, account data or publisher JSON into this repository. The installed binary and third-party license/source notices are intentionally included in the downloadable installer.

Google public access/verification has not been established by this build. The website's Testing explanation remains applicable until the production Google project's launch configuration is completed. Native production installation/uninstallation and live Google sign-in require user-session validation. After obtaining the actual site URL, set `website_url` in the development repository's `production.json` and publish a new snapshot. GitHub and Netlify setup are separate from this local build.
