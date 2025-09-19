"""
Custom User model for designer portfolio platform.
Following Fat Models principle - business logic concentrated in model methods.
"""

from django.contrib.auth.models import AbstractUser
from django.core.validators import RegexValidator
from django.db import models


class User(AbstractUser):
    """
    Custom User model extending Django's AbstractUser.
    Designed specifically for designer portfolio platform.

    Why AbstractUser over AbstractBaseUser:
    - Keeps all Django's built-in User functionality
    - Easier to maintain and extend
    - Compatible with Django admin and third-party packages
    """

    # Email as primary identifier (Stateless API requirement)
    email = models.EmailField(
        unique=True,
        db_index=True,  # Performance: frequent filtering/lookups
        help_text="Used for authentication and communication",
    )

    # Designer-specific profile fields
    display_name = models.CharField(
        max_length=50, help_text="Public display name for portfolio"
    )

    bio = models.TextField(
        max_length=500, blank=True, help_text="Brief professional bio"
    )

    # Professional information
    specialization = models.CharField(
        max_length=100,
        blank=True,
        help_text="Design specialization (e.g., UI/UX, Graphic Design)",
    )

    years_of_experience = models.PositiveSmallIntegerField(
        null=True, blank=True, help_text="Years of professional design experience"
    )

    # Contact information
    website = models.URLField(blank=True, help_text="Personal or professional website")

    phone_validator = RegexValidator(
        regex=r"^(010-?\d{4}-?\d{4}|\+\d{1,4}\d{7,14})$",
        message="올바른 전화번호 형식(예: 010-1234-5678 또는 +821012345678)을 입력해주세요.",
    )
    phone_number = models.CharField(
        validators=[phone_validator], max_length=17, blank=True
    )

    # Profile image (requires Pillow)
    profile_image = models.ImageField(
        upload_to="profiles/%Y/%m/", blank=True, null=True  # Organized by date
    )

    # Portfolio settings
    is_portfolio_public = models.BooleanField(
        default=True, help_text="Whether portfolio is visible to public"
    )

    # Timestamps
    updated_at = models.DateTimeField(auto_now=True)

    # Authentication configuration (Stateless API)
    USERNAME_FIELD = "email"  # Use email for login
    REQUIRED_FIELDS = ["username", "display_name"]

    class Meta:
        db_table = "users"
        verbose_name = "User"
        verbose_name_plural = "Users"
        # Performance indexes for frequent queries
        indexes = [
            models.Index(fields=["email", "is_active"]),
            models.Index(fields=["display_name"]),
            models.Index(fields=["specialization"]),
        ]

    def __str__(self):
        """String representation for admin and debugging."""
        return f"{self.display_name} ({self.email})"

    # Fat Models: Business logic methods
    def get_full_display_name(self):
        """Return display name with fallback."""
        return self.display_name or self.username

    def is_experienced_designer(self):
        """Check if user has significant design experience."""
        return self.years_of_experience and self.years_of_experience >= 3

    def get_portfolio_url(self):
        """Generate portfolio URL for this user."""
        return f"/portfolio/{self.username}/"

    def can_view_portfolio(self, viewer=None):
        """
        Business logic: Determine if viewer can see this portfolio.
        Fat Models principle - logic stays in the model.
        """
        if not self.is_portfolio_public:
            return viewer == self
        return True
