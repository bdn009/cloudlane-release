# Cloudlane release

Production website repository. `dist/` contains the deployable landing page and verified Cloudlane 1.7.0 installer segments. The browser combines the segments into one normal MSI download. There is no framework build or dependency installation.

## Netlify

Import this repository from GitHub. Use branch `main`, leave base directory and build command empty, and set publish directory to `dist`. The included `netlify.toml` already declares that directory. Connect only this release repository to Netlify.

## Update

Make changes in the separate `cloudlane development` repository. From that folder run `python publish-release.py`, review the release diff, then commit and push this repository. The script validates the site and download behavior and verifies every copied file against `release-manifest.json`. It never pushes or deploys automatically.

Only production files, hosting configuration, this guide and a checksum manifest belong here. Do not copy app source, developer tools, account data or publisher JSON into this repository. The installed binary and third-party license/source notices are intentionally included in the downloadable installer.

This folder is prepared locally; no GitHub repository or Netlify deployment has been created. After obtaining the actual site URL, update `og:url` in the development website and publish a new snapshot.
