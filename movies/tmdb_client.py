import requests
from django.conf import settings

BASE_URL = "https://api.themoviedb.org/3"
API_KEY = settings.TMDB_API_KEY

def get_trailer_url(movie_id):
    """Fetches the trailer URL for a given movie ID from TMDb."""
    url = f"{BASE_URL}/movie/{movie_id}/videos?api_key={API_KEY}&language=fr-FR"
    try:
        response = requests.get(url)
        response.raise_for_status()
        videos = response.json().get("results", [])
        for video in videos:
            if video["type"] == "Trailer" and video["site"] == "YouTube":
                return f"https://www.youtube.com/watch?v={video['key']}"
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
        # Trailer URL is now fetched on demand
    }

def get_popular_movies():
    """Fetches a list of popular movies from TMDb."""
    url = f"{BASE_URL}/movie/popular?api_key={API_KEY}&language=fr-FR&page=1"
    try:
        response = requests.get(url)
        response.raise_for_status()
        movies_data = response.json().get("results", [])
        return [_format_movie_data(movie) for movie in movies_data]
    except requests.RequestException as e:
        print(f"Error fetching popular movies: {e}")
        return []

def search_movies(query):
    """Searches for movies by query on TMDb."""
    url = f"{BASE_URL}/search/movie?api_key={API_KEY}&query={query}&language=fr-FR"
    try:
        response = requests.get(url)
        response.raise_for_status()
        movies_data = response.json().get("results", [])
        return [_format_movie_data(movie) for movie in movies_data]
    except requests.RequestException as e:
        print(f"Error searching movies: {e}")
        return []
