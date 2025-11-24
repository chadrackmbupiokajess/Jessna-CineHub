from django.http import JsonResponse
from django.shortcuts import render
from django.template.loader import render_to_string
from . import tmdb_client

def index(request):
    """
    Displays the main page with a list of movies.
    Shows popular movies by default, or search results if a query is provided.
    """
    query = request.GET.get("query", "").strip()
    page = int(request.GET.get("page", 1))

    if query:
        movies, total_pages = tmdb_client.search_movies(query, page=page)
    else:
        movies, total_pages = tmdb_client.get_popular_movies(page=page)
        
    context = {
        "movies": movies,
        "query": query,
        "current_page": page,
        "total_pages": total_pages,
    }
    return render(request, "movies/index.html", context)

def load_more_movies(request):
    """
    API endpoint for infinite scroll. 
    Fetches the next page of movies and returns the rendered HTML for the movie cards.
    """
    query = request.GET.get("query", "").strip()
    page = int(request.GET.get("page", 1))

    if query:
        movies, total_pages = tmdb_client.search_movies(query, page=page)
    else:
        movies, total_pages = tmdb_client.get_popular_movies(page=page)
    
    movies_html = render_to_string(
        "movies/partials/movie_cards.html", 
        {"movies": movies}
    )

    return JsonResponse({
        "movies_html": movies_html,
        "new_movies_data": movies,
        "has_next": page < total_pages
    })


def get_trailer(request, movie_id):
    """
    API endpoint to fetch a movie's trailer URLs.
    Returns a JSON response with both embed and watch URLs.
    """
    trailer_urls = tmdb_client.get_trailer_urls(movie_id)
    return JsonResponse(trailer_urls or {})

def get_ambiance_clip(request, movie_id):
    """
    API endpoint to fetch a movie's trailer to use as an ambiance clip.
    """
    trailer_urls = tmdb_client.get_trailer_urls(movie_id)
    if trailer_urls and trailer_urls.get("embed_url"):
        # The frontend expects a 'video_url' key, so we map the embed_url to it.
        return JsonResponse({"video_url": trailer_urls["embed_url"]})
    return JsonResponse({})


def about(request):
    """
    Displays the About Us page.
    """
    return render(request, "movies/about.html")
