const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

// Состояние приложения
const state = {
    user: null,
    isAdmin: false,
    currentVideo: null,
    videos: [],
    currentIndex: 0
};

// Инициализация
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

// Загрузка видео через бота
async function loadVideos() {
    try {
        // Показываем загрузку
        document.getElementById('current-video').style.display = 'none';
        
        // Отправляем запрос боту
        tg.sendData(JSON.stringify({ action: 'get_videos' }));
        
        // Ждём ответ (будет обработан в main_button или через callback)
        tg.showPopup({ message: '📥 Загрузка кружков...' });
        
        // Заглушка пока нет ответа
        setTimeout(() => {
            tg.showPopup({ message: 'Нажмите "Обновить" в чате с ботом' });
        }, 1000);
        
    } catch (e) {
        console.error('Ошибка загрузки:', e);
        tg.showPopup({ message: '❌ Ошибка загрузки' });
    }
}

// Воспроизведение текущего видео
function playCurrentVideo() {
    const video = state.videos[state.currentIndex];
    if (!video) return;
    
    state.currentVideo = video;
    const videoEl = document.getElementById('current-video');
    
    // В Mini App нельзя напрямую использовать file_id
    // Нужно открывать видео через Telegram
    document.getElementById('video-badge').textContent = 
        video.isReply ? '📬 Вам ответили!' : '🎲 Случайный кружок';
    
    videoEl.style.display = 'block';
    
    // Показываем заглушку
    videoEl.poster = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'360\' height=\'640\'%3E%3Crect width=\'360\' height=\'640\' fill=\'%231a1a2e\'/%3E%3Ctext x=\'180\' y=\'320\' fill=\'white\' text-anchor=\'middle\'%3E🎥 Кружок #' + video.id + '%3C/text%3E%3C/svg%3E';
}

// Действия с видео
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

// Профиль
async function loadProfile() {
    document.getElementById('stat-sent').textContent = '—';
    document.getElementById('stat-likes').textContent = '—';
    document.getElementById('stat-mutual').textContent = '—';
}

// Админ действия
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

// Обработчики событий
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

// Запуск
init();
