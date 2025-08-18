# users/admin.py
from django.contrib import admin
from .models import Song, Playlist

@admin.register(Song)
class SongAdmin(admin.ModelAdmin):
    list_display = ('title', 'artist', 'src', 'cover')  # ✅ added cover to display
    # Optional: add search or filter
    search_fields = ('title', 'artist')

@admin.register(Playlist)
class PlaylistAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'created_at')
    filter_horizontal = ('songs',)  # for easier many-to-many selection