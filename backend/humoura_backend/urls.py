from django.contrib import admin
from django.urls import path, include
from django.views.generic import RedirectView
from django.conf import settings
from django.conf.urls.static import static

# Import search view from users app
from users.views import search_songs_artists_emotions

urlpatterns = [
    path('admin/', admin.site.urls),

    # Include all user-related API endpoints
    path('api/users/', include('users.urls')),

    # Global search endpoint
    path('api/search/', search_songs_artists_emotions, name='global_search'),

    # Redirect root to admin
    path('', RedirectView.as_view(url='/admin/', permanent=False)),
]

# Serve media files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)