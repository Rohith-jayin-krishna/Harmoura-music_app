from django.urls import path

from .views import (
    RegisterView, LoginView, user_playlists,
    create_playlist, add_song_to_playlist,
    all_songs, remove_song_from_playlist, delete_playlist,
    user_profile, public_songs,
    play_song, recommended_songs,
    search_songs_artists_emotions,
    songs_by_artist,
    songs_by_emotion,
    songs_by_language  # ✅ add this import
)

urlpatterns = [
    # Auth
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    
    # Playlists
    path("playlists/", user_playlists, name="user_playlists"),
    path("playlists/create/", create_playlist, name="create_playlist"),
    path("playlists/add_song/", add_song_to_playlist, name="add_song_to_playlist"),
    path("playlists/remove_song/", remove_song_from_playlist, name="remove_song_from_playlist"),
    path("playlists/delete/<int:playlist_id>/", delete_playlist, name="delete_playlist"),
    
    # Songs
    path("songs/", all_songs, name="all_songs"),
    path("songs/public/", public_songs, name="public_songs"),
    path("songs/recommended/", recommended_songs, name="recommended_songs"),

    # Search & Tile
    path("songs/search/", search_songs_artists_emotions, name="search_songs_artists_emotions"),
    path("songs/artist/<str:artist_name>/", songs_by_artist, name="songs_by_artist"),
    path("songs/emotion/<str:emotion_name>/", songs_by_emotion, name="songs_by_emotion"),
    path("songs/language/<str:language_name>/", songs_by_language, name="songs_by_language"),  # ✅ language tile

    # User profile
    path("profile/", user_profile, name="user_profile"),

    # Play song to update stats
    path("play_song/", play_song, name="play_song"),
]