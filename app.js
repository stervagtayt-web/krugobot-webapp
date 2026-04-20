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
        // Получаем данные пользователя из Telegram
        const initData = tg.initDataUnsafe || {};
        state.user = initData.user || { id: 'unknown', first_name: 'Гость' };
        
        // Проверяем админа (ID должны быть в ADMIN_IDS бота)
        const ADMIN_IDS = [1207482858, 577985223];
        state.isAdmin = ADMIN_IDS.includes(state.user.id);

        // Показываем админ-кнопку если надо
        if (state.isAdmin) {
            document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'block');
        }

        // Приветствие
        document.getElementById('user-greeting').textContent = 
            `Привет, ${state.user.first_name}!`;

        // Применяем тему
        applyTheme();

        // Переключаем на главный экран
        showScreen('main');
    } catch (e) {
        console.error('Init error:', e);
        showScreen('main');
    }
}

// Тема Telegram
function applyTheme() {
    const theme = {
        bg: tg.themeParams.bg_color || '#1a1a2e',
        text: tg.themeParams.text_color || '#ffffff',
        hint: tg.themeParams.hint_color || '#888',
        button: tg.themeParams.button_color || '#4a90e2',
        buttonText: tg.themeParams.button_text_color || '#ffffff',
        secondaryBg: tg.themeParams.secondary_bg_color || '#2a2a4a'
    };
    
    document.body.style.backgroundColor = theme.bg;
    document.body.style.color = theme.text;
}

// Навигация между экранами
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(`${screenId}-screen`).classList.add('active');
    
    // Специальные действия при открытии экрана
    if (screenId === 'watch') loadVideos();
    if (screenId === 'profile') loadProfile();
}

// Загрузка видео (заглушка — замени на реальный API)
async function loadVideos() {
    // Здесь должен быть запрос к твоему API или команда боту
    // Пока моковые данные
    state.videos = [
        { id: 1, url: 'https://example.com/video1.mp4', isReply: false },
        { id: 2, url: 'https://example.com/video2.mp4', isReply: true }
    ];
    state.currentIndex = 0;
    playCurrentVideo();
}

function playCurrentVideo() {
    const video = state.videos[state.currentIndex];
    if (!video) return;
    
    state.currentVideo = video;
    const videoEl = document.getElementById('current-video');
    videoEl.src = video.url;
    videoEl.play();
    
    document.getElementById('video-badge').textContent = 
        video.isReply ? '📬 Вам ответили!' : '🎲 Случайный кружок';
}

// Действия с видео
async function handleVideoAction(action) {
    if (!state.currentVideo) return;
    
    const videoId = state.currentVideo.id;
    
    switch(action) {
        case 'like':
            tg.sendData(JSON.stringify({ action: 'like', video_id: videoId }));
            tg.showPopup({ title: '❤️', message: 'Лайк отправлен!' });
            break;
        case 'reply':
            tg.sendData(JSON.stringify({ action: 'reply', video_id: videoId }));
            tg.openTelegramLink(`https://t.me/${tg.initDataUnsafe.user?.username || ''}`);
            break;
        case 'next':
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
            playCurrentVideo();
            break;
    }
}

// Профиль
async function loadProfile() {
    // Заглушка — замени на реальные данные
    document.getElementById('stat-sent').textContent = '12';
    document.getElementById('stat-likes').textContent = '34';
    document.getElementById('stat-mutual').textContent = '5';
}

// Админ действия
async function handleAdminAction(action) {
    const resultDiv = document.getElementById('admin-result');
    
    switch(action) {
        case 'stats':
            tg.sendData(JSON.stringify({ action: 'admin_stats' }));
            resultDiv.textContent = 'Запрос отправлен...';
            break;
        case 'ban':
            const banId = prompt('Введите ID пользователя:');
            if (banId) {
                tg.sendData(JSON.stringify({ action: 'admin_ban', user_id: banId }));
                resultDiv.textContent = `Бан ${banId}`;
            }
            break;
        case 'broadcast':
            const msg = prompt('Текст рассылки:');
            if (msg) {
                tg.sendData(JSON.stringify({ action: 'admin_broadcast', text: msg }));
                resultDiv.textContent = 'Рассылка запущена';
            }
            break;
    }
}

// Обработчики событий
document.addEventListener('click', e => {
    // Навигация
    if (e.target.dataset.screen) {
        showScreen(e.target.dataset.screen);
    }
    
    // Главное меню
    if (e.target.dataset.action) {
        const action = e.target.dataset.action;
        if (action === 'watch') showScreen('watch');
        if (action === 'profile') showScreen('profile');
        if (action === 'rules') showScreen('rules');
        if (action === 'admin') showScreen('admin');
        if (action === 'support') tg.openTelegramLink('https://t.me/krugobot_news?direct');
        if (action === 'my-videos') {
            tg.sendData(JSON.stringify({ action: 'my_videos' }));
            tg.showPopup({ message: 'Управление в боте' });
        }
    }
    
    // Видео действия
    if (e.target.dataset.videoAction) {
        handleVideoAction(e.target.dataset.videoAction);
    }
    
    // Админ действия
    if (e.target.dataset.adminAction) {
        handleAdminAction(e.target.dataset.adminAction);
    }
});

// Запуск
init();