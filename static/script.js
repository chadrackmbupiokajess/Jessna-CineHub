document.addEventListener('DOMContentLoaded', () => {
    const movieOverlay = document.getElementById('movie-overlay');
    const closeOverlayBtn = document.querySelector('.close-overlay');

    const overlayTitle = document.getElementById('overlay-title');
    const overlayOverview = document.getElementById('overlay-overview');
    const overlayPoster = document.getElementById('overlay-poster');
    const overlayTrailerBtn = document.getElementById('overlay-trailer-btn');

    // --- Event Listeners ---

    document.querySelector('.movies-grid').addEventListener('click', (event) => {
        const card = event.target.closest('.movie-card');
        if (!card) return;
        
        // The trailer button on the card is now handled by the overlay
        openMovieOverlay(card.dataset);
    });

    closeOverlayBtn.addEventListener('click', closeMovieOverlay);
    movieOverlay.addEventListener('click', (event) => {
        if (event.target === movieOverlay) closeMovieOverlay();
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && movieOverlay.style.display !== 'none') {
            closeMovieOverlay();
        }
    });

    // --- Functions ---

    async function openMovieOverlay(dataset) {
        // 1. Populate overlay with initial data (fast)
        overlayTitle.textContent = dataset.title;
        overlayOverview.textContent = dataset.overview;
        overlayPoster.src = dataset.posterUrl;
        
        // 2. Show the overlay immediately
        movieOverlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        // 3. Show a loading state for the trailer button
        overlayTrailerBtn.style.display = 'inline-block';
        overlayTrailerBtn.textContent = 'Chargement...';
        overlayTrailerBtn.href = '#';
        overlayTrailerBtn.onclick = (e) => e.preventDefault(); // Disable click while loading

        // 4. Fetch the trailer URL from our new API endpoint
        try {
            const response = await fetch(`/trailer/${dataset.id}/`);
            const data = await response.json();

            if (data.trailer_url) {
                overlayTrailerBtn.textContent = '🎬 Voir la bande-annonce';
                overlayTrailerBtn.href = data.trailer_url;
                overlayTrailerBtn.onclick = null; // Remove the disabled click handler
            } else {
                overlayTrailerBtn.textContent = 'Bande-annonce indisponible';
                overlayTrailerBtn.classList.add('disabled');
            }
        } catch (error) {
            console.error('Failed to fetch trailer:', error);
            overlayTrailerBtn.textContent = 'Erreur de chargement';
            overlayTrailerBtn.classList.add('disabled');
        }
    }

    function closeMovieOverlay() {
        movieOverlay.style.display = 'none';
        document.body.style.overflow = 'auto';
        // Reset trailer button for next time
        overlayTrailerBtn.textContent = '🎬 Voir la bande-annonce';
        overlayTrailerBtn.classList.remove('disabled');
        overlayTrailerBtn.href = '#';
    }
});
