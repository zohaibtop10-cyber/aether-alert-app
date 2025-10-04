// IMPORTANT: This file is for server-side use only.
// It uses the Firebase Admin SDK, which has different initialization requirements
// and security considerations than the client-side SDK.

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, cert, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

function getServiceAccount() {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccount) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable is not set. This is required for server-side initialization.');
  }
  return JSON.parse(serviceAccount);
}

function getAdminSdks(app: App) {
  return {
    firebaseApp: app,
    auth: getAuth(app),
    firestore: getFirestore(app),
  };
}

export async function initializeFirebase() {
  const apps = getApps();
  if (!apps.length) {
    let app: App;
    try {
      // Automatic initialization for App Hosting
      app = initializeApp();
    } catch (e) {
      if (process.env.NODE_ENV === "production") {
        console.warn('Automatic Admin SDK initialization failed. Falling back to service account credentials.', e);
      }
      // Manual initialization for local dev or other environments
      app = initializeApp({
        credential: cert(getServiceAccount()),
        projectId: firebaseConfig.projectId,
      });
    }
    return getAdminSdks(app);
  }

  return getAdminSdks(getApp());
}
