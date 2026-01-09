import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("🔍 Verifying Environment Variables from .env...");

const envPath = path.resolve(__dirname, '.env');

if (!fs.existsSync(envPath)) {
    console.error("❌ .env file not found!");
    process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};

envContent.split('\n').forEach(line => {
    line = line.trim();
    // primitive parsing
    if (line && !line.startsWith('#')) {
        const parts = line.split('=');
        const key = parts[0].trim();
        let value = parts.slice(1).join('=').trim();
        // remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        if (key) {
            envVars[key] = value;
        }
    }
});

const requiredKeys = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID'
];

let hasError = false;

requiredKeys.forEach(key => {
    const value = envVars[key];
    if (!value) {
        console.error(`❌ Missing in .env: ${key}`);
        hasError = true;
    } else {
        if (key === 'VITE_FIREBASE_STORAGE_BUCKET' && !value.endsWith('.appspot.com')) {
            console.warn(`⚠️ Warning: ${key} usually ends with '.appspot.com'. Value: ${value}`);
        }
        console.log(`✅ Found: ${key}`);
    }
});

if (hasError) {
    console.error("\n❌ Local Environment validation failed.");
} else {
    console.log("\n✅ Local .env looks good.");
    console.log("👉 ACTION REQUIRED: Go to your Vercel Project Settings -> Environment Variables");
    console.log("   and ensure all the above variables are added with the exact same values.");
    console.log("   Then REDEPLOY your application for changes to take effect.");
}
