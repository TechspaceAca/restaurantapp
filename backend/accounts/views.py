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


class RestaurantSettingsView(APIView):
    """GET/PUT /api/auth/settings/ — get/update restaurant settings."""
    permission_classes = [AllowAny] # GET is public (for staff POS)
    
    def get(self, request):
        from .models import RestaurantSettings
        from .serializers import RestaurantSettingsSerializer
        settings = RestaurantSettings.load()
        serializer = RestaurantSettingsSerializer(settings)
        return Response(serializer.data)
        
    def put(self, request):
        if not request.user.is_authenticated or request.user.role != 'admin':
            return Response({'error': 'Admin only'}, status=status.HTTP_403_FORBIDDEN)
            
        from .models import RestaurantSettings
        from .serializers import RestaurantSettingsSerializer
        settings = RestaurantSettings.load()
        serializer = RestaurantSettingsSerializer(settings, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
