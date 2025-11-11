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
    const overlayFullVideoBtn = document.getElementById('overlay-full-video-btn');

    // Trailer Video Overlay
    const trailerOverlay = document.getElementById('trailer-overlay');
    const trailerIframe = document.getElementById('trailer-iframe');
    const youtubeWatchBtn = document.getElementById('youtube-watch-btn');

    // Providers Overlay
    const providersOverlay = document.getElementById('providers-overlay');
    const providersList = document.getElementById('providers-list');

    // --- Data Storage ---
    const moviesDataElement = document.getElementById('movies-data');
    let allMovies = moviesDataElement ? JSON.parse(moviesDataElement.textContent) : [];
    let currentTrailerUrls = null;
    let currentMovieId = null;
    
    // --- Infinite Scroll State ---
    let currentPage = window.paginationData.currentPage;
    const totalPages = window.paginationData.totalPages;
    const query = window.paginationData.query;
    let isLoading = false;

    // --- Event Listeners ---

    moviesGrid.addEventListener('click', (event) => {
        const card = event.target.closest('.movie-card');
        if (card) {
            const movieId = parseInt(card.dataset.id);
            currentMovieId = movieId;
            const movie = allMovies.find(m => m.id === movieId);
            if (movie) openMovieOverlay(movie);
        }
    });

    overlayTrailerBtn.addEventListener('click', () => {
        if (currentTrailerUrls) openTrailerOverlay(currentTrailerUrls);
    });

    overlayFullVideoBtn.addEventListener('click', () => {
        if (currentMovieId) openProvidersOverlay();
    });

    document.body.addEventListener('click', (event) => {
        if (event.target.matches('.close-overlay') || event.target.matches('.quit-btn')) {
            const modalToClose = event.target.dataset.close;
            if (modalToClose === 'movie-overlay') closeMovieOverlay();
            else if (modalToClose === 'trailer-overlay') closeTrailerOverlay();
            else if (modalToClose === 'providers-overlay') closeProvidersOverlay();
        }
    });

    movieOverlay.addEventListener('click', (event) => {
        if (event.target === movieOverlay) closeMovieOverlay();
    });

    trailerOverlay.addEventListener('click', (event) => {
        if (event.target === trailerOverlay) closeTrailerOverlay();
    });

    providersOverlay.addEventListener('click', (event) => {
        if (event.target === providersOverlay) closeProvidersOverlay();
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            if (providersOverlay.style.display === 'flex') closeProvidersOverlay();
            else if (trailerOverlay.style.display === 'flex') closeTrailerOverlay();
            else if (movieOverlay.style.display === 'flex') closeMovieOverlay();
        }
    });

    // Infinite Scroll Listener
    window.addEventListener('scroll', () => {
        if (isLoading || currentPage >= totalPages) return;

        const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
        if (scrollTop + clientHeight >= scrollHeight - 100) {
            loadMoreMovies();
        }
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

            if (!data.has_next) {
                currentPage = totalPages;
            }

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
        overlayFullVideoBtn.disabled = true;
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

        // Enable the full video button regardless of the trailer status
        overlayFullVideoBtn.disabled = false;
    }

    function closeMovieOverlay() {
        movieOverlay.style.display = 'none';
        if (trailerOverlay.style.display !== 'flex' && providersOverlay.style.display !== 'flex') {
            document.body.style.overflow = 'auto';
        }
        overlayTrailerBtn.textContent = '🎬 Voir la bande-annonce';
        overlayTrailerBtn.disabled = false;
        overlayTrailerBtn.classList.remove('is-loading');
    }

    function openTrailerOverlay(urls) {
        const embedUrl = new URL(urls.embed_url);
        embedUrl.searchParams.set('autoplay', '1');
        embedUrl.searchParams.set('rel', '0');
        embedUrl.searchParams.set('modestbranding', '1');
        embedUrl.searchParams.set('origin', window.location.origin);
        
        trailerIframe.src = embedUrl.toString();
        youtubeWatchBtn.href = urls.watch_url;

        trailerOverlay.style.display = 'flex';
        movieOverlay.style.display = 'none';
    }

    function closeTrailerOverlay() {
        trailerIframe.src = "";
        trailerOverlay.style.display = 'none';
        if (movieOverlay.style.display !== 'flex' && providersOverlay.style.display !== 'flex') {
            document.body.style.overflow = 'auto';
        }
    }

    async function openProvidersOverlay() {
        providersList.innerHTML = '<div class="loader-spinner"></div>';
        providersOverlay.style.display = 'flex';
        movieOverlay.style.display = 'none';
        document.body.style.overflow = 'hidden';

        try {
            const response = await fetch(`/movie-providers/${currentMovieId}/`);
            if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
            const data = await response.json();

            providersList.innerHTML = ''; // Clear spinner

            const frProviders = data.results?.FR;
            if (frProviders && frProviders.link) {
                const providersHtml = [];
                
                const createProviderSection = (title, providers) => {
                    if (providers && providers.length > 0) {
                        providersHtml.push(`<h4>${title}</h4>`);
                        providers.forEach(p => {
                            providersHtml.push(`
                                <a href="${frProviders.link}" target="_blank" rel="noopener noreferrer" class="provider-item">
                                    <img src="https://image.tmdb.org/t/p/w200${p.logo_path}" alt="${p.provider_name}" class="provider-logo">
                                    <span class="provider-name">${p.provider_name}</span>
                                </a>
                            `);
                        });
                    }
                };

                createProviderSection('Streaming', frProviders.flatrate);
                createProviderSection('Acheter', frProviders.buy);
                createProviderSection('Louer', frProviders.rent);

                if (providersHtml.length > 0) {
                    providersList.innerHTML = providersHtml.join('');
                } else {
                    providersList.innerHTML = '<p>Aucun service de streaming, d\'achat ou de location n\'a été trouvé en France.</p>';
                }
            } else {
                providersList.innerHTML = '<p>Aucune information de visionnage disponible pour ce film en France.</p>';
            }
        } catch (error) {
            console.error('Failed to fetch movie providers:', error);
            providersList.innerHTML = '<p>Erreur lors de la récupération des informations. Veuillez réessayer.</p>';
        }
    }

    function closeProvidersOverlay() {
        providersOverlay.style.display = 'none';
        if (movieOverlay.style.display !== 'flex' && trailerOverlay.style.display !== 'flex') {
            document.body.style.overflow = 'auto';
        }
    }
});
