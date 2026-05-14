// ===== Приложение Блог IT Clan =====
class BlogApp {
    constructor() {
        this.currentPage = 'home';
        this.currentArticleId = null;
        this.currentCategory = null;
        this.searchQuery = '';
        
        // Загружаем данные из localStorage или используем blogPosts из data.js
        this.favorites = JSON.parse(localStorage.getItem('itclan_favorites') || '[]');
        this.readProgress = JSON.parse(localStorage.getItem('itclan_readProgress') || '{}');
        this.readHistory = JSON.parse(localStorage.getItem('itclan_readHistory') || '[]');
        this.userNotes = JSON.parse(localStorage.getItem('itclan_userNotes') || '{}');
        this.quizScores = JSON.parse(localStorage.getItem('itclan_quizScores') || '{}');
        this.bookmarks = JSON.parse(localStorage.getItem('itclan_bookmarks') || '[]');
        
        // Тема: сначала проверяем системные настройки, затем localStorage
        const savedTheme = localStorage.getItem('itclan_theme');
        if (savedTheme) {
            this.theme = savedTheme;
        } else {
            this.theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        
        // Данные из data.js
        this.posts = typeof blogPosts !== 'undefined' ? blogPosts : [];
        
        // Ресурсы для новой страницы
        this.resources = [
            { id: 1, title: 'MDN Web Docs', url: 'https://developer.mozilla.org', desc: 'Лучшая документация по веб-технологиям', category: 'Документация', emoji: '📚' },
            { id: 2, title: 'GitHub', url: 'https://github.com', desc: 'Платформа для разработки и совместной работы', category: 'Инструменты', emoji: '💻' },
            { id: 3, title: 'Stack Overflow', url: 'https://stackoverflow.com', desc: 'Сообщество разработчиков с ответами на вопросы', category: 'Сообщества', emoji: '🔥' },
            { id: 4, title: 'CodePen', url: 'https://codepen.io', desc: 'Онлайн редактор для тестирования HTML/CSS/JS', category: 'Инструменты', emoji: '✏️' },
            { id: 5, title: 'Figma', url: 'https://figma.com', desc: 'Дизайн-инструмент для UI/UX дизайнеров', category: 'Дизайн', emoji: '🎨' },
            { id: 6, title: 'Dev.to', url: 'https://dev.to', desc: 'Сообщество разработчиков и блог-платформа', category: 'Сообщества', emoji: '🌐' },
        ];
        
        // Настройки пользователя
        this.settings = JSON.parse(localStorage.getItem('itclan_settings') || '{"notifications": true, "userName": "", "username": ""}');
        
        // Частицы canvas
        this.particles = [];
        this.animationFrameId = null;
        this.mouseX = 0;
        this.mouseY = 0;
        
        // Таймер чтения статьи
        this.readingTimer = null;
        this.articleStartTime = null;
        
        // ID последней показанной новости
        this.lastNewsToastPostId = parseInt(localStorage.getItem('itclan_lastNewsToastPostId') || '0');
        
        // Достижения
        this.achievementsList = [
            { id: 'first_read', name: 'Первое чтение', icon: '📖', description: 'Откройте первую статью', unlocked: true },
            { id: 'reader_5', name: 'Читатель', icon: '📚', description: 'Прочитайте 5 статей', unlocked: this.readHistory.length >= 5 },
            { id: 'reader_all', name: 'Эрудит', icon: '🎓', description: 'Прочитайте все статьи', unlocked: this.readHistory.length >= this.posts.length },
            { id: 'first_fav', name: 'Коллекционер', icon: '❤️', description: 'Добавьте статью в избранное', unlocked: this.favorites.length > 0 },
            { id: 'fan_5', name: 'Фанат', icon: '💝', description: 'Сохраните 5 статей', unlocked: this.favorites.length >= 5 },
            { id: 'explorer_3', name: 'Исследователь', icon: '🔍', description: 'Изучите 3 категории', unlocked: this.getUniqueCategoriesRead() >= 3 },
            { id: 'note_taker', name: 'Собеседник', icon: '✏️', description: 'Напишите заметку к статье', unlocked: Object.keys(this.userNotes).length > 0 },
            { id: 'quiz_master', name: 'Квиз-мастер', icon: '🧠', description: 'Получите 100% в любом квизе', unlocked: Object.values(this.quizScores).some(s => s === 100) },
            { id: 'first_bookmark', name: 'Собиратель', icon: '🔖', description: 'Добавьте ресурс в закладки', unlocked: this.bookmarks.length > 0 },
        ];
        
        this.init();
    }

    // ===== Утилиты данных =====
    getTotalReadCount() {
        return this.readHistory.length;
    }

    getUniqueCategoriesRead() {
        const categories = new Set(this.readHistory.map(h => h.category));
        return categories.size;
    }

    init() {
        this.applyTheme();
        this.renderNavigation();
        this.renderHomePage();
        this.bindEvents();
        this.updateFavoritesCount();
        this.initReadingProgress();
        this.initScrollTopButton();
        this.renderFooter();
        
        // Инициализация анимированного фона с частицами
        this.initParticles();
        
        // Анимация появления элементов
        setTimeout(() => this.animateOnScroll(), 100);
        
        // Автоматическое уведомление о новых статьях
        setTimeout(() => this.showNewArticlesNotification(), 3000);
        
        // Проверка смены темы по времени суток каждые минуту
        setInterval(() => this.checkAutoThemeChange(), 60000);
    }

    // ===== Тема с автоматическим переключением =====
    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.theme);
    }

    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', this.theme);
        localStorage.setItem('itclan_theme', this.theme);
        this.showToast(`Тема: ${this.theme === 'dark' ? 'тёмная 🌙' : 'светлая ☀️'}`);
    }

    /** Автоматическое переключение темы по времени суток */
    checkAutoThemeChange() {
        // Если пользователь явно не устанавливал тему — используем автоматический режим
        const savedTheme = localStorage.getItem('itclan_theme');
        if (!savedTheme) return; // Пропускаем, если тема не сохранена (автоматическая)
        
        const hour = new Date().getHours();
        let autoTheme;
        
        if (hour >= 7 && hour < 23) {
            autoTheme = 'light'; // День — светлая тема
        } else {
            autoTheme = 'dark'; // Ночь — тёмная тема
        }
        
        // Если текущая тема не совпадает с автоматической — меняем
        if (this.theme !== autoTheme) {
            this.theme = autoTheme;
            document.documentElement.setAttribute('data-theme', this.theme);
        }
    }

    /** Определение темы по времени суток */
    getAutoTheme() {
        const hour = new Date().getHours();
        return (hour >= 7 && hour < 23) ? 'light' : 'dark';
    }

    // ===== Навигация =====
    renderNavigation() {
        const navLinks = document.querySelector('.nav-links');
        if (!navLinks) return;
        
        navLinks.innerHTML = `
            <li><a href="#" data-page="home" class="${this.currentPage === 'home' ? 'active' : ''}">Главная</a></li>
            <li><a href="#" data-page="posts">Все статьи</a></li>
            <li><a href="#" data-page="resources" class="${this.currentPage === 'resources' ? 'active' : ''}">Ресурсы</a></li>
            <li><a href="#" data-page="about">О блоге</a></li>
            <li><a href="#" data-page="profile" class="${this.currentPage === 'profile' ? 'active' : ''}">Профиль</a></li>
        `;
    }

    navigateTo(page, params = {}) {
        this.currentPage = page;
        if (params.articleId) this.currentArticleId = params.articleId;
        if (params.category) this.currentCategory = params.category;
        
        // Очистка поиска при смене страницы
        this.searchQuery = '';
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = '';
            this.toggleSearchClear(false);
        }

        this.renderNavigation();
        
        switch(page) {
            case 'home':
                this.renderHomePage();
                break;
            case 'posts':
                this.renderPostsPage(params.category);
                break;
            case 'article':
                this.startReadingTimer(); // Запускаем таймер чтения
                this.renderArticlePage(this.currentArticleId);
                break;
            case 'about':
                this.renderAboutPage();
                break;
            case 'profile':
                this.renderProfilePage();
                break;
            case 'settings':
                this.renderSettingsPage();
                break;
            case 'resources':
                this.renderResourcesPage();
                break;
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Анимация появления элементов
        setTimeout(() => this.animateOnScroll(), 150);
    }

    // ===== Главная страница =====
    renderHomePage() {
        const main = document.getElementById('app');
        if (!main || this.posts.length === 0) return;

        const recentPosts = [...this.posts].sort((a, b) => this.getDateValue(b.date) - this.getDateValue(a.date)).slice(0, 3);
        const featuredPost = recentPosts[0];

        let html = `
            <section class="hero animate-fade-in">
                <div class="hero-content">
                    <span class="hero-badge">🚀 Сообщество разработчиков</span>
                    <h2>Добро пожаловать в IT Clan!</h2>
                    <p>Качественные статьи о технологиях, дизайне и саморазвитии. Присоединяйтесь к нашему сообществу!</p>
                    <div class="hero-actions">
                        <button class="hero-btn" data-navigate-to="posts">📚 Читать статьи</button>
                        <button class="hero-btn hero-btn-outline" data-navigate-to="resources">🔖 Ресурсы</button>
                    </div>
                </div>
                ${featuredPost ? `
                <div class="hero-featured">
                    <div class="hero-featured-card" data-navigate-to="article" data-article-id="${featuredPost.id}">
                        <span class="hero-featured-emoji">${featuredPost.emoji || '📄'}</span>
                        <div class="hero-featured-info">
                            <span class="hero-featured-label">⭐ Рекомендуемая статья</span>
                            <h3>${featuredPost.title}</h3>
                            <p>${(featuredPost.excerpt || '').substring(0, 120)}...</p>
                        </div>
                    </div>
                </div>
                ` : ''}
            </section>
        `;

        // Категории
        const categories = this.getCategories();
        html += `<section style="margin-bottom: 3rem;">`;
        html += `<h3 style="font-size: 1.5rem; margin-bottom: 1.5rem; color: var(--text-primary);">Категории</h3>`;
        html += `<div class="category-filter" style="justify-content: center;">`;
        
        categories.forEach(cat => {
            const count = this.posts.filter(a => a.category === cat).length;
            html += `
                <button class="category-btn slide-up" data-category="${cat}">
                    ${cat} (${count})
                </button>
            `;
        });
        
        html += `</div></section>`;

        // Последние публикации (уже получены для hero)
        html += `<section class="recent-posts">`;
        html += `<h3>Последние публикации</h3>`;
        html += `<div class="posts-grid">`;
        
        recentPosts.forEach((post, index) => {
            html += this.renderPostCard(post, index);
        });
        
        html += `</div></section>`;

        main.innerHTML = html;
        this.bindPageEvents();
    }

    // ===== Карточка поста =====
    renderPostCard(post, index = 0) {
        const isFavorite = this.isFavorite(post.id);
        return `
            <article class="post-card slide-up" data-article-id="${post.id}" style="animation-delay: ${index * 0.1}s">
                <div class="post-card-image">${post.emoji || '📄'}</div>
                <div class="post-card-body">
                    <span class="post-card-category">${post.category}</span>
                    <h3 class="post-card-title">${post.title}</h3>
                    <p class="post-card-excerpt">${post.excerpt || ''}</p>
                    <div class="post-card-footer">
                        <span>${this.formatDate(post.date)} · ${this.getReadTimeText(post)}</span>
                        <span class="read-more">Читать →</span>
                    </div>
                </div>
                <button class="favorite-toggle-btn ${isFavorite ? 'active' : ''}" 
                        data-fav-id="${post.id}" 
                        title="${isFavorite ? 'Удалить из избранного' : 'В избранное'}">
                    ${isFavorite ? '❤️' : '🤍'}
                </button>
            </article>
        `;
    }

    // ===== Страница всех статей =====
    renderPostsPage(category = null) {
        const main = document.getElementById('app');
        if (!main) return;

        let filteredPosts = [...this.posts];
        
        if (category) {
            filteredPosts = filteredPosts.filter(p => p.category === category);
        }

        // Применяем поиск если есть запрос
        if (this.searchQuery.trim()) {
            const q = this.searchQuery.toLowerCase();
            filteredPosts = filteredPosts.filter(p => 
                p.title.toLowerCase().includes(q) || 
                (p.excerpt && p.excerpt.toLowerCase().includes(q)) ||
                p.category.toLowerCase().includes(q)
            );
        }

        const categories = this.getCategories();
        
        let html = `
            <div class="posts-page-header">
                <h2>${category ? category : 'Все статьи'}</h2>
                <p style="color: var(--text-secondary); margin-top: 0.5rem;">
                    Найдено: ${filteredPosts.length} ${this.getArticleWord(filteredPosts.length)}
                </p>
            </div>
        `;

        // Фильтр по категориям
        html += `<div class="category-filter">`;
        html += `<button class="category-btn ${!category ? 'active' : ''}" data-category="">Все</button>`;
        
        categories.forEach(cat => {
            html += `
                <button class="category-btn ${category === cat ? 'active' : ''}" 
                        data-category="${cat}">
                    ${cat}
                </button>
            `;
        });
        
        html += `</div>`;

        // Сетка постов
        if (filteredPosts.length > 0) {
            html += `<div class="posts-grid">`;
            filteredPosts.forEach((post, index) => {
                html += this.renderPostCard(post, index);
            });
            html += `</div>`;
        } else {
            html += `
                <div class="no-results">
                    <div class="no-results-emoji">🔍</div>
                    <h3>Ничего не найдено</h3>
                    <p>Попробуйте изменить параметры поиска</p>
                </div>
            `;
        }

        main.innerHTML = html;
        this.bindPageEvents();
    }

    // ===== Страница статьи =====
    renderArticlePage(articleId) {
        const main = document.getElementById('app');
        if (!main) return;

        const article = this.posts.find(a => a.id === articleId);
        if (!article) {
            main.innerHTML = '<p>Статья не найдена</p>';
            return;
        }

        // Добавляем в историю чтения
        this.addToReadHistory(article);

        const isFavorite = this.isFavorite(article.id);
        const note = this.userNotes[article.id] || '';
        const bookmarkKey = 'resource_' + articleId;
        const isBookmarked = this.bookmarks.includes(bookmarkKey);

        let html = `
            <button class="back-btn" data-action="go-back">← Назад</button>
            
            <article class="article-full animate-fade-in" id="article-content">
                <h1>${article.title}</h1>
                
                <div class="article-meta">
                    <span>📁 ${article.category}</span>
                    <span>📅 ${this.formatDate(article.date)}</span>
                    <span>⏱ ${this.getReadTimeText(article)} чтения</span>
                </div>

                <div class="article-content">
                    ${article.content || '<p>Содержимое статьи загружается...</p>'}
                </div>

                <!-- Таймер чтения -->
                <div id="readingTimerDisplay" style="margin-top: 1rem; padding: 0.75rem 1rem; background: var(--accent-light); border-radius: 12px; display: inline-flex; align-items: center; gap: 0.5rem;">
                    ⏱ <span id="readingTimerText">Время чтения: 0:00</span>
                </div>

                <div class="article-actions-section">
                    <button class="article-favorite-btn ${isFavorite ? 'active' : ''}" 
                            id="articleFavBtn"
                            onclick="app.toggleFavorite(${article.id}); app.updateArticleActions();">
                        ${isFavorite ? '❤️ В избранном' : '🤍 В избранное'}
                    </button>
                    
                    <button class="article-bookmark-btn" 
                            id="articleBookmarkBtn"
                            onclick="app.toggleBookmark('${bookmarkKey}', this); app.updateArticleActions();">
                        🔖 ${isBookmarked ? 'В закладках' : 'Добавить в закладки'}
                    </button>
                </div>

                <!-- Заметки к статье -->
                <div class="article-notes-section" style="margin-top: 3rem; padding-top: 2rem; border-top: 1px solid var(--border-color);">
                    <h3 style="font-size: 1.3rem; margin-bottom: 1rem;">✏️ Мои заметки</h3>
                    <textarea class="article-note-input" id="articleNoteInput" placeholder="Напишите свои мысли и идеи по этой статье..." rows="4">${note}</textarea>
                    <div style="margin-top: 1rem; display: flex; gap: 1rem; align-items: center;">
                        <button class="hero-btn save-note-btn" onclick="app.saveNote(${article.id});" style="padding: 0.6rem 1.2rem; font-size: 0.9rem;">💾 Сохранить заметку</button>
                        <span class="note-status" style="color: var(--text-muted); font-size: 0.85rem;"></span>
                    </div>
                </div>

                <!-- Квиз к статье -->
                ${article.quiz ? `
                <div class="article-quiz-section">
                    <h3 style="font-size: 1.3rem; margin-bottom: 1rem;">🧠 Квиз по статье</h3>
                    <div id="quizContent"></div>
                </div>
                ` : ''}
            </article>
        `;

        main.innerHTML = html;
        this.bindPageEvents();
        this.initArticleReadingProgress(articleId);

        // Загружаем квиз если есть
        if (article.quiz) {
            setTimeout(() => this.renderQuiz(article), 100);
        }
    }

    /** Запуск таймера чтения статьи */
    startReadingTimer() {
        this.stopReadingTimer();
        this.articleStartTime = Date.now();
        
        const timerTextEl = document.getElementById('readingTimerText');
        
        this.readingTimer = setInterval(() => {
            if (!timerTextEl) return;
            
            const elapsed = Math.floor((Date.now() - this.articleStartTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            
            timerTextEl.textContent = `⏱ Время чтения: ${minutes}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }

    /** Остановка таймера чтения */
    stopReadingTimer() {
        if (this.readingTimer) {
            clearInterval(this.readingTimer);
            this.readingTimer = null;
        }
        
        // Сохраняем время чтения
        if (this.articleStartTime && this.currentArticleId) {
            const elapsedMinutes = Math.floor((Date.now() - this.articleStartTime) / 60000);
            if (elapsedMinutes > 0) {
                // Добавляем к истории
                const historyEntry = this.readHistory.find(h => h.id === this.currentArticleId);
                if (historyEntry) {
                    historyEntry.readDuration = (historyEntry.readDuration || 0) + elapsedMinutes;
                    localStorage.setItem('itclan_readHistory', JSON.stringify(this.readHistory));
                }
            }
        }
        
        this.articleStartTime = null;
    }

    updateArticleActions() {
        const articleContent = document.getElementById('article-content');
        if (!articleContent) return;
        
        // Получаем articleId из ID статьи (берём из data-article-id если есть, или парсим)
        const favBtn = document.getElementById('articleFavBtn');
        if (favBtn) {
            const articleIdStr = favBtn.getAttribute('onclick').match(/(\d+)/)?.[0];
            if (articleIdStr) {
                const articleId = parseInt(articleIdStr);
                const isFavorite = this.isFavorite(articleId);
                favBtn.classList.toggle('active', isFavorite);
                favBtn.innerHTML = isFavorite ? '❤️ В избранном' : '🤍 В избранное';
            }
        }

        // Обновляем кнопку закладок
        const bookmarkBtn = document.getElementById('articleBookmarkBtn');
        if (bookmarkBtn) {
            const bookmarkKeyMatch = bookmarkBtn.getAttribute('onclick').match(/'(resource_\d+)'/);
            if (bookmarkKeyMatch) {
                const bookmarkKey = bookmarkKeyMatch[1];
                const isBookmarked = this.bookmarks.includes(bookmarkKey);
                bookmarkBtn.innerHTML = `🔖 ${isBookmarked ? 'В закладках' : 'Добавить в закладки'}`;
            }
        }

        // Обновляем все кнопки на странице
        document.querySelectorAll('.favorite-toggle-btn').forEach(button => {
            const id = parseInt(button.dataset.favId);
            if (id) {
                const isFav = this.isFavorite(id);
                button.classList.toggle('active', isFav);
                button.innerHTML = isFav ? '❤️' : '🤍';
            }
        });

        this.updateFavoritesCount();
    }

    // ===== Рендер квиза =====
    renderQuiz(article) {
        const quizContent = document.getElementById('quizContent');
        if (!quizContent || !article.quiz) return;

        const questions = article.quiz.questions || [];
        let currentQuestion = 0;
        let score = 0;

        window.showQuizQuestion = function(idx) {
            if (idx >= questions.length) {
                const percent = Math.round((score / questions.length) * 100);
                quizContent.innerHTML = `
                    <div style="text-align: center;">
                        <p style="font-size: 3rem; margin-bottom: 1rem;">${percent >= 80 ? '🎉' : percent >= 50 ? '👍' : '📚'}</p>
                        <h4 style="font-size: 1.3rem; margin-bottom: 0.5rem;">Результат: ${score}/${questions.length} (${percent}%)</h4>
                        <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">${percent >= 80 ? 'Отлично! Вы хорошо усвоили материал!' : percent >= 50 ? 'Неплохо, но можно лучше!' : 'Стоит перечитать статью ещё раз.'}</p>
                        <button class="hero-btn" onclick="app.renderQuiz(app.posts.find(p => p.id === ${article.id}))" style="padding: 0.6rem 1.2rem; font-size: 0.9rem;">🔄 Пройти заново</button>
                    </div>
                `;
                
                if (percent >= 80) {
                    app.quizScores[article.id] = Math.max(app.quizScores[article.id] || 0, percent);
                    localStorage.setItem('itclan_quizScores', JSON.stringify(app.quizScores));
                    
                    if (percent === 100) {
                        app.unlockAchievement('quiz_master');
                    }
                }
            } else {
                const q = questions[idx];
                quizContent.innerHTML = `
                    <div class="quiz-question">
                        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.5rem;">Вопрос ${idx + 1} из ${questions.length}</p>
                        <h4 style="margin-bottom: 1rem;">${q.question}</h4>
                        <div class="quiz-options">
                            ${q.options.map((opt, i) => `
                                <button class="quiz-option" data-answer="${i}" onclick="window.handleQuizAnswer(this, '${opt.replace(/'/g, "\\'")}', '${q.correct.replace(/'/g, "\\'")}')">${opt}</button>
                            `).join('')}
                        </div>
                    </div>
                `;
            }
        };

        window.handleQuizAnswer = function(btn, selected, correct) {
            const options = btn.parentElement.querySelectorAll('.quiz-option');
            options.forEach(opt => {
                opt.disabled = true;
                if (opt.textContent === correct) {
                    opt.style.background = 'var(--success)';
                    opt.style.color = 'white';
                    opt.style.borderColor = 'var(--success)';
                }
            });

            if (selected === correct) {
                score++;
                btn.style.background = 'var(--success)';
                btn.style.color = 'white';
            } else {
                btn.style.background = 'var(--danger)';
                btn.style.color = 'white';
            }

            setTimeout(() => {
                window.showQuizQuestion(currentQuestion + 1);
            }, 1200);
        };

        showQuizQuestion(0);
    }

    // ===== Страница ресурсов (НОВАЯ) =====
    renderResourcesPage() {
        const main = document.getElementById('app');
        if (!main) return;

        let html = `
            <div class="resources-page animate-fade-in">
                <h2>🔖 Полезные ресурсы</h2>
                <p style="color: var(--text-secondary); margin-bottom: 2rem;">Подборка лучших инструментов и ресурсов для разработчиков</p>
                
                <!-- Фильтр по категориям -->
                <div class="category-filter">
                    <button class="category-btn active" data-resource-cat="">Все</button>
                    ${[...new Set(this.resources.map(r => r.category))].map(cat => `
                        <button class="category-btn" data-resource-cat="${cat}">${cat}</button>
                    `).join('')}
                </div>

                <!-- Сетка ресурсов -->
                <div class="resources-grid">
                    ${this.resources.map((res, index) => {
                        const isBookmarked = this.bookmarks.includes('resource_' + res.id);
                        return `
                            <div class="resource-card slide-up" data-resource-id="${res.id}" data-category="${res.category}" style="animation-delay: ${index * 0.1}s">
                                <div class="resource-emoji">${res.emoji}</div>
                                <div class="resource-info">
                                    <h3>${res.title}</h3>
                                    <p>${res.desc}</p>
                                    <span class="resource-category-tag">${res.category}</span>
                                </div>
                                <div class="resource-actions">
                                    <a href="${res.url}" target="_blank" rel="noopener noreferrer" class="resource-link-btn">Перейти →</a>
                                    <button class="bookmark-toggle-btn ${isBookmarked ? 'active' : ''}" 
                                            data-resource-bookmark-id="${res.id}"
                                            onclick="event.stopPropagation(); app.toggleBookmark('resource_${res.id}', this);">
                                        ${isBookmarked ? '🔖' : '📄'}
                                    </button>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>

                <!-- Закладки пользователя -->
                ${this.bookmarks.length > 0 ? `
                <div class="bookmarks-section" style="margin-top: 3rem;">
                    <h3>📌 Мои закладки (${this.bookmarks.length})</h3>
                    <div class="bookmarks-list">
                        ${this.bookmarks.map(bm => {
                            const resId = parseInt(bm.replace('resource_', ''));
                            const res = this.resources.find(r => r.id === resId);
                            return res ? `
                                <div class="bookmark-item">
                                    <span>${res.emoji}</span>
                                    <a href="${res.url}" target="_blank">${res.title}</a>
                                    <button class="remove-bookmark" onclick="app.toggleBookmark('${bm}', this); event.stopPropagation();">×</button>
                                </div>
                            ` : '';
                        }).join('')}
                    </div>
                </div>
                ` : ''}
            </div>
        `;

        main.innerHTML = html;
        this.bindPageEvents();
    }

    toggleBookmark(bookmarkId, btnElement) {
        const index = this.bookmarks.indexOf(bookmarkId);
        
        if (index > -1) {
            this.bookmarks.splice(index, 1);
            this.showToast('Удалено из закладок');
        } else {
            this.bookmarks.push(bookmarkId);
            this.showToast('Добавлено в закладки 🔖');
            
            if (this.bookmarks.length === 1) {
                this.unlockAchievement('first_bookmark');
            }
        }

        localStorage.setItem('itclan_bookmarks', JSON.stringify(this.bookmarks));
        
        // Обновляем кнопки на странице ресурсов
        document.querySelectorAll('.bookmark-toggle-btn').forEach(button => {
            const resId = button.dataset.resourceBookmarkId;
            if (resId) {
                const bmKey = 'resource_' + parseInt(resId);
                const isBookmarked = this.bookmarks.includes(bmKey);
                button.classList.toggle('active', isBookmarked);
                button.innerHTML = isBookmarked ? '🔖' : '📄';
            }
        });

        // Обновляем закладки в профиле если на странице ресурсов
        if (this.currentPage === 'resources') {
            setTimeout(() => this.renderResourcesPage(), 100);
        } else if (this.currentPage === 'profile') {
            setTimeout(() => this.renderProfilePage(), 100);
        }
    }

    // ===== Страница "О блоге" =====
    renderAboutPage() {
        const main = document.getElementById('app');
        if (!main) return;

        const totalArticles = this.posts.length;
        const categories = this.getCategories().length;
        const totalReadTime = this.posts.reduce((sum, p) => {
            if (typeof p.readTime === 'number') return sum + p.readTime;
            const match = String(p.readTime).match(/\d+/);
            return sum + (match ? parseInt(match[0]) : 0);
        }, 0);

        let html = `
            <button class="back-btn" data-action="go-back">← Назад</button>
            
            <div class="about-page animate-fade-in">
                <h2>О блоге IT Clan</h2>
                
                <p>Добро пожаловать в IT Clan — сообщество разработчиков! Мы создаём качественные статьи о технологиях, дизайне, программировании и саморазвитии.</p>

                <h3>Наша миссия</h3>
                <p>Мы верим, что знания должны быть доступными. Наша цель — помочь вам оставаться в курсе последних трендов и осваивать новые навыки каждый день.</p>

                <div class="stats-grid" style="margin: 2rem 0;">
                    <div class="stat-item">
                        <span class="stat-number">${totalArticles}</span>
                        <span class="stat-label">Статей</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">${categories}</span>
                        <span class="stat-label">Категорий</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">${totalReadTime}</span>
                        <span class="stat-label">Минут чтения</span>
                    </div>
                </div>

                <h3>Категории</h3>
                <p>Наши статьи охватывают широкий спектр тем:</p>
                <ul style="margin-left: 1.5rem; color: var(--text-secondary); line-height: 2;">
                    ${this.getCategories().map(cat => `<li>${cat}</li>`).join('')}
                </ul>

                <h3>Связь с нами</h3>
                <p>Есть вопросы или предложения? Напишите нам на email: <a href="mailto:hello@itclan.dev" style="color: var(--accent);">hello@itclan.dev</a></p>
            </div>
        `;

        main.innerHTML = html;
        this.bindPageEvents();
    }

    // ===== Страница профиля =====
    renderProfilePage() {
        const main = document.getElementById('app');
        if (!main) return;

        const totalReadTime = this.readHistory.reduce((sum, h) => {
            let time = 0;
            if (typeof h.readTime === 'number') time = h.readTime;
            else {
                const match = String(h.readTime).match(/\d+/);
                if (match) time = parseInt(match[0]);
            }
            // Добавляем дополнительное время чтения из таймера
            if (h.readDuration) time += h.readDuration;
            return sum + time;
        }, 0);

        const unlockedCount = this.achievementsList.filter(a => a.unlocked).length;

        let html = `
            <div class="profile-page animate-fade-in">
                <div class="profile-header">
                    <div class="profile-banner"></div>
                    <div class="profile-avatar-section">
                        <div class="profile-avatar">${this.getProfileEmoji()}</div>
                        <div class="profile-info">
                            <h2 class="profile-name">${this.settings.userName || 'Участник IT Clan'}</h2>
                            <p class="profile-username">@${this.settings.username || 'member_' + Date.now().toString().slice(-4)}</p>
                        </div>
                        <button class="profile-edit-btn" data-action="go-to-settings">⚙️ Настройки</button>
                    </div>
                </div>

                <div class="profile-stats-grid">
                    <div class="profile-stat">
                        <span class="profile-stat-number">${this.readHistory.length}</span>
                        <span class="profile-stat-label">Прочитано</span>
                    </div>
                    <div class="profile-stat">
                        <span class="profile-stat-number">${totalReadTime} мин</span>
                        <span class="profile-stat-label">Время чтения</span>
                    </div>
                    <div class="profile-stat">
                        <span class="profile-stat-number">${this.favorites.length}</span>
                        <span class="profile-stat-label">Избранное</span>
                    </div>
                    <div class="profile-stat">
                        <span class="profile-stat-number">${unlockedCount}/${this.achievementsList.length}</span>
                        <span class="profile-stat-label">Достижения</span>
                    </div>
                </div>

                <div class="profile-sections" style="margin-top: 2rem;">
                    <!-- История чтения -->
                    <div class="profile-section-card">
                        <h3>📖 История чтения</h3>
                        ${this.readHistory.length > 0 ? `
                            <div class="history-list">
                                ${this.readHistory.slice(0, 5).map(h => `
                                    <div class="history-item" data-article-id="${h.id}">
                                        <span class="history-emoji">${h.emoji || '📄'}</span>
                                        <div class="history-info">
                                            <div class="history-title">${h.title}</div>
                                            <div class="history-date">${this.formatDate(h.date)}</div>
                                            ${h.progress > 0 ? `
                                                <div class="history-progress-bar">
                                                    <div class="history-progress-fill" style="width: ${Math.min(h.progress, 100)}%"></div>
                                                </div>
                                            ` : ''}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        ` : '<p style="color: var(--text-muted); text-align: center; padding: 2rem 0;">Вы ещё не читали статьи</p>'}
                    </div>

                    <!-- Достижения -->
                    <div class="profile-section-card">
                        <h3>🏆 Достижения</h3>
                        <div class="achievements-grid">
                            ${this.achievementsList.map(a => `
                                <div class="achievement ${a.unlocked ? 'unlocked' : ''}" title="${a.description}">
                                    <div class="achievement-icon">${a.unlocked ? a.icon : '🔒'}</div>
                                    <div class="achievement-name">${a.name}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Заметки -->
                    ${Object.keys(this.userNotes).length > 0 ? `
                    <div class="profile-section-card" style="grid-column: 1 / -1;">
                        <h3>✏️ Мои заметки</h3>
                        <div class="notes-list">
                            ${Object.entries(this.userNotes).map(([id, note]) => {
                                const post = this.posts.find(p => p.id === parseInt(id));
                                return post ? `
                                    <div class="note-item" data-article-id="${post.id}">
                                        <span class="note-emoji">${post.emoji || '📄'}</span>
                                        <div class="note-info">
                                            <div class="note-title">${post.title}</div>
                                            <div class="note-text">${note.substring(0, 100)}${note.length > 100 ? '...' : ''}</div>
                                        </div>
                                    </div>
                                ` : '';
                            }).join('')}
                        </div>
                    </div>
                    ` : ''}

                    <!-- Избранное -->
                    <div class="profile-section-card" style="grid-column: 1 / -1;">
                        <h3>❤️ Избранные статьи</h3>
                        ${this.favorites.length > 0 ? `
                            <div class="posts-grid">
                                ${this.posts.filter(p => this.isFavorite(p.id)).map(post => this.renderPostCard(post))}
                            </div>
                        ` : '<p style="color: var(--text-muted); text-align: center; padding: 2rem 0;">Вы ещё не добавили статьи в избранное</p>'}
                    </div>

                    <!-- Закладки -->
                    ${this.bookmarks.length > 0 ? `
                    <div class="profile-section-card" style="grid-column: 1 / -1;">
                        <h3>🔖 Мои закладки</h3>
                        <div class="bookmarks-list">
                            ${this.bookmarks.map(bm => {
                                const resId = parseInt(bm.replace('resource_', ''));
                                const resource = this.resources.find(r => r.id === resId);
                                if (resource) {
                                    return `
                                        <div class="bookmark-item">
                                            <span>${resource.emoji}</span>
                                            <a href="${resource.url}" target="_blank">${resource.title}</a>
                                            <button class="remove-bookmark" onclick="app.toggleBookmark('${bm}', this); event.stopPropagation();">×</button>
                                        </div>
                                    `;
                                }
                                return '';
                            }).join('')}
                        </div>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;

        main.innerHTML = html;
        this.bindPageEvents();
    }

    // ===== Страница настроек =====
    renderSettingsPage() {
        const main = document.getElementById('app');
        if (!main) return;

        let html = `
            <button class="back-btn" data-action="go-back">← Назад</button>
            
            <div class="profile-page animate-fade-in">
                <div class="profile-section-card" style="max-width: 600px; margin: 0 auto;">
                    <h3>⚙️ Настройки профиля</h3>
                    
                    <!-- Имя пользователя -->
                    <div class="setting-item">
                        <div>
                            <div class="setting-label">Имя</div>
                            <div class="setting-description">Как вас видеть в блоге</div>
                        </div>
                        <input type="text" id="settingsUserName" value="${this.settings.userName || ''}" 
                               placeholder="Ваше имя" 
                               style="padding: 0.5rem 1rem; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-tertiary); color: var(--text-primary); min-width: 150px;">
                    </div>

                    <!-- Уникальный username -->
                    <div class="setting-item">
                        <div>
                            <div class="setting-label">Username</div>
                            <div class="setting-description">Уникальный идентификатор</div>
                        </div>
                        <input type="text" id="settingsUsername" value="${this.settings.username || ''}" 
                               placeholder="username" 
                               style="padding: 0.5rem 1rem; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-tertiary); color: var(--text-primary); min-width: 150px;">
                    </div>

                    <!-- Уведомления -->
                    <div class="setting-item">
                        <div>
                            <div class="setting-label">Уведомления</div>
                            <div class="setting-description">Показывать уведомления при действиях</div>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" id="settingsNotifications" ${this.settings.notifications ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>

                    <!-- Кнопка сохранения -->
                    <div style="margin-top: 2rem; display: flex; gap: 1rem;">
                        <button class="hero-btn save-settings-btn" style="padding: 0.7rem 1.5rem; font-size: 0.95rem;">💾 Сохранить</button>
                        <button class="back-btn clear-data-btn" style="margin: 0; border-color: var(--danger); color: var(--danger);">🗑️ Очистить данные</button>
                    </div>
                </div>
            </div>
        `;

        main.innerHTML = html;
        this.bindPageEvents();
    }

    // ===== Подвал =====
    renderFooter() {
        const footerCategories = document.getElementById('footerCategories');
        if (!footerCategories) return;

        const categories = this.getCategories();
        footerCategories.innerHTML = categories.map(cat => 
            `<li><a href="#" data-page="posts" data-category-filter="${cat}">${cat}</a></li>`
        ).join('');

        // Обновление статистики в подвале
        const totalPosts = document.getElementById('totalPosts');
        const totalCategories = document.getElementById('totalCategories');
        if (totalPosts) totalPosts.textContent = this.posts.length;
        if (totalCategories) totalCategories.textContent = categories.length;

        // Обработчики для категорий в подвале
        footerCategories.addEventListener('click', (e) => {
            if (e.target.dataset.categoryFilter) {
                e.preventDefault();
                this.navigateTo('posts', { category: e.target.dataset.categoryFilter });
            }
        });
    }

    // ===== События =====
    bindEvents() {
        // Переключатель темы
        document.addEventListener('click', (e) => {
            if (e.target.closest('.theme-toggle')) {
                this.toggleTheme();
            }
        });

        // Навигация по ссылкам
        document.addEventListener('click', (e) => {
            const link = e.target.closest('[data-page]');
            if (link && !e.target.closest('.footer-categories') && !e.target.closest('.logo')) {
                e.preventDefault();
                const page = link.dataset.page;
                
                if (link.dataset.categoryFilter) {
                    this.navigateTo('posts', { category: link.dataset.categoryFilter });
                } else {
                    this.navigateTo(page);
                }
            }

            // Логотип - на главную
            const logo = e.target.closest('.logo h1');
            if (logo) {
                e.preventDefault();
                this.navigateTo('home');
            }
        });

        // Поиск — исправленный: всегда переходим на posts при вводе
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            let debounceTimer;
            
            searchInput.addEventListener('focus', () => {
                if (this.currentPage !== 'posts' && this.searchQuery.trim()) {
                    this.navigateTo('posts', { category: this.currentCategory });
                }
            });
            
            searchInput.addEventListener('input', (e) => {
                clearTimeout(debounceTimer);
                const value = e.target.value;
                this.toggleSearchClear(value.length > 0);
                
                debounceTimer = setTimeout(() => {
                    this.searchQuery = value;
                    if (value.trim()) {
                        this.navigateTo('posts', { category: this.currentCategory });
                    } else if (this.currentPage === 'posts') {
                        this.renderPostsPage(this.currentCategory);
                    }
                }, 300);
            });

            const clearBtn = document.getElementById('searchClear');
            if (clearBtn) {
                clearBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    searchInput.value = '';
                    this.searchQuery = '';
                    this.toggleSearchClear(false);
                    searchInput.focus();
                    if (this.currentPage === 'posts') {
                        this.renderPostsPage(this.currentCategory);
                    }
                });
            }
        }

        // Мобильное меню
        const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        const navLinks = document.querySelector('.nav-links');
        if (mobileMenuBtn && navLinks) {
            mobileMenuBtn.addEventListener('click', () => {
                navLinks.classList.toggle('mobile-open');
            });

            navLinks.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => {
                    navLinks.classList.remove('mobile-open');
                });
            });
        }

        // Избранное - кнопка в шапке
        document.getElementById('favoritesBtn')?.addEventListener('click', (e) => {
            this.openFavoritesSidebar();
        });

        // Закрытие боковой панели
        document.getElementById('closeFavorites')?.addEventListener('click', () => {
            this.closeFavoritesSidebar();
        });

        document.getElementById('overlay')?.addEventListener('click', () => {
            this.closeFavoritesSidebar();
        });

        // Фильтр ресурсов
        document.addEventListener('click', (e) => {
            const resourceCatBtn = e.target.closest('[data-resource-cat]');
            if (resourceCatBtn && this.currentPage === 'resources') {
                const cat = resourceCatBtn.dataset.resourceCat || null;
                this.filterResources(cat);
            }
        });

        // Отслеживание мыши для частиц
        document.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        });

        // Остановка таймера чтения при уходе со страницы
        window.addEventListener('beforeunload', () => {
            this.stopReadingTimer();
            this.stopParticles();
        });
    }

    bindPageEvents() {
        // Делегирование: клик по карточке, кнопкам избранного и hero-кнопке
        document.addEventListener('click', (e) => {
            const favBtn = e.target.closest('.favorite-toggle-btn');
            if (favBtn) {
                e.preventDefault();
                e.stopPropagation();
                const articleId = parseInt(favBtn.dataset.favId);
                if (!isNaN(articleId)) {
                    this.toggleFavorite(articleId);
                }
                return;
            }

            // Кнопка навигации в hero
            const heroBtn = e.target.closest('[data-navigate-to]');
            if (heroBtn) {
                e.preventDefault();
                this.navigateTo(heroBtn.dataset.navigateTo);
                return;
            }

            const card = e.target.closest('.post-card');
            if (card) {
                const articleId = parseInt(card.dataset.articleId);
                if (!isNaN(articleId)) {
                    this.navigateTo('article', { articleId });
                }
            }
        });

        // Клик по категории
        document.addEventListener('click', (e) => {
            const catBtn = e.target.closest('[data-category]');
            if (catBtn && !e.target.closest('.post-card')) {
                const category = catBtn.dataset.category || null;
                this.currentCategory = category;
                this.navigateTo('posts', { category });
            }
        });

        // Кнопка "Назад"
        document.addEventListener('click', (e) => {
            if (e.target.closest('[data-action="go-back"]')) {
                e.preventDefault();
                this.stopReadingTimer(); // Останавливаем таймер при выходе из статьи
                this.navigateTo('posts');
            }
            
            // Кнопка "Перейти в настройки" из профиля
            if (e.target.closest('[data-action="go-to-settings"]')) {
                e.preventDefault();
                this.navigateTo('settings');
            }
        });

        // Переход к статье из истории/заметок/избранного в профиле
        document.addEventListener('click', (e) => {
            const historyItem = e.target.closest('.history-item');
            if (historyItem) {
                this.navigateTo('article', { articleId: parseInt(historyItem.dataset.articleId) });
                return;
            }

            const noteItem = e.target.closest('.note-item');
            if (noteItem) {
                this.navigateTo('article', { articleId: parseInt(noteItem.dataset.articleId) });
                return;
            }

            const favItem = e.target.closest('.favorite-item');
            if (favItem) {
                this.navigateTo('article', { articleId: parseInt(favItem.dataset.favId) });
                return;
            }

            // Кнопка удаления из избранного в боковой панели
            const removeBtn = e.target.closest('.favorite-remove');
            if (removeBtn) {
                e.preventDefault();
                e.stopPropagation();
                const favItem2 = removeBtn.closest('.favorite-item');
                if (favItem2) {
                    const articleId = parseInt(favItem2.dataset.favId);
                    this.toggleFavorite(articleId);
                    this.updateFavoritesSidebar();
                }
            }

            // Кнопка удаления закладки в профиле
            const removeBookmarkBtn = e.target.closest('.remove-bookmark');
            if (removeBookmarkBtn) {
                e.preventDefault();
                e.stopPropagation();
                const bookmarkItem = removeBookmarkBtn.closest('.bookmark-item');
                if (bookmarkItem) {
                    const link = bookmarkItem.querySelector('a');
                    if (link) {
                        this.resources.forEach(r => {
                            if (r.url === link.href) {
                                this.toggleBookmark('resource_' + r.id, removeBookmarkBtn);
                            }
                        });
                    }
                }
            }
        });

        // Настройки - кнопки
        document.addEventListener('click', (e) => {
            const saveBtn = e.target.closest('.save-settings-btn');
            if (saveBtn) {
                e.preventDefault();
                this.saveSettings();
            }

            const clearBtn = e.target.closest('.clear-data-btn');
            if (clearBtn) {
                e.preventDefault();
                if (confirm('Вы уверены? Все данные будут удалены.')) {
                    this.clearUserData();
                }
            }
        });
    }

    filterResources(category) {
        const cards = document.querySelectorAll('.resource-card');
        
        // Обновляем активную кнопку фильтра
        document.querySelectorAll('[data-resource-cat]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.resourceCat === category);
        });

        cards.forEach(card => {
            if (!category || card.dataset.category === category) {
                card.style.display = '';
            } else {
                card.style.display = 'none';
            }
        });
    }

    // ===== Избранное =====
    isFavorite(articleId) {
        return Array.isArray(this.favorites) && this.favorites.includes(articleId);
    }

    toggleFavorite(articleId) {
        if (!Array.isArray(this.favorites)) {
            this.favorites = [];
        }
        
        const index = this.favorites.indexOf(articleId);
        
        if (index > -1) {
            this.favorites.splice(index, 1);
            this.showToast('Удалено из избранного');
        } else {
            this.favorites.push(articleId);
            this.showToast('Добавлено в избранное ❤️');
            
            if (this.favorites.length === 1) {
                this.unlockAchievement('first_fav');
            }
        }

        localStorage.setItem('itclan_favorites', JSON.stringify(this.favorites));
        
        // Обновляем ВСЕ кнопки и карточки на странице
        document.querySelectorAll('.favorite-toggle-btn').forEach(button => {
            const id = parseInt(button.dataset.favId);
            if (!isNaN(id)) {
                const isFav = this.isFavorite(id);
                button.classList.toggle('active', isFav);
                button.innerHTML = isFav ? '❤️' : '🤍';
                button.title = isFav ? 'Удалить из избранного' : 'В избранное';
            }
        });

        document.querySelectorAll('.post-card').forEach(card => {
            const cardId = parseInt(card.dataset.articleId);
            if (!isNaN(cardId)) {
                const isFav = this.isFavorite(cardId);
                const btn = card.querySelector('.favorite-toggle-btn');
                if (btn) {
                    btn.classList.toggle('active', isFav);
                    btn.innerHTML = isFav ? '❤️' : '🤍';
                }
            }
        });

        const articleFavBtn = document.getElementById('articleFavBtn');
        if (articleFavBtn) {
            const isFav = this.isFavorite(articleId);
            articleFavBtn.classList.toggle('active', isFav);
            articleFavBtn.innerHTML = isFav ? '❤️ В избранном' : '🤍 В избранное';
        }

        // Обновляем боковую панель если открыта
        if (document.getElementById('favorites-sidebar').classList.contains('open')) {
            this.updateFavoritesSidebar();
        }

        this.updateFavoritesCount();
    }

    updateFavoritesCount() {
        const badge = document.getElementById('favorites-badge');
        if (badge) {
            badge.textContent = Array.isArray(this.favorites) ? this.favorites.length : 0;
        }
    }

    openFavoritesSidebar() {
        const sidebar = document.getElementById('favorites-sidebar');
        const overlay = document.getElementById('overlay');
        
        if (sidebar) {
            this.updateFavoritesSidebar();
            sidebar.classList.add('open');
        }
        if (overlay) {
            overlay.classList.add('visible');
        }
    }

    closeFavoritesSidebar() {
        const sidebar = document.getElementById('favorites-sidebar');
        const overlay = document.getElementById('overlay');
        
        if (sidebar) sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('visible');
    }

    updateFavoritesSidebar() {
        const list = document.getElementById('favoritesList');
        if (!list) return;

        const favArticles = this.posts.filter(p => this.isFavorite(p.id));

        if (favArticles.length === 0) {
            list.innerHTML = `
                <div class="empty-favorites">
                    <p style="font-size: 3rem; margin-bottom: 1rem;">💔</p>
                    <p>Избранное пусто</p>
                    <p style="font-size: 0.85rem; margin-top: 0.5rem;">Добавьте статьи, нажав ❤️</p>
                </div>
            `;
            return;
        }

        list.innerHTML = favArticles.map(post => `
            <div class="favorite-item" data-fav-id="${post.id}">
                <span class="favorite-item-emoji">${post.emoji || '📄'}</span>
                <div class="favorite-item-info">
                    <div class="favorite-item-title">${post.title}</div>
                    <div class="favorite-item-category">${post.category}</div>
                </div>
                <button class="favorite-remove" title="Удалить из избранного">×</button>
            </div>
        `).join('');
    }

    // ===== История чтения =====
    addToReadHistory(article) {
        const existingIndex = this.readHistory.findIndex(h => h.id === article.id);
        
        const historyEntry = {
            id: article.id,
            title: article.title,
            date: article.date,
            emoji: article.emoji,
            category: article.category,
            readTime: article.readTime,
            progress: this.readProgress[article.id] || 0
        };

        if (existingIndex > -1) {
            this.readHistory.splice(existingIndex, 1);
        }

        this.readHistory.unshift(historyEntry);
        
        // Ограничиваем историю 20 записями
        if (this.readHistory.length > 20) {
            this.readHistory = this.readHistory.slice(0, 20);
        }

        localStorage.setItem('itclan_readHistory', JSON.stringify(this.readHistory));

        // Проверка достижений
        if (this.getTotalReadCount() === 5) {
            this.unlockAchievement('reader_5');
        }
        if (this.getTotalReadCount() >= this.posts.length) {
            this.unlockAchievement('reader_all');
        }
        if (this.getUniqueCategoriesRead() >= 3) {
            this.unlockAchievement('explorer_3');
        }
    }

    // ===== Достижения =====
    unlockAchievement(achievementId) {
        const achievement = this.achievementsList.find(a => a.id === achievementId);
        if (achievement && !achievement.unlocked) {
            achievement.unlocked = true;
            
            // Сохраняем состояние достижений
            const saved = JSON.parse(localStorage.getItem('itclan_achievements') || '{}');
            saved[achievementId] = true;
            localStorage.setItem('itclan_achievements', JSON.stringify(saved));
            
            this.showToast(`🏆 Достижение: ${achievement.name}!`);
        }
    }

    // ===== Заметки =====
    saveNote(articleId) {
        const textarea = document.getElementById('articleNoteInput');
        if (!textarea) return;

        const note = textarea.value.trim();
        
        if (note.length === 0) {
            this.showToast('⚠️ Заметка пуста');
            return;
        }

        this.userNotes[articleId] = note;
        localStorage.setItem('itclan_userNotes', JSON.stringify(this.userNotes));

        // Показываем статус
        const status = textarea.parentElement.querySelector('.note-status');
        if (status) {
            status.textContent = '✅ Сохранено!';
            status.style.color = 'var(--success)';
            setTimeout(() => {
                status.textContent = '';
                status.style.color = '';
            }, 2000);
        }

        // Проверка достижения
        const noteKeys = Object.keys(this.userNotes);
        if (noteKeys.length === 1) {
            this.unlockAchievement('note_taker');
        }

        this.showToast('✏️ Заметка сохранена');
    }

    // ===== Настройки =====
    saveSettings() {
        const userNameInput = document.getElementById('settingsUserName');
        const usernameInput = document.getElementById('settingsUsername');
        const notificationsCheckbox = document.getElementById('settingsNotifications');

        if (userNameInput) this.settings.userName = userNameInput.value || '';
        if (usernameInput) this.settings.username = usernameInput.value || '';
        if (notificationsCheckbox) this.settings.notifications = notificationsCheckbox.checked;

        localStorage.setItem('itclan_settings', JSON.stringify(this.settings));
        
        // Обновляем отображение имени в профиле
        const profileNameEl = document.querySelector('.profile-name');
        if (profileNameEl && this.settings.userName) {
            profileNameEl.textContent = this.settings.userName;
        }
        
        this.showToast('✅ Настройки сохранены');
    }

    clearUserData() {
        if (!confirm('Вы уверены? Все данные будут удалены.')) return;

        localStorage.removeItem('itclan_favorites');
        localStorage.removeItem('itclan_readProgress');
        localStorage.removeItem('itclan_readHistory');
        localStorage.removeItem('itclan_userNotes');
        localStorage.removeItem('itclan_quizScores');
        localStorage.removeItem('itclan_bookmarks');
        localStorage.removeItem('itclan_settings');
        localStorage.removeItem('itclan_achievements');
        
        this.favorites = [];
        this.readProgress = {};
        this.readHistory = [];
        this.userNotes = {};
        this.quizScores = {};
        this.bookmarks = [];
        this.settings = { notifications: true, userName: '', username: '' };
        this.achievementsList.forEach(a => a.unlocked = a.id === 'first_read');

        this.updateFavoritesCount();
        this.showToast('🗑️ Все данные удалены');
        
        setTimeout(() => location.reload(), 1000);
    }

    // ===== Прогресс чтения (УЛУЧШЕННЫЙ) =====
    initReadingProgress() {
        const progressBar = document.getElementById('reading-progress');
        if (!progressBar) return;

        let scrollHandler = null;
        
        const updateProgress = () => {
            if (this.currentPage !== 'article' || !this.currentArticleId) {
                // Сбрасываем прогресс если не на статье
                progressBar.style.width = '0%';
                return;
            }

            const articleContent = document.getElementById('article-content');
            if (!articleContent) return;

            const rect = articleContent.getBoundingClientRect();
            const totalHeight = articleContent.scrollHeight;
            const viewportHeight = window.innerHeight;
            
            // Сколько пикселей статьи прошло за верхний край
            const scrolled = Math.max(0, -rect.top + 100); // 100px offset для header
            let progress = (scrolled / (totalHeight - viewportHeight)) * 100;
            progress = Math.min(100, Math.max(0, progress));

            progressBar.style.width = `${progress}%`;
            
            // Сохраняем прогресс только если мы на странице статьи
            if (this.currentPage === 'article' && this.currentArticleId) {
                const currentProgress = Math.round(progress);
                if (currentProgress > 5) {
                    this.readProgress[this.currentArticleId] = currentProgress;
                    localStorage.setItem('itclan_readProgress', JSON.stringify(this.readProgress));
                }
            }
        };

        scrollHandler = () => updateProgress();
        window.addEventListener('scroll', scrollHandler);
    }

    initArticleReadingProgress(articleId) {
        const progressBar = document.getElementById('reading-progress');
        if (!progressBar) return;

        const savedProgress = this.readProgress[articleId] || 0;
        progressBar.style.width = `${savedProgress}%`;
    }

    // ===== Кнопка "Наверх" =====
    initScrollTopButton() {
        const scrollBtn = document.querySelector('.scroll-top-btn');
        if (!scrollBtn) return;

        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                scrollBtn.classList.add('visible');
            } else {
                scrollBtn.classList.remove('visible');
            }
        });

        scrollBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // ===== Анимации при скролле =====
    animateOnScroll() {
        const elements = document.querySelectorAll('.slide-up');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, { threshold: 0.1 });

        elements.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });
    }

    // ===== Уведомления (Toast) =====
    showToast(message) {
        if (!this.settings.notifications && message.indexOf('🏆') === -1) return;

        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        container.appendChild(toast);

        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 3000);
    }

    // ===== Уведомление о новых статьях =====
    showNewArticlesNotification() {
        if (!this.settings.notifications) return;
        
        // Находим статьи, которые были добавлены после последнего посещения
        const newPosts = this.posts.filter(p => p.id > this.lastNewsToastPostId);
        
        if (newPosts.length > 0 && this.lastNewsToastPostId !== 0) {
            const newestNewPost = newPosts[newPosts.length - 1];
            this.showToast(`📢 Новая статья: ${newestNewPost.title}`);
            
            // Обновляем последний ID
            this.lastNewsToastPostId = Math.max(...this.posts.map(p => p.id));
            localStorage.setItem('itclan_lastNewsToastPostId', this.lastNewsToastPostId.toString());
        } else if (this.lastNewsToastPostId === 0) {
            // Первое посещение — показываем приветственное уведомление
            const newestPost = [...this.posts].sort((a, b) => this.getDateValue(b.date) - this.getDateValue(a.date))[0];
            if (newestPost) {
                setTimeout(() => {
                    this.showToast(`👋 Добро пожаловать! Новая статья: ${newestPost.title}`);
                    
                    // Обновляем последний ID
                    this.lastNewsToastPostId = Math.max(...this.posts.map(p => p.id));
                    localStorage.setItem('itclan_lastNewsToastPostId', this.lastNewsToastPostId.toString());
                }, 2000);
            }
        }
    }

    // ===== Canvas частицы =====
    initParticles() {
        const canvas = document.getElementById('particles-canvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        // Устанавливаем размер canvas
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        
        // Создаём частицы
        const particleCount = Math.min(80, Math.floor(window.innerWidth / 15));
        this.particles = [];
        
        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3,
                radius: Math.random() * 2 + 1,
                opacity: Math.random() * 0.4 + 0.1
            });
        }
        
        this.animateParticles(ctx, canvas);
    }

    animateParticles(ctx, canvas) {
        const isDark = this.theme === 'dark';
        const particleColor = isDark ? '139, 124, 247' : '108, 92, 231'; // accent color
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            
            // Обновляем позицию
            p.x += p.vx;
            p.y += p.vy;
            
            // Отскок от краёв
            if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
            
            // Ограничиваем в пределах canvas
            p.x = Math.max(0, Math.min(canvas.width, p.x));
            p.y = Math.max(0, Math.min(canvas.height, p.y));
            
            // Рисуем частицу
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${particleColor}, ${p.opacity})`;
            ctx.fill();
        }
        
        // Рисуем линии между близкими частицами
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const dx = this.particles[i].x - this.particles[j].x;
                const dy = this.particles[i].y - this.particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 150) {
                    ctx.beginPath();
                    ctx.moveTo(this.particles[i].x, this.particles[i].y);
                    ctx.lineTo(this.particles[j].x, this.particles[j].y);
                    
                    const opacity = (1 - distance / 150) * 0.15;
                    ctx.strokeStyle = `rgba(${particleColor}, ${opacity})`;
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }
        }
        
        // Взаимодействие с мышью — плавное отталкивание
        let nearestParticle = null;
        let minDistance = 180;
        
        for (const p of this.particles) {
            const dx = p.x - this.mouseX;
            const dy = p.y - this.mouseY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < minDistance) {
                minDistance = distance;
                nearestParticle = p;
            }
        }
        
        if (nearestParticle) {
            const dx = nearestParticle.x - this.mouseX;
            const dy = nearestParticle.y - this.mouseY;
            const force = (180 - minDistance) / 180;
            
            // Плавное замедление воздействия мыши
            nearestParticle.vx += dx * force * 0.005;
            nearestParticle.vy += dy * force * 0.005;
        }
        
        // Ограничение максимальной скорости частиц
        const maxSpeed = 0.6;
        for (const p of this.particles) {
            const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
            if (speed > maxSpeed) {
                p.vx = (p.vx / speed) * maxSpeed;
                p.vy = (p.vy / speed) * maxSpeed;
            }
            // Плавное затухание скорости
            p.vx *= 0.995;
            p.vy *= 0.995;
        }
        
        this.animationFrameId = requestAnimationFrame(() => this.animateParticles(ctx, canvas));
    }

    // ===== Остановка частиц =====
    stopParticles() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    // ===== Утилиты =====
    getCategories() {
        return [...new Set(this.posts.map(p => p.category))];
    }

    formatDate(dateStr) {
        if (typeof dateStr === 'string' && /\d+\s+\w+\s+\d{4}/.test(dateStr)) {
            return dateStr;
        }
        const date = new Date(dateStr);
        const months = [
            'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
            'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
        ];
        return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    }

    getReadTimeText(post) {
        if (typeof post.readTime === 'number') {
            return `${post.readTime} мин`;
        }
        const match = String(post.readTime).match(/(\d+)/);
        return match ? `${match[1]} мин` : 'мин';
    }

    getArticleWord(count) {
        if (count === 1) {
            const lastDigit = count % 10;
            if (lastDigit === 1) return 'статья';
        }
        const lastDigit = count % 10;
        const lastTwoDigits = count % 100;
        
        if (lastTwoDigits >= 11 && lastTwoDigits <= 19) return 'статей';
        if (lastDigit === 1) return 'статья';
        if (lastDigit >= 2 && lastDigit <= 4) return 'статьи';
        return 'статей';
    }

    toggleSearchClear(visible) {
        const clearBtn = document.getElementById('searchClear');
        if (!clearBtn) return;
        
        clearBtn.classList.toggle('visible', visible);
    }

    getDateValue(dateStr) {
        if (typeof dateStr === 'string' && /\d+\s+\w+\s+\d{4}/.test(dateStr)) {
            const months = {
                'января': 0, 'февраля': 1, 'марта': 2, 'апреля': 3, 'мая': 4, 'июня': 5,
                'июля': 6, 'августа': 7, 'сентября': 8, 'октября': 9, 'ноября': 10, 'декабря': 11
            };
            const match = dateStr.match(/(\d+)\s+(\w+)\s+(\d{4})/);
            if (match) {
                return new Date(match[3], months[match[2]] || 0, match[1]).getTime();
            }
        }
        return new Date(dateStr).getTime();
    }

    getProfileEmoji() {
        const unlocked = this.achievementsList.filter(a => a.unlocked).length;
        if (unlocked >= 8) return '👑';
        if (unlocked >= 6) return '🌟';
        if (unlocked >= 4) return '💪';
        if (unlocked >= 2) return '😊';
        return '👤';
    }
}

// ===== Инициализация приложения =====
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new BlogApp();
});