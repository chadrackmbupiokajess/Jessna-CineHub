from django.db import models

class Movie(models.Model):
    title = models.CharField(max_length=200)
    overview = models.TextField()
    release_date = models.CharField(max_length=20)
    poster_url = models.URLField()
    youtube_trailer = models.URLField(blank=True)

    def __str__(self):
        return self.title
