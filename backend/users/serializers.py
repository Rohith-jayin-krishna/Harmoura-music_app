from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Song, Playlist

# User registration serializer
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
        return user


# Song serializer
class SongSerializer(serializers.ModelSerializer):
    class Meta:
        model = Song
        fields = ("id", "title", "artist", "src")


# Playlist serializer with optional song IDs for creation/updating
class PlaylistSerializer(serializers.ModelSerializer):
    songs = SongSerializer(many=True, read_only=True)
    song_ids = serializers.PrimaryKeyRelatedField(
        many=True, write_only=True, queryset=Song.objects.all(), required=False
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