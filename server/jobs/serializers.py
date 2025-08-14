from rest_framework import serializers
from .models import Job, JobCategory, Company, JobApplication, JobBookmark
from tags.serializers import TagSerializer
from auth_app.serializers import UserSerializer


class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = [
            'id', 'name', 'description', 'website', 'logo', 'location',
            'size', 'founded_year', 'created_at'
        ]


class JobCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = JobCategory
        fields = ['id', 'name', 'description']


class JobSerializer(serializers.ModelSerializer):
    company = CompanySerializer(read_only=True)
    category = JobCategorySerializer(read_only=True)
    skills_required = TagSerializer(many=True, read_only=True)
    posted_by = UserSerializer(read_only=True)
    salary_range = serializers.ReadOnlyField()
    is_bookmarked = serializers.SerializerMethodField()
    application_status = serializers.SerializerMethodField()
    
    # Write-only fields for creation
    company_id = serializers.IntegerField(write_only=True, required=False)
    category_id = serializers.IntegerField(write_only=True, required=False)
    skill_names = serializers.ListField(
        child=serializers.CharField(max_length=50),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = Job
        fields = [
            'id', 'title', 'description', 'requirements', 'company', 'category',
            'location', 'job_type', 'experience_level', 'salary_min', 'salary_max',
            'salary_currency', 'salary_range', 'remote_allowed', 'skills_required',
            'posted_by', 'is_active', 'application_deadline', 'external_url',
            'is_bookmarked', 'application_status', 'created_at', 'updated_at',
            'company_id', 'category_id', 'skill_names'
        ]
        read_only_fields = ['posted_by']
    
    def get_is_bookmarked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return JobBookmark.objects.filter(job=obj, user=request.user).exists()
        return False
    
    def get_application_status(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            application = JobApplication.objects.filter(job=obj, applicant=request.user).first()
            return application.status if application else None
        return None
    
    def create(self, validated_data):
        skill_names = validated_data.pop('skill_names', [])
        company_id = validated_data.pop('company_id', None)
        category_id = validated_data.pop('category_id', None)
        
        if company_id:
            validated_data['company_id'] = company_id
        if category_id:
            validated_data['category_id'] = category_id
            
        job = Job.objects.create(**validated_data)
        
        # Handle skills
        if skill_names:
            from tags.models import Tag
            for skill_name in skill_names:
                tag, created = Tag.objects.get_or_create(name=skill_name.lower())
                job.skills_required.add(tag)
        
        return job


class JobListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for job lists"""
    company = serializers.CharField(source='company.name', read_only=True)
    category = serializers.CharField(source='category.name', read_only=True)
    salary_range = serializers.ReadOnlyField()
    
    class Meta:
        model = Job
        fields = [
            'id', 'title', 'company', 'location', 'job_type', 'experience_level',
            'salary_range', 'remote_allowed', 'category', 'created_at'
        ]


class JobApplicationSerializer(serializers.ModelSerializer):
    applicant = UserSerializer(read_only=True)
    job = JobListSerializer(read_only=True)
    
    class Meta:
        model = JobApplication
        fields = [
            'id', 'job', 'applicant', 'status', 'cover_letter', 'resume',
            'applied_at', 'updated_at'
        ]
        read_only_fields = ['applicant', 'applied_at']


class JobBookmarkSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobBookmark
        fields = ['id', 'created_at']
        read_only_fields = ['id', 'created_at']
