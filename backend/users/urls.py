from django.urls import path
from .views import (
    RegisterView, LoginView,
    user_playlists, create_playlist, add_song_to_playlist,
    remove_song_from_playlist, delete_playlist,
    all_songs, public_songs, play_song, recommended_songs,
    recent_playlists, frequent_playlists, playlist_open,  # ✅ added playlist_open
    search_songs_artists_emotions,
    songs_by_artist, songs_by_emotion, songs_by_language,
    user_profile
)

urlpatterns = [
    # ---------------- Auth ---------------- #
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),

    # ---------------- Playlists ---------------- #
    path("playlists/", user_playlists, name="user_playlists"),
    path("playlists/create/", create_playlist, name="create_playlist"),
    path("playlists/<int:playlist_id>/add-song/", add_song_to_playlist, name="add_song_to_playlist"),
    path("playlists/<int:playlist_id>/remove-song/", remove_song_from_playlist, name="remove_song_from_playlist"),
    path("playlists/delete/<int:playlist_id>/", delete_playlist, name="delete_playlist"),

    # ---------------- Recent & Frequent Playlists ---------------- #
    path("playlists/recent/", recent_playlists, name="recent_playlists"),
    path("playlists/frequent/", frequent_playlists, name="frequent_playlists"),
    path("playlists/<int:playlist_id>/open/", playlist_open, name="playlist_open"),  # ✅ new route

    # ---------------- Songs ---------------- #
    path("songs/", all_songs, name="all_songs"),
    path("songs/public/", public_songs, name="public_songs"),
    path("songs/recommended/", recommended_songs, name="recommended_songs"),

    # ---------------- Search & Filter ---------------- #
    path("songs/search/", search_songs_artists_emotions, name="search_songs_artists_emotions"),
    path("songs/artist/<str:artist_name>/", songs_by_artist, name="songs_by_artist"),
    path("songs/emotion/<str:emotion_name>/", songs_by_emotion, name="songs_by_emotion"),
    path("songs/language/<str:language_name>/", songs_by_language, name="songs_by_language"),

    # ---------------- User Profile ---------------- #
    path("profile/", user_profile, name="user_profile"),

    # ---------------- Play Song (update stats) ---------------- #
    path("play_song/", play_song, name="play_song"),
]
