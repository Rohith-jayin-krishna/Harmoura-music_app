from django.db import models
from django.contrib.auth.models import User

# ---------------- Song Model ---------------- #
class Song(models.Model):
    EMOTIONS = [
        ("Happiness", "Happiness"),
        ("Sadness", "Sadness"),
        ("Calmness", "Calmness"),
        ("Excitement", "Excitement"),
        ("Love", "Love"),
    ]

    title = models.CharField(max_length=255)
    artist = models.CharField(max_length=255)
    src = models.FileField(upload_to="songs/")  # Audio file
    cover = models.ImageField(upload_to="song_covers/", blank=True, null=True)  # Cover image
    emotion = models.CharField(max_length=20, choices=EMOTIONS, blank=True, null=True)  # Emotion field

    def __str__(self):
        return f"{self.title} by {self.artist}"

    @property
    def cover_url(self):
        """Return full URL of cover image if exists."""
        if self.cover and hasattr(self.cover, "url"):
            return self.cover.url
        return None


# ---------------- Playlist Model ---------------- #
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
    Upload profile pictures to:
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

    # Track plays
    emotion_stats = models.JSONField(default=dict)  # e.g., {"Happiness": 5, "Sadness": 2}
    artist_stats = models.JSONField(default=dict)   # e.g., {"Artist Name": 10}

    # ---------------- Harmoura Portrait ---------------- #
    # Stores portrait strokes or gradient state for persistence
    portrait_data = models.JSONField(default=list, blank=True)

    def __str__(self):
        return f"{self.user.username} Profile"

    @property
    def profile_picture_url(self):
        """Return full URL of profile picture if exists."""
        if self.profile_picture and hasattr(self.profile_picture, "url"):
            return self.profile_picture.url
        return None