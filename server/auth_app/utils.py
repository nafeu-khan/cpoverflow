from cryptography.fernet import Fernet
import base64
from django.conf import settings

def get_encryption_key():
    key = settings.SECRET_KEY[:32] 
    return base64.urlsafe_b64encode(key.encode())

def encrypt_uuid(uuid):
    fernet = Fernet(get_encryption_key())
    return fernet.encrypt(str(uuid).encode()).decode()

def decrypt_uuid(encrypted_uuid):
    fernet = Fernet(get_encryption_key())
    return fernet.decrypt(encrypted_uuid.encode()).decode()
