import { APIClient } from '../api/client.js';
import logger from '../utils/logger.js';

/**
 * Main Modal Component for the verification flow
 */
export class Modal {
  constructor(config) {
    this.config = config;
    this.camera = null;
    this.images = {
      selfie: null,
      idFront: null,
      idBack: null
    };
    this.currentStep = 'idFront'; // idFront -> idBack -> selfie -> processing
    this.overlay = null;

    this.createElements();
    this.attachEventListeners();
  }

  /**
   * Lighten a hex color
   * @param {string} color - Hex color
   * @param {number} amount - Amount to lighten (0-1)
   * @returns {string} - Lightened color
   */
  lightenColor(color, amount) {
    const num = parseInt(color.replace('#', ''), 16);
    const r = Math.min(255, Math.floor((num >> 16) + (255 - (num >> 16)) * amount));
    const g = Math.min(255, Math.floor(((num >> 8) & 0x00FF) + (255 - ((num >> 8) & 0x00FF)) * amount));
    const b = Math.min(255, Math.floor((num & 0x0000FF) + (255 - (num & 0x0000FF)) * amount));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  }

  /**
   * Darken a hex color
   * @param {string} color - Hex color
   * @param {number} amount - Amount to darken (0-1)
   * @returns {string} - Darkened color
   */
  darkenColor(color, amount) {
    const num = parseInt(color.replace('#', ''), 16);
    const r = Math.max(0, Math.floor((num >> 16) * (1 - amount)));
    const g = Math.max(0, Math.floor(((num >> 8) & 0x00FF) * (1 - amount)));
    const b = Math.max(0, Math.floor((num & 0x0000FF) * (1 - amount)));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  }

  /**
   * Create modal DOM elements
   */
  createElements() {
    // Create modal overlay
    this.overlay = document.createElement('div');
    this.overlay.id = 'nafsi-sdk-overlay';
    this.overlay.innerHTML = `
      <div class="nafsi-modal">
        <div class="nafsi-modal-header">
          ${this.config.logo ? `<img src="${this.config.logo}" alt="Logo" class="nafsi-logo" />` : ''}
          <h2 id="nafsi-step-title">${this.config.organizationName || 'Identity Verification'}</h2>
          <button class="nafsi-close-btn" aria-label="Close">&times;</button>
        </div>
        <div class="nafsi-modal-body">
          <div id="nafsi-instructions" class="nafsi-instructions"></div>
          <div id="nafsi-camera-container" class="nafsi-camera-container">
            <video id="nafsi-video" autoplay playsinline muted></video>
            <canvas id="nafsi-canvas" style="display:none;"></canvas>
            <div class="nafsi-camera-guide"></div>
            <div class="nafsi-face-guide">
              <svg viewBox="0 0 200 240" xmlns="http://www.w3.org/2000/svg">
                <!-- Head outline -->
                <ellipse cx="100" cy="90" rx="70" ry="85" fill="none" stroke="white" stroke-width="3" opacity="0.6"/>
                <!-- Face guide lines -->
                <path d="M 100 50 L 100 130" stroke="white" stroke-width="1" opacity="0.3" stroke-dasharray="5,5"/>
                <path d="M 50 90 L 150 90" stroke="white" stroke-width="1" opacity="0.3" stroke-dasharray="5,5"/>
                <!-- Eyes -->
                <circle cx="75" cy="80" r="8" fill="white" opacity="0.4"/>
                <circle cx="125" cy="80" r="8" fill="white" opacity="0.4"/>
                <!-- Nose -->
                <path d="M 100 90 L 95 105 L 105 105 Z" fill="white" opacity="0.3"/>
                <!-- Mouth -->
                <path d="M 80 120 Q 100 130 120 120" stroke="white" stroke-width="2" fill="none" opacity="0.4"/>
                <!-- Shoulders -->
                <path d="M 30 175 Q 50 160 100 165 Q 150 160 170 175 L 170 240 L 30 240 Z" fill="none" stroke="white" stroke-width="3" opacity="0.5"/>
              </svg>
              <p class="face-guide-text">Position your face here</p>
            </div>
          </div>
          <div id="nafsi-preview-container" class="nafsi-preview-container" style="display:none;">
            <img id="nafsi-preview-img" alt="Captured image" />
            <div class="nafsi-preview-actions">
              <button class="nafsi-btn nafsi-btn-secondary" id="nafsi-retake-btn">Retake</button>
              <button class="nafsi-btn nafsi-btn-primary" id="nafsi-continue-btn">Continue</button>
            </div>
          </div>
          <div id="nafsi-processing" class="nafsi-processing" style="display:none;">
            <div class="nafsi-spinner"></div>
            <p>Processing your verification...</p>
          </div>
          <div id="nafsi-error" class="nafsi-error" style="display:none;">
            <div class="nafsi-error-icon">⚠️</div>
            <h3 id="nafsi-error-title">Verification Failed</h3>
            <p id="nafsi-error-message">Please try again later</p>
            <button class="nafsi-btn nafsi-btn-primary" id="nafsi-retry-btn">Try Again</button>
          </div>
        </div>
        <div class="nafsi-modal-footer">
          <button id="nafsi-capture-btn" class="nafsi-btn nafsi-btn-primary nafsi-btn-large">
            📷 Capture Photo
          </button>
        </div>
      </div>
    `;

    // Inject styles
    this.injectStyles();
  }

