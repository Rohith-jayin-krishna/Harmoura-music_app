from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth.models import User
from django.contrib.auth.hashers import check_password
from .serializers import RegisterSerializer, SongSerializer, PlaylistSerializer
from .models import Song, Playlist
from rest_framework_simplejwt.tokens import RefreshToken
from datetime import timedelta
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser


# Helper function to create JWT tokens
def get_tokens_for_user(user, remember_me: bool = False):
    refresh = RefreshToken.for_user(user)
    if remember_me:
        refresh.access_token.set_exp(lifetime=timedelta(hours=24))
    else:
        refresh.access_token.set_exp(lifetime=timedelta(hours=1))
    return {"refresh": str(refresh), "access": str(refresh.access_token)}


# ---------------- User Authentication ---------------- #

from rest_framework.permissions import AllowAny

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]  # allow anyone to register

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        tokens = get_tokens_for_user(user)
        return Response({
            "message": "Registration successful",
            "username": user.username,
            "tokens": tokens
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [AllowAny]  # allow anyone to login

    def post(self, request):
        email = request.data.get("email")
        password = request.data.get("password")
        remember_me = bool(request.data.get("remember_me", False))

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

        if check_password(password, user.password):
            tokens = get_tokens_for_user(user, remember_me)
            return Response({
                "message": "Login successful",
                "username": user.username,
                "tokens": tokens
            })

        return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)


# ---------------- Songs & Playlists ---------------- #

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def all_songs(request):
    songs = Song.objects.all()
    serializer = SongSerializer(songs, many=True)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def user_playlists(request):
    playlists = Playlist.objects.filter(user=request.user)
    serializer = PlaylistSerializer(playlists, many=True)
    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_playlist(request):
    name = request.data.get("name")
    song_ids = request.data.get("song_ids", [])

    if not name:
        return Response({"error": "Playlist name is required"}, status=status.HTTP_400_BAD_REQUEST)

    playlist = Playlist.objects.create(user=request.user, name=name)
    if song_ids:
        songs = Song.objects.filter(id__in=song_ids)
        playlist.songs.set(songs)

    serializer = PlaylistSerializer(playlist)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def add_song_to_playlist(request, playlist_id):
    song_id = request.data.get("song_id")

    try:
        playlist = Playlist.objects.get(id=playlist_id, user=request.user)
        song = Song.objects.get(id=song_id)
    except Playlist.DoesNotExist:
        return Response({"error": "Playlist not found"}, status=status.HTTP_404_NOT_FOUND)
    except Song.DoesNotExist:
        return Response({"error": "Song not found"}, status=status.HTTP_404_NOT_FOUND)

    playlist.songs.add(song)
    serializer = PlaylistSerializer(playlist)
    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def remove_song_from_playlist(request, playlist_id):
    song_id = request.data.get("song_id")

    try:
        playlist = Playlist.objects.get(id=playlist_id, user=request.user)
        song = Song.objects.get(id=song_id)
    except Playlist.DoesNotExist:
        return Response({"error": "Playlist not found"}, status=status.HTTP_404_NOT_FOUND)
    except Song.DoesNotExist:
        return Response({"error": "Song not found"}, status=status.HTTP_404_NOT_FOUND)

    playlist.songs.remove(song)
    serializer = PlaylistSerializer(playlist)
    return Response(serializer.data)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_playlist(request, playlist_id):
    try:
        playlist = Playlist.objects.get(id=playlist_id, user=request.user)
        playlist.delete()
        return Response({"message": "Playlist deleted successfully"})
    except Playlist.DoesNotExist:
        return Response({"error": "Playlist not found"}, status=status.HTTP_404_NOT_FOUND)
    
    # ---------------- Central Song Library (Admin Managed) ---------------- #
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def central_song_library(request):
    """
    Fetch all songs from the central admin-managed library.
    Users can only read; admin can add/remove songs via Django admin.
    """
    songs = Song.objects.all()
    serializer = SongSerializer(songs, many=True)
    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsAdminUser])
