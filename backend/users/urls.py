from django.urls import path
from .views import (
    RegisterView, LoginView, user_playlists,
    create_playlist, add_song_to_playlist,
    all_songs, remove_song_from_playlist, delete_playlist,
    # Updated
    user_profile,
    # New public songs view
    public_songs
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("playlists/", user_playlists, name="user_playlists"),
    path("playlists/create/", create_playlist, name="create_playlist"),
    path("playlists/add_song/", add_song_to_playlist, name="add_song_to_playlist"),
    path("songs/", all_songs, name="all_songs"),
    path("playlists/remove_song/", remove_song_from_playlist, name="remove_song_from_playlist"),
    path("playlists/delete/<int:playlist_id>/", delete_playlist, name="delete_playlist"),

    # Profile endpoint
    path("profile/", user_profile, name="user_profile"),

    # Public songs endpoint (no authentication required)
    path("songs/public/", public_songs, name="public_songs"),
]