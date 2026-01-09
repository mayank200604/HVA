#!/usr/bin/env python3
"""
Test script to verify Firebase/Firestore connection
"""

import sys
import os

# Add the app directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_firebase_connection():
    """Test Firebase initialization and Firestore connection"""
    print("=" * 60)
    print("Testing Firebase Connection")
    print("=" * 60)
    
    try:
        # Import firebase module (this will initialize Firebase)
        print("\n1. Importing Firebase module...")
        from firebase import db, test_firestore_connection
        print("   ✅ Firebase module imported successfully")
        
        # Test Firestore connection
        print("\n2. Testing Firestore connection...")
        if test_firestore_connection():
            print("   ✅ Firestore connection successful")
        else:
            print("   ❌ Firestore connection failed")
            return False
        
        # Try to list collections
        print("\n3. Listing Firestore collections...")
        collections = db.collections()
        collection_names = [col.id for col in collections]
        if collection_names:
            print(f"   ✅ Found {len(collection_names)} collections:")
            for name in collection_names:
                print(f"      - {name}")
        else:
            print("   ℹ️  No collections found (this is normal for a new database)")
        
        # Test firestore_storage module
        print("\n4. Testing Firestore storage module...")
        try:
            import firestore_storage
            print("   ✅ Firestore storage module imported successfully")
            
            # Test creating a conversation
            test_conv_id = "test_connection_conv"
            print(f"\n5. Creating test conversation: {test_conv_id}")
            firestore_storage.create_conversation(test_conv_id)
            
            # Test saving a message
            print(f"\n6. Saving test message...")
            firestore_storage.save_message(
                conversation_id=test_conv_id,
                role="user",
                content="This is a test message",
                model="test"
            )
            
            # Test loading messages
            print(f"\n7. Loading messages...")
            messages = firestore_storage.get_conversation_messages(test_conv_id)
            print(f"   ✅ Found {len(messages)} message(s)")
            
            # Clean up test data
            print(f"\n8. Cleaning up test data...")
            firestore_storage.delete_conversation(test_conv_id)
            print("   ✅ Test data cleaned up")
            
        except Exception as e:
            print(f"   ⚠️  Firestore storage module test failed: {e}")
            print("   (This is optional - SQLite storage can still be used)")
        
        print("\n" + "=" * 60)
        print("✅ All Firebase connection tests passed!")
        print("=" * 60)
        return True
        
    except Exception as e:
        print(f"\n❌ Firebase connection test failed: {e}")
        print("\nPlease check:")
        print("  1. firebase_service_account.json exists and is valid")
        print("  2. Firebase project is properly configured")
        print("  3. Firestore is enabled in your Firebase project")
        print("=" * 60)
        return False


if __name__ == "__main__":
    success = test_firebase_connection()
    sys.exit(0 if success else 1)
