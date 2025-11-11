from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('trailer/<int:movie_id>/', views.get_trailer, name='get_trailer'),
]
