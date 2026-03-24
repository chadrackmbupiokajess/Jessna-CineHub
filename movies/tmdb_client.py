import requests
from django.conf import settings
import random

BASE_URL = "https://api.themoviedb.org/3"
API_KEY = settings.TMDB_API_KEY
PEXELS_API_KEY = settings.PEXELS_API_KEY

def get_trailer_urls(movie_id, is_tv=False):
    """Fetches the YouTube embed and watch URLs for a given movie or TV show ID from TMDb."""
    media_type = "tv" if is_tv else "movie"
    url = f"{BASE_URL}/{media_type}/{movie_id}/videos?api_key={API_KEY}&language=fr-FR"
    
    # SINGLE BEST SERVER SELECTED BY USER
    full_movie_url = f"https://moviesapi.club/{media_type}/{movie_id}"

    try:
        response = requests.get(url)
        response.raise_for_status()
        videos = response.json().get("results", [])
        
        trailer_info = {
            "embed_url": None,
            "watch_url": None,
            "full_movie_embed": full_movie_url
        }

        for video in videos:
            if video["type"] == "Trailer" and video["site"] == "YouTube":
                video_key = video['key']
                trailer_info["embed_url"] = f"https://www.youtube.com/embed/{video_key}"
                trailer_info["watch_url"] = f"https://www.youtube.com/watch?v={video_key}"
                break 
        
        return trailer_info

    except requests.RequestException as e:
        print(f"Error fetching trailer for {media_type} {movie_id}: {e}")
        return {
             "embed_url": None,
             "watch_url": None,
             "full_movie_embed": full_movie_url
        }
    return None

def get_tv_details(tv_id):
    """Fetches details for a TV show, including seasons."""
    url = f"{BASE_URL}/tv/{tv_id}?api_key={API_KEY}&language=fr-FR"
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        seasons = []
        for season in data.get("seasons", []):
            if season["season_number"] > 0: # Skip specials (season 0) usually
                 seasons.append({
                     "season_number": season["season_number"],
                     "name": season["name"],
                     "episode_count": season["episode_count"]
                 })
        return seasons
    except requests.RequestException as e:
        print(f"Error fetching TV details for {tv_id}: {e}")
        return []

def get_season_episodes(tv_id, season_number):
    """Fetches episodes for a specific season of a TV show."""
    url = f"{BASE_URL}/tv/{tv_id}/season/{season_number}?api_key={API_KEY}&language=fr-FR"
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        episodes = []
        for ep in data.get("episodes", []):
            episodes.append({
                "episode_number": ep["episode_number"],
                "name": ep["name"],
                "overview": ep.get("overview", ""),
                "still_path": f"https://image.tmdb.org/t/p/w300{ep['still_path']}" if ep.get("still_path") else None
            })
        return episodes
    except requests.RequestException as e:
        print(f"Error fetching episodes for TV {tv_id} season {season_number}: {e}")
        return []

def get_movie_keywords_and_title(movie_id):
    """Fetches keywords and title for a movie from TMDb."""
    url = f"{BASE_URL}/movie/{movie_id}?api_key={API_KEY}&append_to_response=keywords"
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        title = data.get('title', '')
        keywords = [kw['name'] for kw in data.get('keywords', {}).get('keywords', [])]
        return title, keywords
    except requests.RequestException as e:
        print(f"Error fetching keywords/title for movie {movie_id}: {e}")
        return None, []

def get_pexels_video(query):
    """Fetches a random landscape video from Pexels based on a query."""
    if not query:
        return None
    pexels_url = "https://api.pexels.com/videos/search"
    headers = {"Authorization": PEXELS_API_KEY}
    params = {
        "query": query,
        "per_page": 15,
        "orientation": "landscape"
    }
    try:
        response = requests.get(pexels_url, headers=headers, params=params)
        response.raise_for_status()
        videos = response.json().get("videos", [])
        if videos:
            video = random.choice(videos)
            # Find a high-quality HD video file link
            video_file = next((f for f in video['video_files'] if f.get('quality') == 'hd' and f.get('link')), None)
            if video_file:
                return {"video_url": video_file['link']}
    except requests.RequestException as e:
        print(f"Error fetching video from Pexels for query '{query}': {e}")
    return None


def _format_data(item, is_tv=False):
    """Formats raw data from TMDb into a more usable dictionary."""
    return {
        "id": item["id"],
        "title": item.get("name") if is_tv else item.get("title"),
        "overview": item.get("overview", "Pas de résumé disponible."),
        "release_date": item.get("first_air_date") if is_tv else item.get("release_date", "Inconnue"),
        "poster_url": f"https://image.tmdb.org/t/p/w500{item['poster_path']}" if item.get("poster_path") else "",
        "media_type": "tv" if is_tv else "movie"
    }

def get_popular_movies(page=1):
    """Fetches a list of popular movies from TMDb for a given page."""
    url = f"{BASE_URL}/movie/popular?api_key={API_KEY}&language=fr-FR&page={page}"
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        movies_data = data.get("results", [])
        total_pages = data.get("total_pages", 1)
        return [_format_data(movie) for movie in movies_data], total_pages
    except requests.RequestException as e:
        print(f"Error fetching popular movies (page {page}): {e}")
        return [], 1

def get_popular_tv_shows(page=1):
    """Fetches a list of popular TV shows from TMDb for a given page."""
    url = f"{BASE_URL}/tv/popular?api_key={API_KEY}&language=fr-FR&page={page}"
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        tv_data = data.get("results", [])
        total_pages = data.get("total_pages", 1)
        return [_format_data(show, is_tv=True) for show in tv_data], total_pages
    except requests.RequestException as e:
        print(f"Error fetching popular tv shows (page {page}): {e}")
        return [], 1

def get_trending_all(page=1):
    """Fetches a list of trending movies and TV shows from TMDb for a given page."""
    url = f"{BASE_URL}/trending/all/day?api_key={API_KEY}&language=fr-FR&page={page}"
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        results = data.get("results", [])
        total_pages = data.get("total_pages", 1)
        
        formatted_results = []
        for item in results:
            if item.get("media_type") == "movie":
                 formatted_results.append(_format_data(item, is_tv=False))
            elif item.get("media_type") == "tv":
                 formatted_results.append(_format_data(item, is_tv=True))
        
        return formatted_results, total_pages
    except requests.RequestException as e:
        print(f"Error fetching trending all (page {page}): {e}")
        return [], 1

def search_multi(query, page=1):
    """Searches for movies and TV shows by query on TMDb for a given page."""
    url = f"{BASE_URL}/search/multi?api_key={API_KEY}&query={query}&language=fr-FR&page={page}"
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        results = data.get("results", [])
        total_pages = data.get("total_pages", 1)
        
        formatted_results = []
        for item in results:
            if item.get("media_type") == "movie":
                 formatted_results.append(_format_data(item, is_tv=False))
            elif item.get("media_type") == "tv":
                 formatted_results.append(_format_data(item, is_tv=True))
        
        return formatted_results, total_pages
    except requests.RequestException as e:
        print(f"Error searching multi (query: {query}, page {page}): {e}")
        return [], 1
