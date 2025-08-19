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
def add_song_to_playlist(request):
    playlist_id = request.data.get("playlist_id")
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
def remove_song_from_playlist(request):
    playlist_id = request.data.get("playlist_id")
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
    Includes emotion and artist stats in the GET response.
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
            "artist_stats": profile.artist_stats or {}
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
            "artist_stats": profile.artist_stats or {}
        })

# Public endpoint for all songs (no auth required)
@api_view(["GET"])
@permission_classes([AllowAny])
def public_songs(request):
    songs = Song.objects.all()
    serializer = SongSerializer(songs, many=True)
    return Response(serializer.data)

# ---------------- emo and artist mapping---------------- #
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
    Updates emotion and artist stats in the user's profile.
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

    # Update emotion stats
    if song.emotion:
        profile.emotion_stats[song.emotion] = profile.emotion_stats.get(song.emotion, 0) + 1

    # Update artist stats
    if song.artist:
        profile.artist_stats[song.artist] = profile.artist_stats.get(song.artist, 0) + 1

    profile.save()
    return Response({"message": f"{song.title} played successfully"})