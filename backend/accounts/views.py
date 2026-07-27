"""T Clock — accounts views"""

from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .models import User
from .serializers import UserSerializer, RegisterSerializer, CustomTokenSerializer
from .permissions import IsAdmin


class LoginView(TokenObtainPairView):
    """POST /api/auth/login/ — returns JWT tokens + user info."""
    serializer_class = CustomTokenSerializer
    permission_classes = [AllowAny]


class RegisterView(generics.CreateAPIView):
    """POST /api/auth/register/ — create new staff user (Admin only)."""
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [IsAdmin]


class ProfileView(APIView):
    """GET /api/auth/profile/ — current user profile."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class StaffListView(generics.ListAPIView):
    """GET /api/auth/staff/ — list all staff (Admin only)."""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdmin]


class StaffDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET/PATCH/DELETE /api/auth/staff/<id>/ (Admin only)."""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdmin]
