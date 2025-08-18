from django.db import models
from django.contrib.auth.models import User

class Song(models.Model):
    title = models.CharField(max_length=255)
    artist = models.CharField(max_length=255)
    src = models.FileField(upload_to="songs/")  # existing audio
    cover = models.ImageField(upload_to="song_covers/", blank=True, null=True)  # new cover field

    def __str__(self):
        return f"{self.title} by {self.artist}"

    @property
    def cover_url(self):
        if self.cover and hasattr(self.cover, "url"):
            return self.cover.url
        return None


class Playlist(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="playlists")
    name = models.CharField(max_length=255)
    songs = models.ManyToManyField(Song, blank=True, related_name="playlists")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.user.username})"


# ---------------- User Profile ---------------- #
def user_directory_path(instance, filename):
    """
    Uploads profile pictures to:
    media/profile_pictures/<username>/<filename>
    """
    return f"profile_pictures/{instance.user.username}/{filename}"


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    profile_picture = models.ImageField(
        upload_to=user_directory_path,
        blank=True,
        null=True
    )

    def __str__(self):
        return f"{self.user.username} Profile"

    @property
    def profile_picture_url(self):
        if self.profile_picture and hasattr(self.profile_picture, "url"):
            return self.profile_picture.url
        return None