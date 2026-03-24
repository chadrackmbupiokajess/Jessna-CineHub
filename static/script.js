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
    const overlayWatchBtn = document.getElementById('overlay-watch-btn');

    // Trailer Video Overlay
    const trailerOverlay = document.getElementById('trailer-overlay');
    const trailerIframe = document.getElementById('trailer-iframe');
    const youtubeWatchBtn = document.getElementById('youtube-watch-btn');
    const backToDetailsBtn = document.getElementById('back-to-details-btn');

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

    if (moviesGrid) {
        moviesGrid.addEventListener('click', (event) => {
            const card = event.target.closest('.movie-card');
            if (card) {
                currentMovieId = parseInt(card.dataset.id);
                const movie = allMovies.find(m => m.id === currentMovieId);
                if (movie) openMovieOverlay(movie);
            }
        });
    }

    if (overlayTrailerBtn) {
        overlayTrailerBtn.addEventListener('click', () => {
            if (currentTrailerUrls && currentTrailerUrls.embed_url) {
                 openVideoOverlay(currentTrailerUrls.embed_url, currentTrailerUrls.watch_url, true);
            }
        });
    }

    if (overlayWatchBtn) {
        overlayWatchBtn.addEventListener('click', () => {
            console.log("Watch button clicked!", currentTrailerUrls);
            if (currentTrailerUrls && currentTrailerUrls.full_movie_embed) {
                 openVideoOverlay(currentTrailerUrls.full_movie_embed, null, false);
            } else {
                console.error("No full movie URL available");
                alert("Lien du film non disponible pour le moment.");
            }
        });
    }

    if (backToDetailsBtn) {
        backToDetailsBtn.addEventListener('click', () => {
             closeTrailerOverlay();
             if (currentMovieId) {
                 const movie = allMovies.find(m => m.id === currentMovieId);
                 if (movie) {
                     // Re-open movie details overlay
                     movieOverlay.style.display = 'flex';
                     // We don't need to fetch data again as it should be cached in currentTrailerUrls
                     // or we can just rely on the fact that the overlay content hasn't been cleared
                 }
             }
        });
    }

    document.body.addEventListener('click', (event) => {
        const target = event.target;
        if (target.matches('.close-overlay') || target.matches('.quit-btn')) {
            const modalToClose = target.dataset.close;
            if (modalToClose === 'movie-overlay') closeMovieOverlay();
            else if (modalToClose === 'trailer-overlay') closeTrailerOverlay();
        }
    });

    [movieOverlay, trailerOverlay].forEach(overlay => {
        if (overlay) {
            overlay.addEventListener('click', (event) => {
                if (event.target === overlay) {
                    const modalToClose = overlay.id.replace('-overlay', '');
                    if (modalToClose === 'movie') closeMovieOverlay();
                    else if (modalToClose === 'trailer') closeTrailerOverlay();
                }
            });
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            if (trailerOverlay && trailerOverlay.style.display === 'flex') closeTrailerOverlay();
            else if (movieOverlay && movieOverlay.style.display === 'flex') closeMovieOverlay();
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
        if (infiniteScrollLoader) infiniteScrollLoader.style.display = 'flex';
        const nextPage = currentPage + 1;
        const url = `/load-more-movies/?page=${nextPage}&query=${encodeURIComponent(query)}`;

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();

            if (data.movies_html && moviesGrid) {
                moviesGrid.insertAdjacentHTML('beforeend', data.movies_html);
                allMovies = allMovies.concat(data.new_movies_data);
                currentPage = nextPage;
            }
            if (!data.has_next) currentPage = totalPages;
        } catch (error) {
            console.error('Failed to load more movies:', error);
        } finally {
            isLoading = false;
            if (infiniteScrollLoader) infiniteScrollLoader.style.display = 'none';
        }
    }

    async function openMovieOverlay(movie) {
        if (!movieOverlay) return;

        if (overlayTitle) overlayTitle.textContent = movie.title;
        if (overlayOverview) overlayOverview.textContent = movie.overview;
        if (overlayPoster) overlayPoster.src = movie.poster_url;

        movieOverlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        if (overlayTrailerBtn) {
            overlayTrailerBtn.textContent = 'Chargement...';
            overlayTrailerBtn.disabled = true;
            overlayTrailerBtn.classList.add('is-loading');
        }

        if (overlayWatchBtn) {
            overlayWatchBtn.textContent = 'Chargement...';
            overlayWatchBtn.disabled = true;
        }

        currentTrailerUrls = null;

        try {
            const response = await fetch(`/trailer/${movie.id}/`);
            if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
            const data = await response.json();
            currentTrailerUrls = data;
            console.log("Movie data loaded:", currentTrailerUrls);

            // Handle Trailer Button
            if (overlayTrailerBtn) {
                if (data.embed_url) {
                    overlayTrailerBtn.textContent = '🎬 Bande-annonce';
                    overlayTrailerBtn.disabled = false;
                } else {
                    overlayTrailerBtn.textContent = 'Bande-annonce indisponible';
                    overlayTrailerBtn.disabled = true;
                }
            }

            // Handle Watch Movie Button (always available via ID)
            if (overlayWatchBtn) {
                if (data.full_movie_embed) {
                    overlayWatchBtn.textContent = '🍿 Voir le film';
                    overlayWatchBtn.disabled = false;
                } else {
                     overlayWatchBtn.textContent = 'Film indisponible';
                     overlayWatchBtn.disabled = true;
                }
            }


        } catch (error) {
            console.error('Failed to fetch trailer:', error);
            if (overlayTrailerBtn) overlayTrailerBtn.textContent = 'Erreur';
            if (overlayWatchBtn) overlayWatchBtn.textContent = 'Erreur';
        } finally {
            if (overlayTrailerBtn) overlayTrailerBtn.classList.remove('is-loading');
        }
    }

    function closeMovieOverlay() {
        if (movieOverlay) movieOverlay.style.display = 'none';
        if (trailerOverlay && trailerOverlay.style.display !== 'flex') {
            document.body.style.overflow = 'auto';
        }
    }

    function openVideoOverlay(embedUrl, watchUrl, isYoutube) {
        console.log("Opening video overlay with URL:", embedUrl);
        if (!trailerIframe || !trailerOverlay) return;

        try {
            const urlObj = new URL(embedUrl);
            if (isYoutube) {
                 urlObj.searchParams.set('autoplay', '1');
                 urlObj.searchParams.set('rel', '0');
            }
            trailerIframe.src = urlObj.toString();
        } catch (e) {
             trailerIframe.src = embedUrl;
        }

        if (youtubeWatchBtn) {
            if (isYoutube && watchUrl) {
                youtubeWatchBtn.href = watchUrl;
                youtubeWatchBtn.style.display = 'inline-block';
            } else {
                youtubeWatchBtn.style.display = 'none';
            }
        }

        // Close the details overlay before opening the trailer overlay
        if (movieOverlay) movieOverlay.style.display = 'none';
        
        trailerOverlay.style.display = 'flex';
    }

    function closeTrailerOverlay() {
        if (trailerIframe) trailerIframe.src = "";
        if (trailerOverlay) trailerOverlay.style.display = 'none';
        // Note: We don't restore body overflow here because we might be going back to movieOverlay
        // The back button logic handles re-opening movieOverlay.
        // If we just close completely, the user will be back on the grid, and we need to restore scroll.
        if (movieOverlay && movieOverlay.style.display !== 'flex') {
             document.body.style.overflow = 'auto';
        }
    }
});
