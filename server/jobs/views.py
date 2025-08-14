from rest_framework.views import APIView
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q
from django.shortcuts import get_object_or_404
from .models import Job, JobCategory, Company, JobApplication, JobBookmark
from .serializers import (
    JobSerializer, JobListSerializer, JobCategorySerializer, 
    CompanySerializer, JobApplicationSerializer, JobBookmarkSerializer
)


class JobPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class JobListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get(self, request):
        """List jobs with filtering and pagination"""
        queryset = Job.objects.filter(is_active=True).select_related('company', 'category')
        
        # Search functionality
        search = request.query_params.get('search', '')
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | 
                Q(description__icontains=search) |
                Q(company__name__icontains=search) |
                Q(skills_required__name__icontains=search)
            ).distinct()
        
        # Filter by location
        location = request.query_params.get('location', '')
        if location:
            queryset = queryset.filter(location__icontains=location)
        
        # Filter by job type
        job_type = request.query_params.get('job_type', '')
        if job_type:
            queryset = queryset.filter(job_type=job_type)
        
        # Filter by experience level
        experience = request.query_params.get('experience', '')
        if experience:
            queryset = queryset.filter(experience_level=experience)
        
        # Filter by remote
        remote = request.query_params.get('remote', '')
        if remote.lower() == 'true':
            queryset = queryset.filter(remote_allowed=True)
        
        # Filter by salary range
        min_salary = request.query_params.get('min_salary', '')
        if min_salary:
            queryset = queryset.filter(salary_min__gte=int(min_salary))
        
        # Sorting
        sort_by = request.query_params.get('sort', 'newest')
        if sort_by == 'oldest':
            queryset = queryset.order_by('created_at')
        elif sort_by == 'salary_high':
            queryset = queryset.order_by('-salary_max', '-salary_min')
        elif sort_by == 'salary_low':
            queryset = queryset.order_by('salary_min', 'salary_max')
        else:  # newest
            queryset = queryset.order_by('-created_at')
        
        # Pagination
        paginator = JobPagination()
        page = paginator.paginate_queryset(queryset, request)
        
        serializer = JobListSerializer(page, many=True, context={'request': request})
        return paginator.get_paginated_response(serializer.data)
    
    def post(self, request):
        """Create new job"""
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        serializer = JobSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(posted_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class JobDetailView(APIView):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_object(self, pk):
        try:
            return Job.objects.select_related('company', 'category').prefetch_related('skills_required').get(pk=pk)
        except Job.DoesNotExist:
            return None
    
    def get(self, request, pk):
        """Retrieve job details"""
        job = self.get_object(pk)
        if not job:
            return Response(
                {'error': 'Job not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = JobSerializer(job, context={'request': request})
        return Response(serializer.data)
    
    def put(self, request, pk):
        """Update job"""
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        job = self.get_object(pk)
        if not job:
            return Response(
                {'error': 'Job not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        if job.posted_by != request.user:
            return Response(
                {'error': 'You can only edit your own job postings.'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = JobSerializer(job, data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, pk):
        """Delete job"""
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        job = self.get_object(pk)
        if not job:
            return Response(
                {'error': 'Job not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        if job.posted_by != request.user:
            return Response(
                {'error': 'You can only delete your own job postings.'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        job.delete()
        return Response(
            {'message': 'Job deleted successfully'}, 
            status=status.HTTP_204_NO_CONTENT
        )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def apply_job(request, job_id):
    """Apply for a job"""
    job = get_object_or_404(Job, id=job_id)
    
    # Check if user already applied
    if JobApplication.objects.filter(job=job, applicant=request.user).exists():
        return Response(
            {'error': 'You have already applied for this job.'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    serializer = JobApplicationSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(job=job, applicant=request.user)
        return Response({'message': 'Application submitted successfully.'})
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST', 'DELETE'])
@permission_classes([permissions.IsAuthenticated])
def bookmark_job(request, job_id):
    """Bookmark or unbookmark a job"""
    job = get_object_or_404(Job, id=job_id)
    
    if request.method == 'POST':
        bookmark, created = JobBookmark.objects.get_or_create(
            user=request.user,
            job=job
        )
        
        if created:
            return Response({'message': 'Job bookmarked successfully.'})
        else:
            return Response(
                {'message': 'Job already bookmarked.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    elif request.method == 'DELETE':
        try:
            bookmark = JobBookmark.objects.get(user=request.user, job=job)
            bookmark.delete()
            return Response({'message': 'Bookmark removed successfully.'})
        except JobBookmark.DoesNotExist:
            return Response(
                {'error': 'Job is not bookmarked.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )


class CompanyListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get(self, request):
        """List companies"""
        companies = Company.objects.all()
        serializer = CompanySerializer(companies, many=True, context={'request': request})
        return Response(serializer.data)
    
    def post(self, request):
        """Create new company"""
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        serializer = CompanySerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class JobCategoryListView(APIView):
    def get(self, request):
        """List job categories"""
        categories = JobCategory.objects.all()
        serializer = JobCategorySerializer(categories, many=True, context={'request': request})
        return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_job_applications(request):
    """Get current user's job applications"""
    applications = JobApplication.objects.filter(applicant=request.user).select_related('job__company')
    serializer = JobApplicationSerializer(applications, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_posted_jobs(request):
    """Get jobs posted by current user"""
    jobs = Job.objects.filter(posted_by=request.user).select_related('company', 'category')
    serializer = JobListSerializer(jobs, many=True, context={'request': request})
    return Response(serializer.data)
