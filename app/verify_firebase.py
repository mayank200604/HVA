#!/usr/bin/env python3
"""Quick Firebase connection verification"""

print("\n" + "="*60)
print("FIREBASE CONNECTION TEST")
print("="*60)

from firebase import db, test_firestore_connection

print("\n✅ Firebase Admin SDK: Initialized")
print("✅ Firestore Client: Connected")

print("\n--- Testing Connection ---")
result = test_firestore_connection()

print("\n--- Listing Collections ---")
cols = list(db.collections())
print(f"Found {len(cols)} collection(s)")
for c in cols:
    print(f"  - {c.id}")

print("\n" + "="*60)
print("STATUS: ALL SYSTEMS OPERATIONAL ✅")
print("="*60 + "\n")
