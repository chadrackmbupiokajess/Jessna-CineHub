from django.http import JsonResponse
from django.shortcuts import render
from django.template.loader import render_to_string
from . import tmdb_client

def index(request):
    """
    Displays the main page with a list of movies and TV shows.
    Shows popular content by default, or search results if a query is provided.
    """
    query = request.GET.get("query", "").strip()
    page = int(request.GET.get("page", 1))
    category = request.GET.get("category", "all") # 'all', 'movie', 'tv'

    if query:
        # If there is a query, we search for both movies and TV shows
        movies, total_pages = tmdb_client.search_multi(query, page=page)
    else:
        if category == "movie":
            movies, total_pages = tmdb_client.get_popular_movies(page=page)
        elif category == "tv":
            movies, total_pages = tmdb_client.get_popular_tv_shows(page=page)
        else:
            movies, total_pages = tmdb_client.get_trending_all(page=page)

    context = {
        "movies": movies,
        "query": query,
        "current_page": page,
        "total_pages": total_pages,
        "category": category
    }
    return render(request, "movies/index.html", context)

def load_more_movies(request):
    """
    API endpoint for infinite scroll. 
    Fetches the next page of content and returns the rendered HTML for the cards.
    """
    query = request.GET.get("query", "").strip()
    page = int(request.GET.get("page", 1))
    category = request.GET.get("category", "all")

    if query:
        movies, total_pages = tmdb_client.search_multi(query, page=page)
    else:
        if category == "movie":
            movies, total_pages = tmdb_client.get_popular_movies(page=page)
        elif category == "tv":
            movies, total_pages = tmdb_client.get_popular_tv_shows(page=page)
        else:
            movies, total_pages = tmdb_client.get_trending_all(page=page)
    
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
    API endpoint to fetch a trailer and full video URLs.
    Now supports both movies and TV shows via 'media_type' query param.
    """
    media_type = request.GET.get("media_type", "movie")
    is_tv = media_type == "tv"
    
    trailer_urls = tmdb_client.get_trailer_urls(movie_id, is_tv=is_tv)
    return JsonResponse(trailer_urls or {})

def get_ambiance_clip(request, movie_id):
    """
    API endpoint to fetch a trailer to use as an ambiance clip.
    Now supports both movies and TV shows via 'media_type' query param.
    """
    media_type = request.GET.get("media_type", "movie")
    is_tv = media_type == "tv"
    
    trailer_urls = tmdb_client.get_trailer_urls(movie_id, is_tv=is_tv)
    if trailer_urls and trailer_urls.get("embed_url"):
        return JsonResponse({"video_url": trailer_urls["embed_url"]})
    return JsonResponse({})

def get_tv_seasons(request, tv_id):
    """
    API endpoint to fetch seasons for a TV show.
    """
    seasons = tmdb_client.get_tv_details(tv_id)
    return JsonResponse({"seasons": seasons})

def get_tv_episodes(request, tv_id, season_number):
    """
    API endpoint to fetch episodes for a specific season.
    """
    episodes = tmdb_client.get_season_episodes(tv_id, season_number)
    return JsonResponse({"episodes": episodes})


def about(request):
    """
    Displays the About Us page.
    """
    return render(request, "movies/about.html")