def admin_add_song(request):
    """
    Admin adds a song to the central library.
    """
    serializer = SongSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["DELETE"])
@permission_classes([IsAdminUser])
def admin_delete_song(request, song_id):
    """
    Admin deletes a song from the central library.
    """
    try:
        song = Song.objects.get(id=song_id)
        song.delete()
        return Response({"message": "Song deleted successfully"})
    except Song.DoesNotExist:
        return Response({"error": "Song not found"}, status=status.HTTP_404_NOT_FOUND)
# ---------------- User Profile ---------------- #
import os
from django.conf import settings
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from .models import UserProfile, Song
from .serializers import SongSerializer

@api_view(["GET", "PUT"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def user_profile(request):
    """
    Fetch or update the profile of the currently logged-in user.
    Includes emotion, artist, and language stats in the GET response.
    """
    user = request.user
    # Ensure profile exists
    profile, created = UserProfile.objects.get_or_create(user=user)

    if request.method == "GET":
        profile_url = profile.profile_picture.url if profile.profile_picture else ""
        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name or "",
            "last_name": user.last_name or "",
            "profile_picture": profile_url,
            "profile_exists": bool(profile.profile_picture),
            "emotion_stats": profile.emotion_stats or {},
            "artist_stats": profile.artist_stats or {},
            "language_stats": profile.language_stats or {}  # ✅ Added
        })

    elif request.method == "PUT":
        first_name = request.data.get("first_name", user.first_name)
        last_name = request.data.get("last_name", user.last_name)

        user.first_name = first_name
        user.last_name = last_name
        user.save()

        # Only update profile picture if a new file is uploaded
        if "profile_picture" in request.FILES:
            # Delete old file if exists
            if profile.profile_picture:
                old_file_path = profile.profile_picture.path
                if os.path.isfile(old_file_path):
                    os.remove(old_file_path)

            # Save new profile picture
            profile.profile_picture = request.FILES["profile_picture"]
            profile.save()

        profile_url = profile.profile_picture.url if profile.profile_picture else ""
        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name or "",
            "last_name": user.last_name or "",
            "profile_picture": profile_url,
            "profile_exists": bool(profile.profile_picture),
            "emotion_stats": profile.emotion_stats or {},
            "artist_stats": profile.artist_stats or {},
            "language_stats": profile.language_stats or {}  # ✅ Added
        })

# Public endpoint for all songs (no auth required)
@api_view(["GET"])
@permission_classes([AllowAny])
def public_songs(request):
    songs = Song.objects.all()
    serializer = SongSerializer(songs, many=True)
    return Response(serializer.data)

