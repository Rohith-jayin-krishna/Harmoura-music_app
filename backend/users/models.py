from django.db import models
from django.contrib.auth.models import User

class Song(models.Model):
    title = models.CharField(max_length=255)
    artist = models.CharField(max_length=255)
    src = models.FileField(upload_to="songs/")  # for uploaded audio files

    def __str__(self):
        return f"{self.title} by {self.artist}"


class Playlist(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="playlists")
    name = models.CharField(max_length=255)
    songs = models.ManyToManyField(Song, blank=True, related_name="playlists")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.user.username})"