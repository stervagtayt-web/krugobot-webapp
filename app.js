const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

const state = {
    user: null,
    isAdmin: false,
    currentVideo: null,
    videos: [],
    currentIndex: 0
};

async function init() {
    try {
        const initData = tg.initDataUnsafe || {};
        state.user = initData.user || { id: 'unknown', first_name: 'Гость' };
        
        const ADMIN_IDS = [1207482858, 577985223];
        state.isAdmin = ADMIN_IDS.includes(state.user.id);

        if (state.isAdmin) {
            document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'block');
        }

        document.getElementById('user-greeting').textContent = `Привет, ${state.user.first_name}!`;
        applyTheme();
        showScreen('main');
    } catch (e) {
        console.error('Init error:', e);
        showScreen('main');
    }
}

function applyTheme() {
    document.body.style.backgroundColor = tg.themeParams.bg_color || '#1a1a2e';
    document.body.style.color = tg.themeParams.text_color || '#ffffff';
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(`${screenId}-screen`).classList.add('active');
    
    if (screenId === 'watch') loadVideos();
    if (screenId === 'profile') loadProfile();
}

async function loadVideos() {
    try {
        tg.showPopup({ message: '📥 Запрос кружков...\nПроверьте чат с ботом!' });
        tg.sendData(JSON.stringify({ action: 'get_videos' }));
    } catch (e) {
        console.error('Ошибка загрузки:', e);
        tg.showPopup({ message: '❌ Ошибка загрузки' });
    }
}

function playCurrentVideo() {
    const video = state.videos[state.currentIndex];
    if (!video) return;
    
    state.currentVideo = video;
    const videoEl = document.getElementById('current-video');
    
    videoEl.src = video.url;
    videoEl.style.display = 'block';
    videoEl.play().catch(e => console.log('Автовоспроизведение заблокировано'));
    
    document.getElementById('video-badge').textContent = 
        video.isReply ? '📬 Вам ответили!' : '🎲 Случайный кружок';
}

async function handleVideoAction(action) {
    if (!state.currentVideo) {
        tg.showPopup({ message: '❌ Нет активного видео' });
        return;
    }
    
    const videoId = state.currentVideo.id;
    
    switch(action) {
        case 'like':
            tg.sendData(JSON.stringify({ action: 'like', video_id: videoId }));
            tg.showPopup({ title: '❤️', message: 'Лайк отправлен!' });
            break;
            
        case 'reply':
            tg.sendData(JSON.stringify({ action: 'reply', video_id: videoId }));
            tg.showPopup({ message: '🎥 Отправьте кружок в боте для ответа' });
            break;
            
        case 'next':
            tg.sendData(JSON.stringify({ action: 'next', video_id: videoId }));
            state.currentIndex++;
            if (state.currentIndex < state.videos.length) {
                playCurrentVideo();
            } else {
                tg.showPopup({ message: '📭 Кружки закончились' });
                showScreen('main');
            }
            break;
            
        case 'report':
            tg.sendData(JSON.stringify({ action: 'report', video_id: videoId }));
            tg.showPopup({ title: '🚨', message: 'Жалоба отправлена' });
            state.currentIndex++;
            if (state.currentIndex < state.videos.length) {
                playCurrentVideo();
            } else {
                showScreen('main');
            }
            break;
    }
}

function loadProfile() {
    document.getElementById('stat-sent').textContent = '—';
    document.getElementById('stat-likes').textContent = '—';
    document.getElementById('stat-mutual').textContent = '—';
}

async function handleAdminAction(action) {
    const resultDiv = document.getElementById('admin-result');
    
    switch(action) {
        case 'stats':
            tg.sendData(JSON.stringify({ action: 'admin_stats' }));
            resultDiv.textContent = '📊 Запрос отправлен в бот';
            break;
            
        case 'ban':
            const banId = prompt('Введите ID пользователя:');
            if (banId) {
                tg.sendData(JSON.stringify({ action: 'admin_ban', user_id: parseInt(banId) }));
                resultDiv.textContent = `🚫 Бан ${banId}`;
            }
            break;
            
        case 'unban':
            const unbanId = prompt('Введите ID пользователя:');
            if (unbanId) {
                tg.sendData(JSON.stringify({ action: 'admin_unban', user_id: parseInt(unbanId) }));
                resultDiv.textContent = `✅ Разбан ${unbanId}`;
            }
            break;
            
        case 'broadcast':
            const msg = prompt('Текст рассылки:');
            if (msg) {
                tg.sendData(JSON.stringify({ action: 'admin_broadcast', text: msg }));
                resultDiv.textContent = '📢 Рассылка запущена';
            }
            break;
    }
}

// Функция для ручной загрузки видео (вызови из консоли)
window.loadVideosFromJSON = function(jsonData) {
    try {
        const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
        state.videos = data.videos || [];
        state.currentIndex = 0;
        if (state.videos.length > 0) {
            playCurrentVideo();
            tg.showPopup({ message: `✅ Загружено ${state.videos.length} кружков!` });
        } else {
            tg.showPopup({ message: '📭 Нет кружков' });
        }
    } catch (e) {
        console.error('Ошибка парсинга:', e);
        tg.showPopup({ message: '❌ Ошибка данных' });
    }
};

document.addEventListener('click', e => {
    if (e.target.dataset.screen) {
        showScreen(e.target.dataset.screen);
    }
    
    if (e.target.dataset.action) {
        const action = e.target.dataset.action;
        if (action === 'watch') showScreen('watch');
        if (action === 'profile') showScreen('profile');
        if (action === 'rules') showScreen('rules');
        if (action === 'admin') showScreen('admin');
        if (action === 'support') tg.openTelegramLink('https://t.me/krugobot_news?direct');
        if (action === 'my-videos') {
            tg.sendData(JSON.stringify({ action: 'my_videos' }));
            tg.showPopup({ message: '📋 Список в чате с ботом' });
        }
    }
    
    if (e.target.dataset.videoAction) {
        handleVideoAction(e.target.dataset.videoAction);
    }
    
    if (e.target.dataset.adminAction) {
        handleAdminAction(e.target.dataset.adminAction);
    }
});

init();
