from django.http import JsonResponse
from django.shortcuts import render
from . import tmdb_client

def index(request):
    """
    Displays the main page with a list of movies.
    Shows popular movies by default, or search results if a query is provided.
    """
    query = request.GET.get("query", "").strip()
    
    if query:
        movies = tmdb_client.search_movies(query)
    else:
        movies = tmdb_client.get_popular_movies()
        
    context = {
        "movies": movies,
        "query": query,
    }
    return render(request, "movies/index.html", context)

def get_trailer(request, movie_id):
    """
    API endpoint to fetch a movie's trailer URLs.
    Returns a JSON response with both embed and watch URLs.
    """
    trailer_urls = tmdb_client.get_trailer_urls(movie_id)
    return JsonResponse(trailer_urls or {})
