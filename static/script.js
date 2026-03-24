document.addEventListener('DOMContentLoaded', () => {
    // --- Mobile Menu Logic ---
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const navLinks = document.getElementById('nav-links');

    if (mobileMenuToggle && navLinks) {
        mobileMenuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            // Change icon from bars to times (X)
            const icon = mobileMenuToggle.querySelector('i');
            if (icon) {
                if (navLinks.classList.contains('active')) {
                    icon.classList.remove('fa-bars');
                    icon.classList.add('fa-times');
                } else {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            }
        });

        // Close menu when clicking outside
        document.addEventListener('click', (event) => {
            if (!navLinks.contains(event.target) && !mobileMenuToggle.contains(event.target) && navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                const icon = mobileMenuToggle.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            }
        });
    }

    // --- Element Selectors ---
    const moviesGrid = document.querySelector('.movies-grid');
    const infiniteScrollLoader = document.getElementById('infinite-scroll-loader');
    
    // Movie Details Overlay
    const movieOverlay = document.getElementById('movie-overlay');
    const overlayTitle = document.getElementById('overlay-title');
    const overlayOverview = document.getElementById('overlay-overview');
    const overlayPoster = document.getElementById('overlay-poster');
    
    const movieActions = document.getElementById('movie-actions');
    const overlayTrailerBtn = document.getElementById('overlay-trailer-btn');
    const overlayWatchBtn = document.getElementById('overlay-watch-btn');

    // TV Show Specific Elements
    const tvShowDetails = document.getElementById('tv-show-details');
    const seasonSelect = document.getElementById('season-select');
    const episodesList = document.getElementById('episodes-list');

    // Trailer Video Overlay
    const trailerOverlay = document.getElementById('trailer-overlay');
    const trailerIframe = document.getElementById('trailer-iframe');
    const youtubeWatchBtn = document.getElementById('youtube-watch-btn');
    const backToDetailsBtn = document.getElementById('back-to-details-btn');

    // --- Data Storage ---
    const moviesDataElement = document.getElementById('movies-data');
    let allMovies = moviesDataElement ? JSON.parse(moviesDataElement.textContent) : [];
    let currentTrailerUrls = null;
    let currentMovie = null;

    // --- State ---
    let currentPage = window.paginationData ? window.paginationData.currentPage : 1;
    const totalPages = window.paginationData ? window.paginationData.totalPages : 1;
    const query = window.paginationData ? window.paginationData.query : "";
    const category = window.paginationData ? window.paginationData.category : "all";
    let isLoading = false;

    // --- Event Listeners ---

    if (moviesGrid) {
        moviesGrid.addEventListener('click', (event) => {
            const card = event.target.closest('.movie-card');
            if (card) {
                const movieId = parseInt(card.dataset.id);
                // Try to find movie in local data
                currentMovie = allMovies.find(m => m.id === movieId);
                
                // Fallback: create object from DOM data if not found in JS array
                if (!currentMovie) {
                     currentMovie = {
                         id: movieId,
                         title: card.querySelector('h2').textContent,
                         poster_url: card.querySelector('img').src,
                         overview: card.querySelector('.short-overview').textContent,
                         media_type: card.dataset.mediaType
                     };
                }
                
                if (currentMovie) openMovieOverlay(currentMovie);
            }
        });
    }

    if (overlayTrailerBtn) {
        overlayTrailerBtn.addEventListener('click', () => {
             if (currentTrailerUrls && currentTrailerUrls.embed_url) {
                 openVideoOverlay(currentTrailerUrls.embed_url, currentTrailerUrls.watch_url, true);
            } else {
                 alert("Bande-annonce non disponible");
            }
        });
    }

    if (overlayWatchBtn) {
        overlayWatchBtn.addEventListener('click', () => {
            if (currentTrailerUrls && currentTrailerUrls.full_movie_embed) {
                 openVideoOverlay(currentTrailerUrls.full_movie_embed, null, false);
            } else {
                alert("Lien du film non disponible pour le moment.");
            }
        });
    }

    if (seasonSelect) {
        seasonSelect.addEventListener('change', (e) => {
            const seasonNumber = e.target.value;
            if (currentMovie && seasonNumber) {
                loadEpisodes(currentMovie.id, seasonNumber);
            }
        });
    }
    
    // Close overlay buttons
    document.querySelectorAll('[data-close]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetId = e.target.dataset.close;
            const targetOverlay = document.getElementById(targetId);
            if(targetOverlay) {
                if(targetId === 'trailer-overlay') closeTrailerOverlay();
                else closeMovieOverlay();
            }
        });
    });
    
    // Back button in trailer overlay
    if (backToDetailsBtn) {
        backToDetailsBtn.addEventListener('click', () => {
             closeTrailerOverlay();
             // Re-open details if we have a movie
             if (currentMovie && movieOverlay) {
                 movieOverlay.style.display = 'flex';
             }
        });
    }

    // Close on click outside
    window.addEventListener('click', (event) => {
        if (event.target === movieOverlay) closeMovieOverlay();
        if (event.target === trailerOverlay) closeTrailerOverlay();
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            if (trailerOverlay && trailerOverlay.style.display === 'flex') closeTrailerOverlay();
            else if (movieOverlay && movieOverlay.style.display === 'flex') closeMovieOverlay();
        }
    });

    // Infinite Scroll
    window.addEventListener('scroll', () => {
        if (isLoading || currentPage >= totalPages) return;
        
        // Load more when near bottom
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 500) {
            loadMoreMovies();
        }
    });

    // --- Functions ---

    async function loadMoreMovies() {
        if (isLoading) return;
        isLoading = true;
        
        if (infiniteScrollLoader) infiniteScrollLoader.style.display = 'flex';
        
        const nextPage = currentPage + 1;
        const url = `/load-more-movies/?page=${nextPage}&query=${encodeURIComponent(query)}&category=${encodeURIComponent(category)}`;

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();

            if (data.movies_html && moviesGrid) {
                moviesGrid.insertAdjacentHTML('beforeend', data.movies_html);
                
                // Update local data
                if (data.new_movies_data) {
                    allMovies = allMovies.concat(data.new_movies_data);
                }
                
                currentPage = nextPage;
                
                if (!data.has_next) {
                    currentPage = totalPages + 1;
                }
            }
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
        
        // Reset and check Media Type
        const mediaType = movie.media_type || 'movie';

        if (mediaType === 'tv') {
            // TV Show Logic
            if (movieActions) movieActions.style.display = 'none';
            if (tvShowDetails) {
                tvShowDetails.style.display = 'block';
                loadSeasons(movie.id);
            }
        } else {
            // Movie Logic
            if (tvShowDetails) tvShowDetails.style.display = 'none';
            if (movieActions) movieActions.style.display = 'flex';
            
            // Reset buttons state
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
                const fetchUrl = `/trailer/${movie.id}/?media_type=movie`;
                const response = await fetch(fetchUrl);
                if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
                const data = await response.json();
                currentTrailerUrls = data;

                if (overlayTrailerBtn) {
                    overlayTrailerBtn.classList.remove('is-loading');
                    if (data.embed_url) {
                        overlayTrailerBtn.textContent = '🎬 Bande-annonce';
                        overlayTrailerBtn.disabled = false;
                    } else {
                        overlayTrailerBtn.textContent = 'Bande-annonce indisponible';
                        overlayTrailerBtn.disabled = true;
                    }
                }
                
                if (overlayWatchBtn) {
                    if (data.full_movie_embed) {
                        overlayWatchBtn.textContent = '🍿 Voir le film';
                        overlayWatchBtn.disabled = false;
                    } else {
                         overlayWatchBtn.textContent = 'Indisponible';
                         overlayWatchBtn.disabled = true;
                    }
                }

            } catch (error) {
                console.error('Failed to fetch trailer:', error);
                if (overlayTrailerBtn) {
                    overlayTrailerBtn.classList.remove('is-loading');
                    overlayTrailerBtn.textContent = 'Erreur';
                }
                if (overlayWatchBtn) overlayWatchBtn.textContent = 'Erreur';
            }
        }
    }

    async function loadSeasons(tvId) {
        if (!seasonSelect) return;
        
        seasonSelect.innerHTML = '<option value="" disabled selected>Chargement des saisons...</option>';
        if (episodesList) episodesList.innerHTML = '';

        try {
            const response = await fetch(`/tv/${tvId}/seasons/`);
            if (!response.ok) throw new Error('Failed to fetch seasons');
            const data = await response.json();
            
            seasonSelect.innerHTML = '<option value="" disabled selected>Choisir une saison</option>';
            
            if (data.seasons && data.seasons.length > 0) {
                data.seasons.forEach(season => {
                    const option = document.createElement('option');
                    option.value = season.season_number;
                    option.textContent = `${season.name} (${season.episode_count} épisodes)`;
                    seasonSelect.appendChild(option);
                });
                
                // Auto-select first season
                seasonSelect.value = data.seasons[0].season_number;
                loadEpisodes(tvId, data.seasons[0].season_number);
            } else {
                seasonSelect.innerHTML = '<option value="" disabled>Aucune saison disponible</option>';
            }
            
        } catch (error) {
            console.error(error);
            seasonSelect.innerHTML = '<option value="" disabled>Erreur de chargement</option>';
        }
    }

    async function loadEpisodes(tvId, seasonNumber) {
        if (!episodesList) return;
        episodesList.innerHTML = '<div style="text-align:center; padding:1rem;">Chargement des épisodes...</div>';
        
        try {
            const response = await fetch(`/tv/${tvId}/season/${seasonNumber}/`);
            if (!response.ok) throw new Error('Failed to fetch episodes');
            const data = await response.json();
            
            episodesList.innerHTML = '';
            
            if (data.episodes && data.episodes.length > 0) {
                data.episodes.forEach(episode => {
                    const card = document.createElement('div');
                    card.className = 'episode-card';
                    
                    const stillUrl = episode.still_path || 'https://via.placeholder.com/300x169?text=No+Image';
                    const overview = episode.overview ? episode.overview : "Pas de description disponible.";
                    
                    card.innerHTML = `
                        <img src="${stillUrl}" class="episode-still" alt="${episode.name}">
                        <div class="episode-info">
                            <h4>${episode.episode_number}. ${episode.name}</h4>
                            <p>${overview}</p>
                        </div>
                        <button class="episode-play-btn" data-episode="${episode.episode_number}">▶ Voir</button>
                    `;
                    
                    const playBtn = card.querySelector('.episode-play-btn');
                    playBtn.addEventListener('click', () => {
                        const embedUrl = `https://moviesapi.club/tv/${tvId}-${seasonNumber}-${episode.episode_number}`;
                        openVideoOverlay(embedUrl, null, false);
                    });
                    
                    episodesList.appendChild(card);
                });
            } else {
                episodesList.innerHTML = '<div style="padding:1rem;">Aucun épisode trouvé.</div>';
            }
            
        } catch (error) {
            console.error(error);
            episodesList.innerHTML = '<div style="padding:1rem;">Erreur lors du chargement des épisodes.</div>';
        }
    }

    function closeMovieOverlay() {
        if (movieOverlay) movieOverlay.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    function openVideoOverlay(videoUrl, watchUrl, isYoutube) {
        if (!trailerOverlay || !trailerIframe) return;
        
        // Hide details overlay first
        if (movieOverlay) movieOverlay.style.display = 'none';
        
        trailerOverlay.style.display = 'flex';
        
        let finalUrl = videoUrl;
        if (isYoutube && videoUrl.includes('youtube.com/embed')) {
            if (videoUrl.includes('?')) finalUrl += '&autoplay=1';
            else finalUrl += '?autoplay=1';
        }
        
        trailerIframe.src = finalUrl;
        
        if (youtubeWatchBtn) {
            if (isYoutube && watchUrl) {
                youtubeWatchBtn.href = watchUrl;
                youtubeWatchBtn.style.display = 'inline-flex';
            } else {
                youtubeWatchBtn.style.display = 'none';
            }
        }
    }

    function closeTrailerOverlay() {
        if (trailerOverlay) trailerOverlay.style.display = 'none';
        if (trailerIframe) trailerIframe.src = '';
        
        // If we closed the video, we might want to return to scrolling
        // unless the user clicks "back" which is handled separately
        if (!movieOverlay || movieOverlay.style.display !== 'flex') {
             document.body.style.overflow = 'auto';
        }
    }
});
