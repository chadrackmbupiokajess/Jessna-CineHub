document.addEventListener('DOMContentLoaded', () => {
    // --- Element Selectors ---
    const moviesGrid = document.getElementById('movies-grid');
    const infiniteScrollLoader = document.getElementById('infinite-scroll-loader');
    
    // Movie Details Overlay
    const movieOverlay = document.getElementById('movie-overlay');
    const overlayTitle = document.getElementById('overlay-title');
    const overlayOverview = document.getElementById('overlay-overview');
    const overlayPoster = document.getElementById('overlay-poster');
    const overlayTrailerBtn = document.getElementById('overlay-trailer-btn');

    // Trailer Video Overlay
    const trailerOverlay = document.getElementById('trailer-overlay');
    const trailerIframe = document.getElementById('trailer-iframe');
    const youtubeWatchBtn = document.getElementById('youtube-watch-btn');

    // --- Data Storage ---
    const moviesDataElement = document.getElementById('movies-data');
    let allMovies = moviesDataElement ? JSON.parse(moviesDataElement.textContent) : [];
    let currentTrailerUrls = null;
    let currentMovieId = null;
    
    // --- State ---
    let currentPage = window.paginationData.currentPage;
    const totalPages = window.paginationData.totalPages;
    const query = window.paginationData.query;
    let isLoading = false;

    // --- Event Listeners ---

    moviesGrid.addEventListener('click', (event) => {
        const card = event.target.closest('.movie-card');
        if (card) {
            currentMovieId = parseInt(card.dataset.id);
            const movie = allMovies.find(m => m.id === currentMovieId);
            if (movie) openMovieOverlay(movie);
        }
    });

    overlayTrailerBtn.addEventListener('click', () => {
        if (currentTrailerUrls) openTrailerOverlay(currentTrailerUrls);
    });

    document.body.addEventListener('click', (event) => {
        const target = event.target;
        if (target.matches('.close-overlay') || target.matches('.quit-btn')) {
            const modalToClose = target.dataset.close;
            if (modalToClose === 'movie-overlay') closeMovieOverlay();
            else if (modalToClose === 'trailer-overlay') closeTrailerOverlay();
        }
    });

    [movieOverlay, trailerOverlay].forEach(overlay => {
        overlay.addEventListener('click', (event) => {
            if (event.target === overlay) {
                const modalToClose = overlay.id.replace('-overlay', '');
                if (modalToClose === 'movie') closeMovieOverlay();
                else if (modalToClose === 'trailer') closeTrailerOverlay();
            }
        });
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            if (trailerOverlay.style.display === 'flex') closeTrailerOverlay();
            else if (movieOverlay.style.display === 'flex') closeMovieOverlay();
        }
    });

    window.addEventListener('scroll', () => {
        if (isLoading || currentPage >= totalPages) return;
        const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
        if (scrollTop + clientHeight >= scrollHeight - 100) loadMoreMovies();
    });

    // --- Functions ---

    async function loadMoreMovies() {
        isLoading = true;
        infiniteScrollLoader.style.display = 'flex';
        const nextPage = currentPage + 1;
        const url = `/load-more-movies/?page=${nextPage}&query=${encodeURIComponent(query)}`;

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();

            if (data.movies_html) {
                moviesGrid.insertAdjacentHTML('beforeend', data.movies_html);
                allMovies = allMovies.concat(data.new_movies_data);
                currentPage = nextPage;
            }
            if (!data.has_next) currentPage = totalPages;
        } catch (error) {
            console.error('Failed to load more movies:', error);
        } finally {
            isLoading = false;
            infiniteScrollLoader.style.display = 'none';
        }
    }

    async function openMovieOverlay(movie) {
        overlayTitle.textContent = movie.title;
        overlayOverview.textContent = movie.overview;
        overlayPoster.src = movie.poster_url;
        
        movieOverlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        overlayTrailerBtn.textContent = 'Chargement...';
        overlayTrailerBtn.disabled = true;
        overlayTrailerBtn.classList.add('is-loading');
        currentTrailerUrls = null;

        try {
            const response = await fetch(`/trailer/${movie.id}/`);
            if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
            const data = await response.json();

            if (data.embed_url && data.watch_url) {
                currentTrailerUrls = data;
                overlayTrailerBtn.textContent = '🎬 Voir la bande-annonce';
                overlayTrailerBtn.disabled = false;
            } else {
                overlayTrailerBtn.textContent = 'Bande-annonce indisponible';
            }
        } catch (error) {
            console.error('Failed to fetch trailer:', error);
            overlayTrailerBtn.textContent = 'Erreur de chargement';
        } finally {
            overlayTrailerBtn.classList.remove('is-loading');
        }
    }

    function closeMovieOverlay() {
        movieOverlay.style.display = 'none';
        if (trailerOverlay.style.display !== 'flex') {
            document.body.style.overflow = 'auto';
        }
    }

    function openTrailerOverlay(urls) {
        const embedUrl = new URL(urls.embed_url);
        embedUrl.searchParams.set('autoplay', '1');
        embedUrl.searchParams.set('rel', '0');
        
        trailerIframe.src = embedUrl.toString();
        youtubeWatchBtn.href = urls.watch_url;

        trailerOverlay.style.display = 'flex';
        movieOverlay.style.display = 'none';
    }

    function closeTrailerOverlay() {
        trailerIframe.src = "";
        trailerOverlay.style.display = 'none';
        if (movieOverlay.style.display !== 'flex') {
            document.body.style.overflow = 'auto';
        }
    }
});