  /**
   * Inject CSS styles
   */
  injectStyles() {
    // Check if styles already injected
    if (document.getElementById('nafsi-sdk-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'nafsi-sdk-styles';
    style.textContent = `
      #nafsi-sdk-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.9);
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      }

      .nafsi-modal {
        background: white;
        border-radius: 12px;
        width: 90%;
        max-width: 600px;
        max-height: 90vh;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      }

      .nafsi-modal-header {
        padding: 20px;
        border-bottom: 1px solid #e0e0e0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: ${this.config.secondaryColor || '#0d153b'};
        gap: 12px;
      }

      .nafsi-logo {
        height: 40px;
        width: auto;
        object-fit: contain;
      }

      .nafsi-modal-header h2 {
        margin: 0;
        font-size: 18px;
        color: white;
        font-weight: 600;
        flex: 1;
      }

      .nafsi-close-btn {
        background: none;
        border: none;
        font-size: 28px;
        cursor: pointer;
        color: white;
        padding: 0;
        width: 30px;
        height: 30px;
        line-height: 1;
        transition: opacity 0.2s;
      }

      .nafsi-close-btn:hover {
        opacity: 0.7;
      }

      .nafsi-modal-body {
        padding: 20px;
        flex: 1;
        overflow-y: auto;
      }

      .nafsi-instructions {
        background: ${this.lightenColor(this.config.primaryColor || '#00b8ff', 0.9)};
        border-left: 4px solid ${this.config.primaryColor || '#00b8ff'};
        border-radius: 4px;
        padding: 12px 16px;
        margin-bottom: 16px;
        color: ${this.config.secondaryColor || '#0d153b'};
        font-size: 14px;
        line-height: 1.5;
      }

      .nafsi-camera-container {
        position: relative;
        background: #000;
        border-radius: 8px;
        overflow: hidden;
        aspect-ratio: 1 / 1;
      }

      .nafsi-camera-container.id-card {
        aspect-ratio: 1.59 / 1;
      }

      #nafsi-video {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .nafsi-camera-guide {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 80%;
        height: 80%;
        border: 3px solid ${this.config.primaryColor || '#00b8ff'};
        border-radius: 8px;
        pointer-events: none;
        box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
      }

      .nafsi-camera-container.id-card .nafsi-camera-guide {
        border-radius: 12px;
      }

      .nafsi-face-guide {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 70%;
        max-width: 250px;
        pointer-events: none;
        display: none;
        text-align: center;
      }

      .nafsi-camera-container.selfie .nafsi-face-guide {
        display: block;
      }

      .nafsi-camera-container.selfie .nafsi-camera-guide {
        display: none;
      }

      .nafsi-face-guide svg {
        width: 100%;
        height: auto;
        filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.5));
      }

      .face-guide-text {
        color: white;
        font-size: 14px;
        font-weight: 600;
        margin-top: 8px;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
        animation: nafsi-pulse 2s ease-in-out infinite;
      }

      @keyframes nafsi-pulse {
        0%, 100% { opacity: 0.7; }
        50% { opacity: 1; }
      }

      .nafsi-preview-container {
        text-align: center;
      }

      .nafsi-preview-container img {
        width: 100%;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .nafsi-preview-actions {
        display: flex;
        gap: 12px;
        margin-top: 16px;
      }

      .nafsi-btn {
        flex: 1;
        padding: 12px 24px;
        border: none;
        border-radius: 6px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }

      .nafsi-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }

      .nafsi-btn:active {
        transform: translateY(0);
      }

      .nafsi-btn-primary {
        background: ${this.config.primaryColor || '#00b8ff'};
        color: white;
      }

      .nafsi-btn-primary:hover {
        background: ${this.darkenColor(this.config.primaryColor || '#00b8ff', 0.1)};
      }

      .nafsi-btn-secondary {
        background: #e0e0e0;
        color: #333;
      }

      .nafsi-btn-secondary:hover {
        background: #d0d0d0;
      }

      .nafsi-btn-large {
        width: 100%;
        padding: 16px;
        font-size: 18px;
      }

      .nafsi-processing {
        text-align: center;
        padding: 60px 20px;
      }

      .nafsi-processing p {
        margin-top: 20px;
        color: #666;
        font-size: 16px;
      }

      .nafsi-spinner {
        border: 4px solid #f3f3f3;
        border-top: 4px solid ${this.config.primaryColor || '#00b8ff'};
        border-radius: 50%;
        width: 60px;
        height: 60px;
        animation: nafsi-spin 1s linear infinite;
        margin: 0 auto;
      }

      @keyframes nafsi-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .nafsi-error {
        text-align: center;
        padding: 40px 20px;
      }

      .nafsi-error-icon {
        width: 80px;
        height: 80px;
        margin: 0 auto 20px;
        background: #fff3cd;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 48px;
      }

      .nafsi-error h3 {
        color: #856404;
        font-size: 20px;
        margin-bottom: 12px;
        font-weight: 600;
      }

      .nafsi-error p {
        color: #666;
        font-size: 15px;
        margin-bottom: 24px;
        line-height: 1.5;
      }

      .nafsi-modal-footer {
        padding: 20px;
        border-top: 1px solid #e0e0e0;
        background: #fafafa;
      }

      /* Mobile responsiveness */
      @media (max-width: 600px) {
        .nafsi-modal {
          width: 100%;
          max-width: 100%;
          height: 100%;
          max-height: 100%;
          border-radius: 0;
        }

        .nafsi-modal-body {
          padding: 16px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Show the modal
   */
  show() {
    document.body.appendChild(this.overlay);
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
    this.initCamera();
    this.updateUI();
  }

  /**
   * Hide the modal
   */
  hide() {
    this.stopCamera();
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.remove();
    }
    document.body.style.overflow = ''; // Restore scrolling
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Close button
    const closeBtn = this.overlay.querySelector('.nafsi-close-btn');
    closeBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to cancel the verification?')) {
        this.hide();
      }
    });

    // Capture button
    const captureBtn = this.overlay.querySelector('#nafsi-capture-btn');
    captureBtn.addEventListener('click', () => {
      this.captureImage();
    });

    // Retake button
    const retakeBtn = this.overlay.querySelector('#nafsi-retake-btn');
    retakeBtn.addEventListener('click', () => {
      this.retake();
    });

    // Continue button
    const continueBtn = this.overlay.querySelector('#nafsi-continue-btn');
    continueBtn.addEventListener('click', () => {
      this.nextStep();
    });

    // Retry button
    const retryBtn = this.overlay.querySelector('#nafsi-retry-btn');
    retryBtn.addEventListener('click', () => {
      this.retry();
    });
  }

  /**
   * Initialize camera
   */
  async initCamera() {
    const video = this.overlay.querySelector('#nafsi-video');

    try {
      // Stop existing camera if any
      this.stopCamera();

      const constraints = {
        video: {
          width: { ideal: this.currentStep === 'selfie' ? 640 : 1280 },
          height: { ideal: this.currentStep === 'selfie' ? 640 : 720 },
          facingMode: this.currentStep === 'selfie' ? 'user' : 'environment'
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      video.srcObject = stream;
      this.camera = stream;

      logger.log('Camera initialized for step:', this.currentStep);
    } catch (error) {
      logger.error('Camera access denied:', error);
      const friendlyError = this.getUserFriendlyError({ code: 'CAMERA_ERROR' });
      this.showError(friendlyError.message, friendlyError.title);
      if (this.config.onFailure) {
        this.config.onFailure({ error: 'Camera access denied', code: 'CAMERA_ERROR' });
      }
    }
  }

  /**
   * Stop camera stream
   */
  stopCamera() {
    if (this.camera) {
      this.camera.getTracks().forEach(track => track.stop());
      this.camera = null;
      logger.log('Camera stopped');
    }
  }

  /**
   * Capture image from video stream
   */
  captureImage() {
    const video = this.overlay.querySelector('#nafsi-video');
    const canvas = this.overlay.querySelector('#nafsi-canvas');

    if (!video.srcObject) {
      this.showError('Camera not initialized');
      return;
    }

    // Set canvas dimensions based on step
    if (this.currentStep === 'selfie') {
      canvas.width = 640;
      canvas.height = 640;
    } else {
      canvas.width = 590;
      canvas.height = 372;
    }

    // Draw video frame to canvas
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to base64
    const imageData = canvas.toDataURL('image/jpeg', 0.85);

    // Show preview
    this.showPreview(imageData);

    logger.log(`Image captured for ${this.currentStep}:`, imageData.substring(0, 50) + '...');
  }

  /**
   * Show preview of captured image
   * @param {string} imageData - Base64 image data
   */
  showPreview(imageData) {
    const cameraContainer = this.overlay.querySelector('#nafsi-camera-container');
    const previewContainer = this.overlay.querySelector('#nafsi-preview-container');
    const previewImg = this.overlay.querySelector('#nafsi-preview-img');
    const captureBtn = this.overlay.querySelector('#nafsi-capture-btn');

    cameraContainer.style.display = 'none';
    previewContainer.style.display = 'block';
    captureBtn.style.display = 'none';

    previewImg.src = imageData;

    // Store the image
    this.images[this.currentStep] = imageData;

    // Stop camera to save resources
    this.stopCamera();
  }

  /**
   * Retake current photo
   */
  retake() {
    const cameraContainer = this.overlay.querySelector('#nafsi-camera-container');
    const previewContainer = this.overlay.querySelector('#nafsi-preview-container');
    const captureBtn = this.overlay.querySelector('#nafsi-capture-btn');

    previewContainer.style.display = 'none';
    cameraContainer.style.display = 'block';
    captureBtn.style.display = 'block';

    this.images[this.currentStep] = null;

    // Restart camera
    this.initCamera();

    logger.log('Retaking photo for:', this.currentStep);
  }

  /**
   * Move to next step
   */
  nextStep() {
    const steps = ['idFront', 'idBack', 'selfie', 'submit'];
    const currentIndex = steps.indexOf(this.currentStep);

    if (currentIndex < steps.length - 1) {
      const nextStepName = steps[currentIndex + 1];

      if (nextStepName === 'submit') {
        this.submitVerification();
      } else {
        this.currentStep = nextStepName;

        // Reset UI for next capture
        const cameraContainer = this.overlay.querySelector('#nafsi-camera-container');
        const previewContainer = this.overlay.querySelector('#nafsi-preview-container');
        const captureBtn = this.overlay.querySelector('#nafsi-capture-btn');

        previewContainer.style.display = 'none';
        cameraContainer.style.display = 'block';
        captureBtn.style.display = 'block';

        this.updateUI();
        this.initCamera();

        logger.log('Moving to next step:', this.currentStep);
      }
    }
  }

  /**
   * Update UI based on current step
   */
  updateUI() {
    const titleEl = this.overlay.querySelector('#nafsi-step-title');
    const instructionsEl = this.overlay.querySelector('#nafsi-instructions');
    const cameraContainer = this.overlay.querySelector('#nafsi-camera-container');

    const stepConfig = {
      idFront: {
        title: '🪪 Capture ID Front',
        instructions: 'Place your ID card on a flat surface. Ensure all four corners are visible and the text is clear and readable.',
        cameraClass: 'id-card'
      },
      idBack: {
        title: '🪪 Capture ID Back',
        instructions: 'Flip your ID card and capture the back side. Make sure all details are visible and in focus.',
        cameraClass: 'id-card'
      },
      selfie: {
        title: '📸 Take a Selfie',
        instructions: 'Position your face within the guide. Ensure good lighting and remove glasses if possible.',
        cameraClass: 'selfie'
      }
    };

    const config = stepConfig[this.currentStep];
    if (config) {
      titleEl.textContent = config.title;
      instructionsEl.textContent = config.instructions;
      cameraContainer.className = `nafsi-camera-container ${config.cameraClass}`;
    }
  }

  /**
   * Show error message
   * @param {string} message - Error message
   * @param {string} title - Error title (optional)
   */
  showError(message, title = 'Verification Failed') {
    const cameraContainer = this.overlay.querySelector('#nafsi-camera-container');
    const previewContainer = this.overlay.querySelector('#nafsi-preview-container');
    const processingEl = this.overlay.querySelector('#nafsi-processing');
    const errorEl = this.overlay.querySelector('#nafsi-error');
    const errorTitle = this.overlay.querySelector('#nafsi-error-title');
    const errorMessage = this.overlay.querySelector('#nafsi-error-message');
    const captureBtn = this.overlay.querySelector('#nafsi-capture-btn');

    cameraContainer.style.display = 'none';
    previewContainer.style.display = 'none';
    processingEl.style.display = 'none';
    errorEl.style.display = 'block';
    captureBtn.style.display = 'none';

    errorTitle.textContent = title;
    errorMessage.textContent = message || 'Please try again later.';
  }

  /**
   * Get user-friendly error message
   * @param {Object|string} error - Error object or message
   * @returns {Object} - Title and message
   */
  getUserFriendlyError(error) {
    // Default error
    let title = 'Verification Failed';
    let message = 'Please try again later.';

    if (typeof error === 'string') {
      message = error;
    } else if (error && error.code) {
      switch (error.code) {
        case 'CAMERA_ERROR':
          title = 'Camera Access Required';
          message = 'Please enable camera permissions and try again.';
          break;
        case 'API_ERROR':
          title = 'Verification Failed';
          message = 'Unable to process your verification. Please try again later.';
          break;
        case 'NETWORK_ERROR':
          title = 'Connection Error';
          message = 'Please check your internet connection and try again.';
          break;
        default:
          message = error.error || error.message || 'Please try again later.';
      }
    } else if (error && error.message) {
      message = error.message;
    }

    return { title, message };
  }

  /**
   * Retry verification from start
   */
  retry() {
    this.currentStep = 'idFront';
    this.images = {
      selfie: null,
      idFront: null,
      idBack: null
    };

    const errorEl = this.overlay.querySelector('#nafsi-error');
    const cameraContainer = this.overlay.querySelector('#nafsi-camera-container');
    const captureBtn = this.overlay.querySelector('#nafsi-capture-btn');

    errorEl.style.display = 'none';
    cameraContainer.style.display = 'block';
    captureBtn.style.display = 'block';

    this.updateUI();
    this.initCamera();
  }

  /**
   * Submit verification to API
   */
  async submitVerification() {
    const processingEl = this.overlay.querySelector('#nafsi-processing');
    const previewContainer = this.overlay.querySelector('#nafsi-preview-container');

    previewContainer.style.display = 'none';
    processingEl.style.display = 'block';

    try {
      const apiClient = new APIClient(this.config.apiUrl, this.config.accessToken);

      const payload = {
        client_id: this.config.clientId,
        work_flow_id: this.config.workflowId,
        selfie_image_url: this.images.selfie,
        id_front_image_url: this.images.idFront,
        id_back_image_url: this.images.idBack,
        method: 'process_idv'
      };

      logger.log('Submitting verification...');

      const result = await apiClient.submit(payload);

      logger.log('Verification successful:', result);

      if (this.config.onSuccess) {
        this.config.onSuccess(result);
      }

      this.hide();
    } catch (error) {
      logger.error('Verification failed:', error);

      const friendlyError = this.getUserFriendlyError({ code: 'API_ERROR', message: error.message });
      this.showError(friendlyError.message, friendlyError.title);

      if (this.config.onFailure) {
        this.config.onFailure({
          error: error.message || 'Verification failed',
          code: 'API_ERROR'
        });
      }
    }
  }
}
