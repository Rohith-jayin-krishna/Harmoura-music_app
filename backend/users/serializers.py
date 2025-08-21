from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Song, Playlist, UserProfile

# ---------------- Existing serializers (unchanged) ---------------- #

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ("username", "email", "password")

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"]
        )
        # Create empty profile automatically
        UserProfile.objects.create(user=user)
        return user


# ---------------- Song Serializer with cover ---------------- #
class SongSerializer(serializers.ModelSerializer):
    cover_url = serializers.SerializerMethodField()

    class Meta:
        model = Song
        fields = ("id", "title", "artist", "src", "cover_url", "emotion", "language")

    def get_cover_url(self, obj):
        request = self.context.get("request")
        if obj.cover:
            url = obj.cover.url
            if request:
                return request.build_absolute_uri(url)
            return url
        return None


class PlaylistSerializer(serializers.ModelSerializer):
    songs = SongSerializer(many=True, read_only=True)
    song_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Song.objects.all(), required=False
    )

    class Meta:
        model = Playlist
        fields = ("id", "name", "songs", "song_ids", "created_at")

    def create(self, validated_data):
        song_ids = validated_data.pop("song_ids", [])
        playlist = Playlist.objects.create(**validated_data)
        playlist.songs.set(song_ids)
        return playlist

    def update(self, instance, validated_data):
        song_ids = validated_data.pop("song_ids", None)
        instance.name = validated_data.get("name", instance.name)
        instance.save()
        if song_ids is not None:
            instance.songs.set(song_ids)
        return instance


# ---------------- User Profile Serializer ---------------- #
class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    profile_picture_url = serializers.SerializerMethodField()
    emotion_stats = serializers.DictField(read_only=True)
    artist_stats = serializers.DictField(read_only=True)
    portrait_data = serializers.JSONField(required=False)  # <-- added for Harmoura Portrait

    class Meta:
        model = UserProfile
        fields = (
            "username",
            "email",
            "profile_picture",
            "profile_picture_url",
            "emotion_stats",
            "artist_stats",
            "portrait_data",  # <-- include in serialized output
        )

    def get_profile_picture_url(self, obj):
        request = self.context.get("request")
        if obj.profile_picture:
            url = obj.profile_picture.url
            if request:
                return request.build_absolute_uri(url)
            return url
        return None