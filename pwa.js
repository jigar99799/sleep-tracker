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

async function shareApp() {
    const statuses = ['shareStatus', 'guideShareStatus'].map(id => document.getElementById(id)).filter(Boolean);
    const url = document.querySelector('link[rel="canonical"]').href;
    const shareData = { title: 'Rest & Rise', text: 'A private, free sleep diary with habits and a focus timer.', url };
    statuses.forEach(status => status.classList.add('hidden'));
    if (navigator.share) {
        try {
            await navigator.share(shareData);
            return;
        } catch (error) {
            if (error.name === 'AbortError') return;
        }
    }
    let message;
    try {
        if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable.');
        await navigator.clipboard.writeText(url);
        message = 'App link copied. Your diary data is not shared.';
    } catch (error) {
        message = `Share this app link: ${url}`;
    }
    statuses.forEach(status => {
        status.innerText = message;
        status.classList.remove('hidden');
    });
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
                    : 'Offline · Saved on this device · No subscriptions';
            };
            updateStatus();
            window.addEventListener('online', updateStatus);
            window.addEventListener('offline', updateStatus);
        } catch (error) {
            status.innerText = 'Offline setup unavailable. Keep an exported backup of your data.';
        }
    });
}

async function requestMorningNotificationPermission() {
    if (!window.isSecureContext || !('Notification' in window) || !('serviceWorker' in navigator)) {
        return { allowed: false, message: 'System notifications unsupported here. In-app check-ins remain available.' };
    }
    const permission = Notification.permission === 'default' ? await Notification.requestPermission() : Notification.permission;
    if (permission !== 'granted') return { allowed: false, message: 'Notifications not allowed. In-app check-ins remain available; permissions can be changed in browser settings.' };
    return { allowed: true, message: '' };
}

async function showMorningNotification(body) {
    if (!('Notification' in window) || Notification.permission !== 'granted' || !('serviceWorker' in navigator)) return false;
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration?.active) throw new Error('Offline app not ready.');
    await registration.showNotification('Rest & Rise check-in', {
        body,
        tag: 'sleep-morning-checkin',
        icon: './assets/icon-192.png',
        badge: './assets/icon-192.png',
        data: { url: new URL('./sleep-tracker.html', location.href).href }
    });
    return true;
}

async function closeMorningNotifications() {
    if (!('serviceWorker' in navigator)) return;
    try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (!registration) return;
        for (const notification of await registration.getNotifications({ tag: 'sleep-morning-checkin' })) notification.close();
    } catch (error) {
        return;
    }
}