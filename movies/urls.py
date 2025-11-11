from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('trailer/<int:movie_id>/', views.get_trailer, name='get_trailer'),
    path('about/', views.about, name='about'),
    path('load-more-movies/', views.load_more_movies, name='load_more_movies'),
]
