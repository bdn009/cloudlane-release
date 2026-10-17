const menu = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav-links');
function closeMenu() { nav.classList.remove('is-open'); menu.setAttribute('aria-expanded', 'false'); menu.setAttribute('aria-label', 'Open navigation'); }
menu.addEventListener('click', () => {
  const opened = nav.classList.toggle('is-open');
  menu.setAttribute('aria-expanded', String(opened));
  menu.setAttribute('aria-label', opened ? 'Close navigation' : 'Open navigation');
});
nav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });

const folderNames = {
  everyday: ['Photos', 'Videos', 'Documents', 'Weekend away.jpg', 'A moment outside.mp4', 'Good ideas.pdf'],
  creative: ['Inspiration', 'Projects', 'Exports', 'A fresh perspective.jpg', 'First cut.mp4', 'The next chapter.pdf']
};
const tabs = [...document.querySelectorAll('[data-folder]')];
function selectFolder(tab) {
  tabs.forEach(item => { item.setAttribute('aria-selected', String(item === tab)); item.tabIndex = item === tab ? 0 : -1; });
  const panel = document.querySelector('#folder-preview');
  panel.setAttribute('aria-labelledby', tab.id);
  panel.querySelectorAll(':scope > div > span').forEach((span, index) => { span.textContent = folderNames[tab.dataset.folder][index]; });
}
tabs.forEach(tab => {
  tab.addEventListener('click', () => selectFolder(tab));
  tab.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    let index = tabs.indexOf(tab);
    if (event.key === 'Home') index = 0;
    else if (event.key === 'End') index = tabs.length - 1;
    else index = (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    selectFolder(tabs[index]); tabs[index].focus();
  });
});

document.querySelectorAll('[data-dialog]').forEach(button => button.addEventListener('click', () => document.getElementById(button.dataset.dialog + '-dialog').showModal()));
document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const rect = dialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
}));

const downloadDialog = document.getElementById('download-dialog');
const downloadTitle = document.getElementById('download-title');
const downloadDescription = document.getElementById('download-description');
const downloadProgress = document.getElementById('download-progress');
const downloadState = document.getElementById('download-state');
const downloadAction = document.getElementById('download-cancel');
let downloadController = null;
let downloadBusy = false;
let retryDownload = false;
let releasePromise;
function validateRelease(release) {
  const invalid = () => new Error('The installer manifest is invalid. Please try again later.');
  if (!release || typeof release !== 'object' || !/^\d+\.\d+\.\d+$/.test(release.version) ||
      release.filename !== `Cloudlane-${release.version}-Setup.msi` ||
      !/^[a-f0-9]{64}$/.test(release.sha256) || !Number.isSafeInteger(release.bytes) ||
      release.bytes <= 0 || release.bytes > 150 * 1024 * 1024 ||
      !Array.isArray(release.parts) || release.parts.length === 0 || release.parts.length > 100) throw invalid();
  let total = 0;
  release.parts.forEach((part, index) => {
    const expectedFile = `cloudlane-${release.version}.${String(index + 1).padStart(2, '0')}.part`;
    if (!part || part.file !== expectedFile || !Number.isSafeInteger(part.bytes) ||
        part.bytes <= 0 || part.bytes > 20 * 1024 * 1024) throw invalid();
    total += part.bytes;
  });
  if (total !== release.bytes) throw invalid();
  return release;
}
async function getRelease() {
  if (!releasePromise) releasePromise = fetch('downloads/release.json', { cache: 'no-cache' }).then(response => {
    if (!response.ok) throw new Error('The installer is temporarily unavailable. Please try again.');
    return response.json();
  }).then(validateRelease).catch(error => { releasePromise = null; throw error; });
  return releasePromise;
}
getRelease().then(release => {
  document.querySelectorAll('[data-size]').forEach(label => { label.textContent = Math.round(release.bytes / 1024 / 1024) + ' MB'; });
  document.querySelectorAll('[data-version]').forEach(label => { label.textContent = 'v' + release.version; });
}).catch(() => { /* Download button reports availability if selected. */ });

async function downloadInstaller() {
  if (!downloadDialog.open) downloadDialog.showModal();
  if (downloadBusy) return;
  retryDownload = false; downloadBusy = true;
  downloadController = new AbortController();
  const signal = downloadController.signal;
  downloadDialog.classList.remove('download-success');
  downloadTitle.textContent = 'Getting things ready.';
  downloadDescription.textContent = 'Preparing your Windows installer. Your download will start when it’s ready.';
  downloadAction.textContent = 'Cancel download';
  downloadProgress.value = 0; downloadState.textContent = 'Connecting…';
  try {
    const release = await getRelease();
    if (signal.aborted) throw new DOMException('Cancelled', 'AbortError');
    const segments = [];
    let received = 0;
    downloadTitle.textContent = 'A familiar place awaits.';
    for (const part of release.parts) {
      const response = await fetch('downloads/' + part.file, { signal });
      if (!response.ok || !response.body) throw new Error('The download was interrupted. Please try again.');
      const reader = response.body.getReader(); let partReceived = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        segments.push(value); received += value.byteLength; partReceived += value.byteLength;
        if (received > release.bytes || partReceived > part.bytes) { await reader.cancel(); throw new Error('The download size didn’t match. Please try again.'); }
        const percent = Math.min(97, Math.round(received / release.bytes * 97));
        downloadProgress.value = percent;
        downloadState.textContent = (received / 1024 / 1024).toFixed(1) + ' / ' + (release.bytes / 1024 / 1024).toFixed(1) + ' MB';
      }
      if (partReceived !== part.bytes) throw new Error('The download was incomplete. Please try again.');
    }
    if (received !== release.bytes) throw new Error('The download was incomplete. Please try again.');
    downloadState.textContent = 'Verifying installer…';
    const data = new Uint8Array(received); let offset = 0;
    for (const segment of segments) { data.set(segment, offset); offset += segment.byteLength; }
    const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', data))].map(value => value.toString(16).padStart(2, '0')).join('');
    if (hash !== release.sha256) throw new Error('The installer didn’t pass its integrity check. Please try again.');
    if (signal.aborted) throw new DOMException('Cancelled', 'AbortError');
    const url = URL.createObjectURL(new Blob([data], { type: 'application/octet-stream' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = release.filename;
    document.body.append(anchor); anchor.click(); anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 120000);
    downloadProgress.value = 100; downloadState.textContent = 'Installer verified · Ready';
    downloadTitle.textContent = 'Make yourself at home.';
    downloadDescription.textContent = `Your browser has received ${release.filename}. Open it from Downloads, finish setup, then sign in with Google.`;
    downloadDialog.classList.add('download-success'); downloadAction.textContent = 'Got it';
  } catch (error) {
    if (error.name !== 'AbortError') {
      downloadTitle.textContent = 'Let’s try that again.';
      downloadDescription.textContent = error.message || 'The installer couldn’t be downloaded. Check your connection and try again.';
      downloadState.textContent = 'Download not completed'; downloadAction.textContent = 'Try download again'; retryDownload = true;
    }
  } finally { downloadBusy = false; downloadController = null; }
}
document.querySelectorAll('[data-download]').forEach(button => button.addEventListener('click', downloadInstaller));
downloadAction.addEventListener('click', () => { if (retryDownload) downloadInstaller(); else downloadDialog.close(); });
downloadDialog.addEventListener('close', () => { downloadController?.abort(); });
