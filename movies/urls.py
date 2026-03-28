from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('trailer/<int:movie_id>/', views.get_trailer, name='get_trailer'),
    path('tv/<int:tv_id>/seasons/', views.get_tv_seasons, name='get_tv_seasons'),
    path('tv/<int:tv_id>/season/<int:season_number>/', views.get_tv_episodes, name='get_tv_episodes'),
    path('about/', views.about, name='about'),
    path('live-sports/', views.live_sports, name='live_sports'),
    path('load-more-movies/', views.load_more_movies, name='load_more_movies'),
    path('ambiance-clip/<int:movie_id>/', views.get_ambiance_clip, name='get_ambiance_clip'),
]
