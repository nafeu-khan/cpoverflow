from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class JobCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name_plural = "Job Categories"
        ordering = ['name']
    
    def __str__(self):
        return self.name


class Company(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    website = models.URLField(blank=True)
    logo = models.ImageField(upload_to='company_logos/', blank=True, null=True)
    location = models.CharField(max_length=200, blank=True)
    size = models.CharField(max_length=50, blank=True)  # e.g., "1-10", "11-50", etc.
    founded_year = models.PositiveIntegerField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name_plural = "Companies"
        ordering = ['name']
    
    def __str__(self):
        return self.name


class Job(models.Model):
    JOB_TYPES = [
        ('full_time', 'Full Time'),
        ('part_time', 'Part Time'),
        ('contract', 'Contract'),
        ('internship', 'Internship'),
        ('freelance', 'Freelance'),
    ]
    
    EXPERIENCE_LEVELS = [
        ('entry', 'Entry Level'),
        ('mid', 'Mid Level'),
        ('senior', 'Senior Level'),
        ('lead', 'Lead'),
        ('executive', 'Executive'),
    ]
    
    title = models.CharField(max_length=200)
    description = models.TextField()
    requirements = models.TextField()
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='jobs')
    category = models.ForeignKey(JobCategory, on_delete=models.SET_NULL, null=True, related_name='jobs')
    location = models.CharField(max_length=200)
    job_type = models.CharField(max_length=20, choices=JOB_TYPES, default='full_time')
    experience_level = models.CharField(max_length=20, choices=EXPERIENCE_LEVELS, default='mid')
    salary_min = models.PositiveIntegerField(blank=True, null=True)
    salary_max = models.PositiveIntegerField(blank=True, null=True)
    salary_currency = models.CharField(max_length=3, default='USD')
    remote_allowed = models.BooleanField(default=False)
    skills_required = models.ManyToManyField('tags.Tag', blank=True, related_name='job_requirements')
    posted_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posted_jobs')
    is_active = models.BooleanField(default=True)
    application_deadline = models.DateTimeField(blank=True, null=True)
    external_url = models.URLField(blank=True, help_text="External application URL")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['is_active', 'created_at']),
            models.Index(fields=['location']),
            models.Index(fields=['job_type']),
        ]
    
    def __str__(self):
        return f"{self.title} at {self.company.name}"
    
    @property
    def salary_range(self):
        if self.salary_min and self.salary_max:
            return f"{self.salary_currency} {self.salary_min:,} - {self.salary_max:,}"
        elif self.salary_min:
            return f"{self.salary_currency} {self.salary_min:,}+"
        return "Salary not specified"


class JobApplication(models.Model):
    STATUS_CHOICES = [
        ('applied', 'Applied'),
        ('reviewing', 'Under Review'),
        ('interview', 'Interview'),
        ('offered', 'Offered'),
        ('rejected', 'Rejected'),
        ('withdrawn', 'Withdrawn'),
    ]
    
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='applications')
    applicant = models.ForeignKey(User, on_delete=models.CASCADE, related_name='job_applications')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='applied')
    cover_letter = models.TextField(blank=True)
    resume = models.FileField(upload_to='resumes/', blank=True, null=True)
    applied_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['job', 'applicant']
        ordering = ['-applied_at']
    
    def __str__(self):
        return f"{self.applicant.username} applied for {self.job.title}"


class JobBookmark(models.Model):
    """User bookmarks for jobs"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookmarked_jobs')
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='bookmarks')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'job']
