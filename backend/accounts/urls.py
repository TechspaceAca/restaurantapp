"""T Clock — accounts URLs"""

from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path('login/', views.LoginView.as_view(), name='login'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('register/', views.RegisterView.as_view(), name='register'),
    path('profile/', views.ProfileView.as_view(), name='profile'),
    path('staff/', views.StaffListView.as_view(), name='staff-list'),
    path('staff/<int:pk>/', views.StaffDetailView.as_view(), name='staff-detail'),
]
