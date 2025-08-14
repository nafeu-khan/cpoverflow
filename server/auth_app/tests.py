from django.test import TestCase

# Create your tests here.
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework_simplejwt.tokens import RefreshToken
from django.core import mail

User = get_user_model()

class UserAuthTests(APITestCase):

    def setUp(self):
        self.register_url = reverse('register')
        self.verify_email_url = reverse('verify_email')
        self.login_url = reverse('login')
        self.forgot_password_url = reverse('forgot_password')
        self.reset_password_url = reverse('reset_password')
        self.varify_token_url = reverse('varify_token')

        self.user_data = {
            'username': 'testuser',
            'email': 'testuser@example.com',
            'password': 'password123',
            'profile_picture': None,
            'address': '123 Test St',
            'phone_number': '1234567890',
            'bio': 'Test bio',
        }

    def test_register_user(self):
        response = self.client.post(self.register_url, self.user_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("User registered successfully", response.data['message'])
        self.assertTrue(User.objects.filter(email=self.user_data['email']).exists())

        # Check if an email was sent
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("Verify Your Email", mail.outbox[0].subject)

    def test_verify_email(self):
        # Register the user
        user = User.objects.create_user(**self.user_data)
        token = RefreshToken.for_user(user)
        uid = user.id

        response = self.client.post(self.verify_email_url, {
            'uid': uid,
            'token': str(token.access_token)
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        user.refresh_from_db()
        self.assertTrue(user.is_verified)

    def test_login_user(self):
        # Register and verify the user
        user = User.objects.create_user(**self.user_data, is_verified=True)
        login_data = {'username': self.user_data['username'], 'password': self.user_data['password']}

        response = self.client.post(self.login_url, login_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_forgot_password(self):
        # Create the user
        user = User.objects.create_user(**self.user_data)

        response = self.client.post(self.forgot_password_url, {'email': self.user_data['email']}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('Password reset email sent', response.data['message'])

        # Check if an email was sent
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("Password Reset", mail.outbox[0].subject)

    def test_reset_password(self):
        # Create the user
        user = User.objects.create_user(**self.user_data)
        token = RefreshToken.for_user(user)
        uid = user.id

        response = self.client.post(self.reset_password_url, {
            'uid': uid,
            'token': str(token.access_token),
            'new_password': 'newpassword123'
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        user.refresh_from_db()
        self.assertTrue(user.check_password('newpassword123'))

    def test_varify_token(self):
        # Create the user
        user = User.objects.create_user(**self.user_data)
        token = RefreshToken.for_user(user)
        uid = user.id

        response = self.client.post(self.varify_token_url, {
            'id': uid,
            'token': str(token.access_token)
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('Token is valid', response.data['message'])
