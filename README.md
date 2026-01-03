# Nafsi Web SDK

A lightweight, framework-agnostic JavaScript SDK for seamless identity verification in web browsers. Capture ID documents and selfies directly in your web application with a beautiful, customizable UI.

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/nafsi-ai/web-sdk)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Size](https://img.shields.io/badge/size-32KB-brightgreen.svg)](dist/nafsi.js)

## 🚀 Features

- ✅ **Zero Dependencies** - Pure JavaScript, no external libraries required
- 📸 **Smart Capture** - Guided camera capture with visual guides for ID cards and selfies
- 🎨 **Portal-Configured Theming** - Branding set in Nafsi portal (logo, colors, organization name)
- 📱 **Mobile Responsive** - Works seamlessly on desktop and mobile devices
- 🔒 **Secure** - All processing happens in-browser, images sent directly to your backend
- ⚡ **Lightweight** - Only 32KB minified
- 🌐 **Framework Agnostic** - Works with vanilla JS, React, Angular, Vue, and more
- ♿ **User-Friendly** - Clear error messages and intuitive flow

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Installation](#installation)
- [Basic Usage](#basic-usage)
- [Integration Examples](#integration-examples)
  - [Vanilla JavaScript](#vanilla-javascript)
  - [React / React PWA](#react--react-pwa)
  - [Angular / Angular PWA](#angular--angular-pwa)
  - [Vue.js](#vuejs)
  - [Next.js](#nextjs)
- [API Reference](#api-reference)
- [Verification Flow](#verification-flow)
- [Error Handling](#error-handling)
- [Browser Support](#browser-support)
- [Troubleshooting](#troubleshooting)
- [Examples](#examples)

## 🎯 Quick Start

```html
<!DOCTYPE html>
<html>
<head>
  <title>ID Verification</title>
</head>
<body>
  <button onclick="startVerification()">Verify Identity</button>

  <script src="https://sdk.nafsi.ai/v1/nafsi.js"></script>
  <script>
    function startVerification() {
      Nafsi.init({
        workflowId: 'your-workflow-id',
        clientId: 'your-client-id',
        onSuccess: (result) => {
          console.log('Verification passed:', result);
          alert('Verification successful!');
        },
        onFailure: (error) => {
          console.error('Verification failed:', error);
          alert('Verification failed: ' + error.error);
        }
      });
    }
  </script>
</body>
</html>
```

## 📦 Installation

### CDN (Recommended)

Include the SDK directly from our CDN:

```html
<script src="https://sdk.nafsi.ai/v1/nafsi.js"></script>
```

### Self-Hosted

Download the SDK and host it yourself:

```bash
# Download the latest version
curl -O https://sdk.nafsi.ai/v1/nafsi.js

# Or use wget
wget https://sdk.nafsi.ai/v1/nafsi.js
```

Then include it in your HTML:

```html
<script src="/path/to/nafsi.js"></script>
```

### NPM (Coming Soon)

```bash
npm install @nafsi/web-sdk
```

## 🎮 Basic Usage

### Step 1: Get Your Credentials

1. Sign up at [nafsi.ai](https://nafsi.ai)
2. Create a workflow in the portal
3. Configure your branding (logo, colors, organization name)
4. Get your `workflowId` and `clientId`

### Step 2: Include the SDK

```html
<script src="https://sdk.nafsi.ai/v1/nafsi.js"></script>
```

### Step 3: Initialize and Start

```javascript
Nafsi.init({
  workflowId: 'your-workflow-id',
  clientId: 'your-client-id',
  onSuccess: (result) => {
    // Verification successful
    console.log('Verification data:', result);
  },
  onFailure: (error) => {
    // Verification failed
    console.error('Error:', error);
  }
});
```

The SDK automatically starts the verification flow once initialized.

## 🔧 Integration Examples

### Vanilla JavaScript

Perfect for static websites or simple web applications.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Identity Verification</title>
  <style>
    .verify-btn {
      padding: 12px 24px;
      font-size: 16px;
      background: #00b8ff;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Complete Your Verification</h1>
    <p>Please verify your identity to continue.</p>
    <button class="verify-btn" onclick="startVerification()">
      Start Verification
    </button>
    <div id="result"></div>
  </div>

  <script src="https://sdk.nafsi.ai/v1/nafsi.js"></script>
  <script>
    function startVerification() {
      Nafsi.init({
        workflowId: 'your-workflow-id',
        clientId: 'your-client-id',
        onSuccess: function(result) {
          document.getElementById('result').innerHTML =
            '<p style="color: green;">✓ Verification successful!</p>';

          // Send result to your backend
          fetch('/api/verification/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(result)
          });
        },
        onFailure: function(error) {
          document.getElementById('result').innerHTML =
            '<p style="color: red;">✗ Verification failed. Please try again.</p>';
        }
      });
    }
  </script>
</body>
</html>
```

### React / React PWA

Integration with React applications and Progressive Web Apps.

#### Option 1: Load SDK via Script Tag (Recommended)

**public/index.html**
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>My React App</title>
    <!-- Load Nafsi SDK -->
    <script src="https://sdk.nafsi.ai/v1/nafsi.js"></script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
```

**src/components/VerificationButton.jsx**
```jsx
import React, { useState } from 'react';

const VerificationButton = ({ onVerificationComplete }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleVerification = () => {
    setIsLoading(true);
    setError(null);

    // Check if SDK is loaded
    if (typeof window.Nafsi === 'undefined') {
      setError('Verification SDK not loaded');
      setIsLoading(false);
      return;
    }

    window.Nafsi.init({
      workflowId: process.env.REACT_APP_NAFSI_WORKFLOW_ID,
      clientId: process.env.REACT_APP_NAFSI_CLIENT_ID,
      onSuccess: (result) => {
        console.log('Verification successful:', result);
        setIsLoading(false);

        // Call parent callback
        if (onVerificationComplete) {
          onVerificationComplete(result);
        }
      },
      onFailure: (error) => {
        console.error('Verification failed:', error);
        setError(error.error || 'Verification failed');
        setIsLoading(false);
      }
    });
  };

  return (
    <div>
      <button
        onClick={handleVerification}
        disabled={isLoading}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          background: '#00b8ff',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          opacity: isLoading ? 0.6 : 1
        }}
      >
        {isLoading ? 'Processing...' : 'Verify Identity'}
      </button>
      {error && (
        <p style={{ color: 'red', marginTop: '8px' }}>{error}</p>
      )}
    </div>
  );
};

export default VerificationButton;
```

**Usage in App**
```jsx
import React from 'react';
import VerificationButton from './components/VerificationButton';

function App() {
  const handleVerificationComplete = async (result) => {
    // Send to your backend
    try {
      const response = await fetch('/api/verification/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result)
      });

      if (response.ok) {
        console.log('Verification saved successfully');
      }
    } catch (error) {
      console.error('Failed to save verification:', error);
    }
  };

  return (
    <div className="App">
      <h1>Complete Your Verification</h1>
      <VerificationButton onVerificationComplete={handleVerificationComplete} />
    </div>
  );
}

export default App;
```

#### Option 2: Custom Hook

**src/hooks/useNafsiVerification.js**
```javascript
import { useState, useCallback } from 'react';

export const useNafsiVerification = (config) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState(null);

  const startVerification = useCallback(() => {
    if (typeof window.Nafsi === 'undefined') {
      setError('Nafsi SDK not loaded');
      return;
    }

    setIsVerifying(true);
    setError(null);

    window.Nafsi.init({
      workflowId: config.workflowId,
      clientId: config.clientId,
      onSuccess: (result) => {
        setIsVerifying(false);
        if (config.onSuccess) {
          config.onSuccess(result);
        }
      },
      onFailure: (error) => {
        setIsVerifying(false);
        setError(error);
        if (config.onFailure) {
          config.onFailure(error);
        }
      }
    });
  }, [config]);

  return {
    startVerification,
    isVerifying,
    error
  };
};
```

**Usage**
```jsx
import { useNafsiVerification } from './hooks/useNafsiVerification';

function MyComponent() {
  const { startVerification, isVerifying, error } = useNafsiVerification({
    workflowId: process.env.REACT_APP_NAFSI_WORKFLOW_ID,
    clientId: process.env.REACT_APP_NAFSI_CLIENT_ID,
    onSuccess: (result) => {
      console.log('Success:', result);
    },
    onFailure: (error) => {
      console.error('Failed:', error);
    }
  });

  return (
    <button onClick={startVerification} disabled={isVerifying}>
      {isVerifying ? 'Verifying...' : 'Start Verification'}
    </button>
  );
}
```

### Angular / Angular PWA

Integration with Angular applications and PWAs.

**src/index.html**
```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>My Angular App</title>
  <base href="/">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <!-- Load Nafsi SDK -->
  <script src="https://sdk.nafsi.ai/v1/nafsi.js"></script>
</head>
<body>
  <app-root></app-root>
</body>
</html>
```

**src/app/services/nafsi-verification.service.ts**
```typescript
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

// Declare Nafsi on window
declare global {
  interface Window {
    Nafsi: any;
  }
}

export interface NafsiConfig {
  workflowId: string;
  clientId: string;
}

export interface VerificationResult {
  success: boolean;
  verification_id?: string;
  result?: any;
}

@Injectable({
  providedIn: 'root'
})
export class NafsiVerificationService {
  private verificationSubject = new Subject<VerificationResult>();

  constructor() {}

  startVerification(config: NafsiConfig): Observable<VerificationResult> {
    if (typeof window.Nafsi === 'undefined') {
      throw new Error('Nafsi SDK not loaded');
    }

    window.Nafsi.init({
      workflowId: config.workflowId,
      clientId: config.clientId,
      onSuccess: (result: any) => {
        this.verificationSubject.next({
          success: true,
          ...result
        });
      },
      onFailure: (error: any) => {
        this.verificationSubject.next({
          success: false,
          result: error
        });
      }
    });

    return this.verificationSubject.asObservable();
  }
}
```

**src/app/components/verification/verification.component.ts**
```typescript
import { Component } from '@angular/core';
import { NafsiVerificationService } from '../../services/nafsi-verification.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-verification',
  templateUrl: './verification.component.html',
  styleUrls: ['./verification.component.css']
})
export class VerificationComponent {
  isVerifying = false;
  errorMessage: string | null = null;

  constructor(private nafsiService: NafsiVerificationService) {}

  startVerification() {
    this.isVerifying = true;
    this.errorMessage = null;

    this.nafsiService.startVerification({
      workflowId: environment.nafsi.workflowId,
      clientId: environment.nafsi.clientId
    }).subscribe({
      next: (result) => {
        this.isVerifying = false;
        if (result.success) {
          console.log('Verification successful:', result);
          // Handle success
        } else {
          this.errorMessage = 'Verification failed. Please try again.';
        }
      },
      error: (error) => {
        this.isVerifying = false;
        this.errorMessage = error.message;
      }
    });
  }
}
```

**src/app/components/verification/verification.component.html**
```html
<div class="verification-container">
  <h2>Identity Verification</h2>
  <p>Please verify your identity to continue</p>

  <button
    (click)="startVerification()"
    [disabled]="isVerifying"
    class="verify-btn">
    {{ isVerifying ? 'Verifying...' : 'Start Verification' }}
  </button>

  <p *ngIf="errorMessage" class="error">{{ errorMessage }}</p>
</div>
```

**src/environments/environment.ts**
```typescript
export const environment = {
  production: false,
  nafsi: {
    workflowId: 'your-workflow-id',
    clientId: 'your-client-id'
  }
};
```

### Vue.js

Integration with Vue.js applications.

**public/index.html**
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1.0">
    <title>My Vue App</title>
    <script src="https://sdk.nafsi.ai/v1/nafsi.js"></script>
  </head>
  <body>
    <div id="app"></div>
  </body>
</html>
```

**src/components/VerificationButton.vue**
```vue
<template>
  <div class="verification">
    <button
      @click="startVerification"
      :disabled="isVerifying"
      class="verify-btn"
    >
      {{ isVerifying ? 'Verifying...' : 'Start Verification' }}
    </button>
    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
  </div>
</template>

<script>
export default {
  name: 'VerificationButton',
  data() {
    return {
      isVerifying: false,
      errorMessage: null
    };
  },
  methods: {
    startVerification() {
      if (typeof window.Nafsi === 'undefined') {
        this.errorMessage = 'Verification SDK not loaded';
        return;
      }

      this.isVerifying = true;
      this.errorMessage = null;

      window.Nafsi.init({
        workflowId: process.env.VUE_APP_NAFSI_WORKFLOW_ID,
        clientId: process.env.VUE_APP_NAFSI_CLIENT_ID,
        onSuccess: (result) => {
          console.log('Verification successful:', result);
          this.isVerifying = false;
          this.$emit('verification-success', result);
        },
        onFailure: (error) => {
          console.error('Verification failed:', error);
          this.errorMessage = error.error || 'Verification failed';
          this.isVerifying = false;
          this.$emit('verification-failure', error);
        }
      });
    }
  }
};
</script>

<style scoped>
.verify-btn {
  padding: 12px 24px;
  font-size: 16px;
  background: #00b8ff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.verify-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error {
  color: #d32f2f;
  margin-top: 8px;
}
</style>
```

### Next.js

Integration with Next.js applications (React framework).

**pages/_document.js**
```jsx
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html>
      <Head>
        {/* Load Nafsi SDK */}
        <script src="https://sdk.nafsi.ai/v1/nafsi.js" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
```

**components/VerificationButton.jsx**
```jsx
'use client'; // For Next.js 13+ App Router

import { useState } from 'react';

export default function VerificationButton() {
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState(null);

  const handleVerification = () => {
    if (typeof window.Nafsi === 'undefined') {
      setError('Verification SDK not loaded');
      return;
    }

    setIsVerifying(true);
    setError(null);

    window.Nafsi.init({
      workflowId: process.env.NEXT_PUBLIC_NAFSI_WORKFLOW_ID,
      clientId: process.env.NEXT_PUBLIC_NAFSI_CLIENT_ID,
      onSuccess: async (result) => {
        console.log('Verification successful:', result);

        // Send to API route
        await fetch('/api/verification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(result)
        });

        setIsVerifying(false);
      },
      onFailure: (error) => {
        console.error('Verification failed:', error);
        setError(error.error || 'Verification failed');
        setIsVerifying(false);
      }
    });
  };

  return (
    <div>
      <button onClick={handleVerification} disabled={isVerifying}>
        {isVerifying ? 'Verifying...' : 'Start Verification'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
```

**.env.local**
```
NEXT_PUBLIC_NAFSI_WORKFLOW_ID=your-workflow-id
NEXT_PUBLIC_NAFSI_CLIENT_ID=your-client-id
```

## 📚 API Reference

### `Nafsi.init(options)`

Initializes the SDK and starts the verification flow.

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `workflowId` | `string` | ✅ Yes | Your workflow ID from the Nafsi portal |
| `clientId` | `string` | ✅ Yes | Your client ID from the Nafsi portal |
| `onSuccess` | `function` | ✅ Yes | Callback function called when verification succeeds |
| `onFailure` | `function` | ✅ Yes | Callback function called when verification fails |
| `apiUrl` | `string` | ❌ No | Custom API endpoint (default: production endpoint) |
| `debug` | `boolean` | ❌ No | Enable debug logging (default: `false`) |

#### Success Callback

```javascript
onSuccess: (result) => {
  // result structure:
  {
    success: true,
    verification_id: "ver_abc123",
    result: {
      approved: true,
      confidence: 0.95,
      extracted_data: {
        full_name: "John Doe",
        id_number: "123456789",
        dob: "1990-01-01"
      }
    }
  }
}
```

#### Failure Callback

```javascript
onFailure: (error) => {
  // error structure:
  {
    error: "Verification failed",
    code: "API_ERROR" // or "CAMERA_ERROR", "NETWORK_ERROR"
  }
}
```

### `Nafsi.close()`

Closes the verification modal.

```javascript
Nafsi.close();
```

### `Nafsi.getVersion()`

Returns the SDK version.

```javascript
const version = Nafsi.getVersion();
console.log(version); // "1.0.0"
```

### `Nafsi.isInitialized()`

Checks if the SDK is initialized.

```javascript
const initialized = Nafsi.isInitialized();
console.log(initialized); // true or false
```

## 🔄 Verification Flow

The SDK guides users through a 4-step verification process:

### 1. Capture ID Front
- User positions ID card on a flat surface
- Rectangle guide shows proper alignment
- Camera captures front of ID card (590x372 pixels)

### 2. Capture ID Back
- User flips ID card
- Captures back of ID card
- Same rectangle guide for alignment

### 3. Take Selfie
- User positions face within silhouette guide
- Face guide shows proper alignment and distance
- Camera captures selfie (640x640 pixels)

### 4. Processing & Verification
- Images sent to backend for processing
- Face matching and liveness detection
- Document authenticity verification
- Results returned via callbacks

## ⚠️ Error Handling

The SDK provides user-friendly error messages for different scenarios:

### Error Codes

| Code | Description | User Message |
|------|-------------|--------------|
| `CAMERA_ERROR` | Camera access denied | "Please enable camera permissions and try again." |
| `API_ERROR` | Verification failed | "Unable to process your verification. Please try again later." |
| `NETWORK_ERROR` | Network connection issue | "Please check your internet connection and try again." |

### Handling Errors

```javascript
Nafsi.init({
  // ... config
  onFailure: (error) => {
    switch (error.code) {
      case 'CAMERA_ERROR':
        // Guide user to enable camera permissions
        showCameraPermissionHelp();
        break;
      case 'API_ERROR':
        // Retry or show support contact
        showRetryOption();
        break;
      case 'NETWORK_ERROR':
        // Check network and retry
        checkNetworkAndRetry();
        break;
      default:
        // Generic error handling
        showGenericError();
    }
  }
});
```

## 🌐 Browser Support

| Browser | Minimum Version | Notes |
|---------|----------------|-------|
| Chrome | 60+ | ✅ Fully supported |
| Firefox | 55+ | ✅ Fully supported |
| Safari | 11+ | ✅ Fully supported |
| Edge | 79+ | ✅ Fully supported |
| Mobile Safari | 11+ | ✅ Fully supported |
| Chrome Mobile | 60+ | ✅ Fully supported |

### Requirements

- **HTTPS**: The SDK requires HTTPS (or localhost for development)
- **Camera Permission**: Users must grant camera access
- **getUserMedia API**: Browser must support MediaDevices API

## 🔧 Troubleshooting

### SDK Not Loading

```javascript
// Check if SDK is loaded
if (typeof window.Nafsi === 'undefined') {
  console.error('Nafsi SDK not loaded');
  // Load SDK dynamically
  const script = document.createElement('script');
  script.src = 'https://sdk.nafsi.ai/v1/nafsi.js';
  script.onload = () => console.log('SDK loaded');
  document.head.appendChild(script);
}
```

### Camera Not Working

1. **Check HTTPS**: Camera only works on HTTPS or localhost
2. **Check Permissions**: Ensure user granted camera permission
3. **Check Browser Support**: Verify browser supports getUserMedia

```javascript
// Check camera support
if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
  alert('Your browser does not support camera access');
}
```

### CORS Issues

If hosting the SDK yourself, ensure proper CORS headers:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

### Mobile Issues

- Ensure viewport meta tag is set:
  ```html
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ```
- Test on actual devices, not just emulators
- Check camera permissions in mobile browser settings

## 📖 Examples

Check out the `test.html` file for a complete working example.

### Environment Variables

Store credentials securely using environment variables:

**React (.env)**
```
REACT_APP_NAFSI_WORKFLOW_ID=your-workflow-id
REACT_APP_NAFSI_CLIENT_ID=your-client-id
```

**Next.js (.env.local)**
```
NEXT_PUBLIC_NAFSI_WORKFLOW_ID=your-workflow-id
NEXT_PUBLIC_NAFSI_CLIENT_ID=your-client-id
```

**Angular (environment.ts)**
```typescript
export const environment = {
  nafsi: {
    workflowId: 'your-workflow-id',
    clientId: 'your-client-id'
  }
};
```

## 🎨 Theming

Themes are configured in the Nafsi portal when creating your workflow:
- **Organization Name**: Displayed in modal header
- **Logo**: Your company logo (40px height recommended)
- **Primary Color**: Buttons, borders, highlights
- **Secondary Color**: Header background
- **Accent Color**: Additional UI elements

The SDK automatically uses your portal configuration.

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Support

- **Documentation**: [https://docs.nafsi.ai](https://docs.nafsi.ai)
- **Email**: support@nafsi.ai
- **GitHub Issues**: [https://github.com/nafsi-ai/web-sdk/issues](https://github.com/nafsi-ai/web-sdk/issues)

## 🔄 Changelog

### Version 1.0.0 (2026-01-03)
- Initial release
- Face silhouette guide for selfies
- User-friendly error messages
- Portal-based theming
- Framework-agnostic design

---

Made with ❤️ by [Nafsi AI](https://nafsi.ai)
