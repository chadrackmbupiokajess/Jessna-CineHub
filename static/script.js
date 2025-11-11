document.addEventListener('DOMContentLoaded', () => {
    // --- Element Selectors ---
    const moviesGrid = document.querySelector('.movies-grid');
    
    // Movie Details Overlay
    const movieOverlay = document.getElementById('movie-overlay');
    const closeMovieOverlayBtn = movieOverlay.querySelector('.close-overlay');
    const overlayTitle = document.getElementById('overlay-title');
    const overlayOverview = document.getElementById('overlay-overview');
    const overlayPoster = document.getElementById('overlay-poster');
    const overlayTrailerBtn = document.getElementById('overlay-trailer-btn');

    // Trailer Video Overlay
    const trailerOverlay = document.getElementById('trailer-overlay');
    const closeTrailerOverlayBtn = trailerOverlay.querySelector('.close-overlay');
    const trailerIframe = document.getElementById('trailer-iframe');
    const youtubeFallbackLink = document.getElementById('youtube-fallback-link');

    let currentTrailerUrls = null;

    // --- Event Listeners ---

    moviesGrid.addEventListener('click', (event) => {
        const card = event.target.closest('.movie-card');
        if (card) openMovieOverlay(card.dataset);
    });

    overlayTrailerBtn.addEventListener('click', () => {
        if (currentTrailerUrls) openTrailerOverlay(currentTrailerUrls);
    });

    // Use event delegation for all close buttons
    document.body.addEventListener('click', (event) => {
        if (event.target.matches('.close-overlay') || event.target.matches('.quit-btn')) {
            const modalToClose = event.target.dataset.close;
            if (modalToClose === 'movie-overlay') {
                closeMovieOverlay();
            } else if (modalToClose === 'trailer-overlay') {
                closeTrailerOverlay();
            }
        }
    });

    movieOverlay.addEventListener('click', (event) => {
        if (event.target === movieOverlay) closeMovieOverlay();
    });

    trailerOverlay.addEventListener('click', (event) => {
        if (event.target === trailerOverlay) closeTrailerOverlay();
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            if (trailerOverlay.style.display === 'flex') closeTrailerOverlay();
            else if (movieOverlay.style.display === 'flex') closeMovieOverlay();
        }
    });

    // --- Functions ---

    async function openMovieOverlay(dataset) {
        overlayTitle.textContent = dataset.title;
        overlayOverview.textContent = dataset.overview;
        overlayPoster.src = dataset.posterUrl;
        
        movieOverlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        overlayTrailerBtn.textContent = 'Chargement...';
        overlayTrailerBtn.disabled = true;
        currentTrailerUrls = null;

        try {
            const response = await fetch(`/trailer/${dataset.id}/`);
            if (!response.ok) throw new Error('Network response was not ok');
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
        embedUrl.searchParams.set('modestbranding', '1');
        embedUrl.searchParams.set('origin', window.location.origin);
        
        trailerIframe.src = embedUrl.toString();
        youtubeFallbackLink.href = urls.watch_url;
        youtubeFallbackLink.style.display = 'block';

        trailerOverlay.style.display = 'flex';
        movieOverlay.style.display = 'none';
    }

    function closeTrailerOverlay() {
        trailerIframe.src = "";
        youtubeFallbackLink.style.display = 'none';
        trailerOverlay.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
});
