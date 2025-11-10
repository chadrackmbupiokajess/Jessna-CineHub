import requests

API_KEY = "1c7bf3bd03e895b75fd15b0022e31315"
BASE_URL = "https://api.themoviedb.org/3"

def search_movie(movie_name):
    url = f"{BASE_URL}/search/movie?api_key={API_KEY}&query={movie_name}"
    response = requests.get(url)
    data = response.json()

    if "results" in data and len(data["results"]) > 0:
        for movie in data["results"][:5]:  # affiche les 5 premiers
            print(f"Titre: {movie['title']}")
            print(f"Date de sortie: {movie.get('release_date', 'Inconnue')}")
            print(f"Résumé: {movie.get('overview', 'Pas de résumé')}")
            print("-" * 50)
    else:
        print("Aucun film trouvé.")

if __name__ == "__main__":
    name = input("Entrez le nom du film : ")
    search_movie(name)
