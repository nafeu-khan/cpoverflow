# common/models.py
from django.contrib.auth.models import Permission
from django.contrib.auth.models import Group as DjangoGroup
from django.db import models
from django.utils import timezone
from django.contrib.auth.models import User


class SoftDeleteQuerySet(models.QuerySet):
    def delete(self):
        """Override delete method to perform a soft delete."""
        return super().update(deleted_at=timezone.now())
    def soft_delete(self):
        """added same method to call a soft delete."""
        return super().update(deleted_at=timezone.now())
    def hard_delete(self):
        """Actually delete the objects from the database."""
        return super().delete()

    def active(self):
        """Return only non-deleted objects."""
        return self.filter(deleted_at__isnull=True)

    def with_deleted(self):
        """Include deleted objects in the queryset."""
        return self


class SoftDeleteManager(models.Manager):
    def get_queryset(self):
        """Return only non-deleted objects by default."""
        return SoftDeleteQuerySet(self.model, using=self._db).active()

    def with_deleted(self):
        """Include deleted objects in the queryset."""
        return self.get_queryset().with_deleted()

    def active(self):
        """Return only non-deleted objects."""
        return self.get_queryset().active()


class SoftDeleteModel(models.Model):
    deleted_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = SoftDeleteManager()
    # Ensure the all_objects manager doesn't filter by default
    all_objects = SoftDeleteQuerySet.as_manager()

    class Meta:
        abstract = True

    def soft_delete(self):
        """Mark the object as deleted by setting the deleted_at field to the current time."""
        self.deleted_at = timezone.now()
        self.save()

    def restore(self):
        """Restore the object by setting the deleted_at field to None."""
        self.deleted_at = None
        self.save()

    def delete(self, *args, **kwargs):
        """Override the delete method to perform a soft delete instead of a hard delete."""
        self.soft_delete()

class TimestampedModel(models.Model):
    # Default value set to the time of creation
    created_at = models.DateTimeField(auto_now_add=True)
    # Automatically updated whenever the model is saved
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True