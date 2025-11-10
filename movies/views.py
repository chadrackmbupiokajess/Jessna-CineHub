from django.shortcuts import render
import requests

TMDB_API_KEY = "1c7bf3bd03e895b75fd15b0022e31315"

def search_movies(query):
    url = f"https://api.themoviedb.org/3/search/movie?api_key={TMDB_API_KEY}&query={query}"
    response = requests.get(url)
    data = response.json()
    results = []
    for movie in data.get("results", []):
        results.append({
            "title": movie["title"],
            "overview": movie.get("overview", "Pas de résumé disponible"),
            "release_date": movie.get("release_date", "Inconnue"),
            "poster_url": f"https://image.tmdb.org/t/p/w500{movie['poster_path']}" if movie.get("poster_path") else "",
            "youtube_trailer": f"https://www.youtube.com/results?search_query={movie['title'].replace(' ','+')}+bande+annonce"
        })
    return results

def index(request):
    movies = []
    query = ""
    if request.method == "POST":
        query = request.POST.get("query")
        if query:
            movies = search_movies(query)
    return render(request, "movies/index.html", {"movies": movies, "query": query})
