# backend/firebase.py
import os
import firebase_admin
from firebase_admin import credentials, firestore, auth

# Get the directory where this file is located
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SERVICE_ACCOUNT_PATH = os.path.join(BASE_DIR, "firebase_service_account.json")

# Initialize Firebase Admin SDK
try:
    # Check if already initialized
    if not firebase_admin._apps:
        cred = credentials.Certificate(SERVICE_ACCOUNT_PATH)
        firebase_admin.initialize_app(cred)
        print("✅ Firebase Admin SDK initialized successfully")
    else:
        print("ℹ️  Firebase Admin SDK already initialized")
except Exception as e:
    print(f"❌ Error initializing Firebase: {e}")
    raise

# Get Firestore client
try:
    db = firestore.client()
    print("✅ Firestore client connected")
except Exception as e:
    print(f"❌ Error connecting to Firestore: {e}")
    raise

def test_firestore_connection():
    """Test Firestore connection by attempting to read from a test collection"""
    try:
        # Try to access a collection (this will verify the connection)
        test_ref = db.collection('_connection_test').document('test')
        test_ref.set({'timestamp': firestore.SERVER_TIMESTAMP, 'status': 'connected'})
        print("✅ Firestore connection test successful")
        return True
    except Exception as e:
        print(f"❌ Firestore connection test failed: {e}")
        return False
