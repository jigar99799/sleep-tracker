let installPrompt = null;

window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    installPrompt = event;
    document.getElementById('btnInstall').classList.remove('hidden');
});

window.addEventListener('appinstalled', () => {
    installPrompt = null;
    document.getElementById('btnInstall').classList.add('hidden');
});

async function installApp() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    installPrompt = null;
    document.getElementById('btnInstall').classList.add('hidden');
}

if ('serviceWorker' in navigator && window.isSecureContext && location.protocol !== 'file:') {
    window.addEventListener('load', async () => {
        const status = document.getElementById('offlineStatus');
        try {
            await navigator.serviceWorker.register('./sw.js', { scope: './' });
            await navigator.serviceWorker.ready;
            const updateStatus = () => {
                status.innerText = navigator.onLine
                    ? 'Offline ready · Saved on this device · No subscriptions'
                    : 'Offline · Saved on this device · Motion coverage may be interrupted';
            };
            updateStatus();
            window.addEventListener('online', updateStatus);
            window.addEventListener('offline', updateStatus);
        } catch (error) {
            status.innerText = 'Offline setup unavailable. Keep an exported backup of your data.';
        }
    });
}