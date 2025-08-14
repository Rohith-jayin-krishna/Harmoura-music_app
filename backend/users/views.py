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