# ---------------- emo, artist and language mapping---------------- #
from django.db.models import F
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Song, UserProfile


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def play_song(request):
    """
    Endpoint to mark a song as played by the user.
    Updates emotion, artist, and language stats in the user's profile.
    Also tracks the most recently played language (for bias).
    Expects JSON: { "song_id": <id> }
    """
    user = request.user
    song_id = request.data.get("song_id")

    try:
        song = Song.objects.get(id=song_id)
    except Song.DoesNotExist:
        return Response({"error": "Song not found"}, status=404)

    # Ensure user profile exists
    profile, created = UserProfile.objects.get_or_create(user=user)

    # Ensure stats dictionaries exist
    if not profile.emotion_stats:
        profile.emotion_stats = {}
    if not profile.artist_stats:
        profile.artist_stats = {}
    if not profile.language_stats:
        profile.language_stats = {}

    # Update emotion stats
    if song.emotion:
        profile.emotion_stats[song.emotion] = profile.emotion_stats.get(song.emotion, 0) + 1

    # Update artist stats
    if song.artist:
        profile.artist_stats[song.artist] = profile.artist_stats.get(song.artist, 0) + 1

    # Update language stats
    if song.language:
        profile.language_stats[song.language] = profile.language_stats.get(song.language, 0) + 1
        # ✅ Strong bias: Save most recent language
        profile.last_played_language = song.language  

    profile.save()

    return Response({
        "message": f"{song.title} played successfully",
        "emotion_stats": profile.emotion_stats,
        "artist_stats": profile.artist_stats,
        "language_stats": profile.language_stats,
        "last_played_language": profile.last_played_language,
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def recommended_songs(request):
    """
    Recommend songs based on user's listening stats:
    Priority order:
    1. Last played language (highest priority, forced bias)
    2. Language stats (if no last language)
    3. Emotion + Artist stats for ranking
    Returns top 6 ranked songs.
    """
    user = request.user
    profile, _ = UserProfile.objects.get_or_create(user=user)

    emotion_stats = profile.emotion_stats or {}
    artist_stats = profile.artist_stats or {}
    language_stats = profile.language_stats or {}

    # ✅ Step 1: Always bias to most recently played language
    if getattr(profile, "last_played_language", None):
        top_language = profile.last_played_language
        candidate_songs = Song.objects.filter(language=top_language)
    elif language_stats:
        top_language = max(language_stats, key=language_stats.get)
        candidate_songs = Song.objects.filter(language=top_language)
    else:
        candidate_songs = Song.objects.all()

    # Step 2: Score by emotion and artist
    song_scores = []
    for song in candidate_songs:
        emotion_score = emotion_stats.get(song.emotion, 0) if song.emotion else 0
        artist_score = artist_stats.get(song.artist, 0) if song.artist else 0
        total_score = (emotion_score * 2) + artist_score
        song_scores.append((total_score, song))

    # Step 3: Sort
    song_scores.sort(key=lambda x: (x[0], x[1].id), reverse=True)
    top_songs = [song for _, song in song_scores[:6]]

    # Step 4: Serialize
    def get_absolute_url(file_or_str):
        if not file_or_str:
            return None
        if hasattr(file_or_str, "url"):
            return request.build_absolute_uri(file_or_str.url)
        return request.build_absolute_uri(str(file_or_str))

    serialized = []
    for song in top_songs:
        serialized.append({
            "id": song.id,
            "title": song.title,
            "artist": song.artist,
            "src": get_absolute_url(song.src),
            "cover_url": get_absolute_url(song.cover),
            "emotion": song.emotion,
            "language": song.language,
        })

    return Response(serialized)



# ---------------- Recent & Frequent Playlists ---------------- #
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import PlaylistActivity, Playlist
from django.db.models import Q
from django.utils import timezone

def get_absolute_url(request, file_or_field):
    """Return absolute URL if available, else None."""
    if not file_or_field:
        return None
    if hasattr(file_or_field, "url"):
        return request.build_absolute_uri(file_or_field.url)
    return request.build_absolute_uri(str(file_or_field))

def serialize_playlist(request, activity):
    """Serialize playlist with songs + meta."""
    playlist = activity.playlist
    return {
        "id": playlist.id,
        "name": playlist.name,
        "cover_url": get_absolute_url(request, playlist.cover),
        "songs": [
            {
                "id": s.id,
                "title": s.title,
                "artist": s.artist,
                "src": get_absolute_url(request, s.src),
                "cover_url": get_absolute_url(request, s.cover),
                "emotion": s.emotion,
                "language": s.language,
            }
            for s in playlist.songs.all()
        ],
        "last_opened": activity.last_opened,
        "open_count": activity.open_count,
    }

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def recent_playlists(request):
    """
    Returns playlists based on:
    1. Recently opened
    2. Most frequently opened
    """
    user = request.user

    activities = PlaylistActivity.objects.filter(user=user)\
        .select_related("playlist")\
        .prefetch_related("playlist__songs")

    # Recent playlists
    recent = activities.order_by("-last_opened")[:5]

    # Frequent playlists (excluding duplicates from recent)
    recent_ids = [pl.playlist.id for pl in recent]
    frequent = activities.exclude(playlist__id__in=recent_ids).order_by("-open_count")[:5]

    return Response({
        "recent_playlists": [serialize_playlist(request, pl) for pl in recent],
        "frequent_playlists": [serialize_playlist(request, pl) for pl in frequent],
    })

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def frequent_playlists(request):
    """
    Returns most frequently opened playlists only.
    """
    user = request.user

    activities = PlaylistActivity.objects.filter(user=user)\
        .select_related("playlist")\
        .prefetch_related("playlist__songs")\
        .order_by("-open_count")[:10]

    return Response([serialize_playlist(request, pl) for pl in activities])

# ---------------- Playlist Open Tracking ---------------- #
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def playlist_open(request, playlist_id):
    """
    Call this when a user opens a playlist.
    Updates last_opened and increments open_count.
    """
    user = request.user
    try:
        playlist = Playlist.objects.get(id=playlist_id)
    except Playlist.DoesNotExist:
        return Response({"error": "Playlist not found"}, status=404)

    activity, created = PlaylistActivity.objects.get_or_create(user=user, playlist=playlist)
    activity.last_opened = timezone.now()
    activity.open_count = (activity.open_count or 0) + 1
    activity.save()

    # Return the serialized playlist
    return Response({
        "id": playlist.id,
        "name": playlist.name,
        "cover_url": get_absolute_url(request, playlist.cover),
        "last_opened": activity.last_opened,
        "open_count": activity.open_count
    })


# ---------------- Search & Tile Click ---------------- #
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q
from .models import Song
from .serializers import SongSerializer

# ---------------- Search Endpoint ---------------- #
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def search_songs_artists_emotions(request):
    """
    Search songs, artists, emotions, or languages.
    Query param: ?q=<search_term>
    """
    query = request.query_params.get("q", "").strip()
    if not query:
        return Response({"songs": [], "artists": [], "emotions": [], "languages": []})

    # Songs matching the title
    songs = Song.objects.filter(title__icontains=query)
    
    # Distinct artists matching the query
    artists = Song.objects.filter(artist__icontains=query).values_list('artist', flat=True).distinct()
    
    # Distinct emotions matching the query
    emotions = Song.objects.filter(emotion__icontains=query).values_list('emotion', flat=True).distinct()
    
    # Distinct languages matching the query
    languages = Song.objects.filter(language__icontains=query).values_list('language', flat=True).distinct()

    # Serialize songs using SongSerializer for full details
    serializer = SongSerializer(songs, many=True, context={"request": request})

    return Response({
        "songs": serializer.data,
        "artists": [artist for artist in artists if artist],
        "emotions": [emotion for emotion in emotions if emotion],
        "languages": [lang for lang in languages if lang]
    })


# ---------------- Tile Click Endpoints ---------------- #
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def songs_by_artist(request, artist_name):
    """
    Return all songs by a specific artist (for artist tile click).
    """
    songs = Song.objects.filter(artist__iexact=artist_name)
    serializer = SongSerializer(songs, many=True, context={"request": request})
    return Response({
        "artist": artist_name,
        "songs": serializer.data
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def songs_by_emotion(request, emotion_name):
    """
    Return all songs of a specific emotion (for emotion tile click).
    """
    songs = Song.objects.filter(emotion__iexact=emotion_name)
    serializer = SongSerializer(songs, many=True, context={"request": request})
    return Response({
        "emotion": emotion_name,
        "songs": serializer.data
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def songs_by_language(request, language_name):
    """
    Return all songs of a specific language (for language tile click).
    """
    songs = Song.objects.filter(language__iexact=language_name)
    serializer = SongSerializer(songs, many=True, context={"request": request})
    return Response({
        "language": language_name,
        "songs": serializer.data
    })