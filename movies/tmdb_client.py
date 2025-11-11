import requests
from django.conf import settings

BASE_URL = "https://api.themoviedb.org/3"
API_KEY = settings.TMDB_API_KEY

def get_trailer_urls(movie_id):
    """Fetches the YouTube embed and watch URLs for a given movie ID from TMDb."""
    url = f"{BASE_URL}/movie/{movie_id}/videos?api_key={API_KEY}&language=fr-FR"
    try:
        response = requests.get(url)
        response.raise_for_status()
        videos = response.json().get("results", [])
        for video in videos:
            if video["type"] == "Trailer" and video["site"] == "YouTube":
                video_key = video['key']
                return {
                    "embed_url": f"https://www.youtube.com/embed/{video_key}",
                    "watch_url": f"https://www.youtube.com/watch?v={video_key}"
                }
    except requests.RequestException as e:
        print(f"Error fetching trailer for movie {movie_id}: {e}")
    return None

def _format_movie_data(movie):
    """Formats raw movie data from TMDb into a more usable dictionary."""
    return {
        "id": movie["id"],
        "title": movie["title"],
        "overview": movie.get("overview", "Pas de résumé disponible."),
        "release_date": movie.get("release_date", "Inconnue"),
        "poster_url": f"https://image.tmdb.org/t/p/w500{movie['poster_path']}" if movie.get("poster_path") else "",
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
        return [_format_movie_data(movie) for movie in movies_data], total_pages
    except requests.RequestException as e:
        print(f"Error fetching popular movies (page {page}): {e}")
        return [], 1

def search_movies(query, page=1):
    """Searches for movies by query on TMDb for a given page."""
    url = f"{BASE_URL}/search/movie?api_key={API_KEY}&query={query}&language=fr-FR&page={page}"
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        movies_data = data.get("results", [])
        total_pages = data.get("total_pages", 1)
        return [_format_movie_data(movie) for movie in movies_data], total_pages
    except requests.RequestException as e:
        print(f"Error searching movies (query: {query}, page {page}): {e}")
        return [], 1
