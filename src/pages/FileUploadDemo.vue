<template>
  <div class="file-upload-demo">
    <h1>File Upload Demo</h1>

    <div class="upload-section">
      <h2>Single File Upload</h2>
      <input
        type="file"
        @change="handleSingleFileSelect"
        accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
      />
      <button
        @click="uploadSingleFile"
        :disabled="!selectedFile || uploading"
      >
        {{ uploading ? 'Uploading...' : 'Upload File' }}
      </button>

      <div v-if="uploadProgress > 0" class="progress-bar">
        <div
          class="progress-fill"
          :style="{ width: uploadProgress + '%' }"
        ></div>
        <span class="progress-text">{{ uploadProgress }}%</span>
      </div>
    </div>

    <div class="upload-section">
      <h2>Multiple Files Upload</h2>
      <input
        type="file"
        multiple
        @change="handleMultipleFilesSelect"
        accept=".jpg,.jpeg,.png,.pdf"
      />
      <button
        @click="uploadMultipleFiles"
        :disabled="selectedFiles.length === 0 || uploading"
      >
        {{ uploading ? 'Uploading...' : `Upload ${selectedFiles.length} Files` }}
      </button>
    </div>

    <div class="file-info">
      <h3>File Information</h3>
      <p v-if="selectedFile">
        Selected: {{ selectedFile.name }} ({{ formatFileSize(selectedFile.size) }})
        <br>
        Type: {{ selectedFile.type }} | Category: {{ getFileCategory(getFileExtension(selectedFile.type)) }}
      </p>
      <p v-else>No file selected</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import {
  customRequest,
  uploadMultipleFiles,
  formatFileSize,
  getFileExtension,
  getFileCategory,
  validateFileType,
  validateFileSize,
  type FileUploadOptions
} from '../services/fileUpload';

// Reactive state
const selectedFile = ref<File | null>(null);
const selectedFiles = ref<File[]>([]);
const uploading = ref(false);
const uploadProgress = ref(0);

// File selection handlers
const handleSingleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (file) {
    // Validate file
    if (!validateFileType(file, ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'])) {
      alert('Please select a valid file type (jpg, jpeg, png, pdf, doc, docx)');
      return;
    }

    if (!validateFileSize(file, 10)) {
      alert('File size should not exceed 10MB');
      return;
    }

    selectedFile.value = file;
  }
};

const handleMultipleFilesSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const files = Array.from(target.files || []);

  // Validate all files
  const validFiles = files.filter(file => {
    if (!validateFileType(file, ['jpg', 'jpeg', 'png', 'pdf'])) {
      console.warn(`Invalid file type: ${file.name}`);
      return false;
    }

    if (!validateFileSize(file, 5)) {
      console.warn(`File too large: ${file.name}`);
      return false;
    }

    return true;
  });

  selectedFiles.value = validFiles;
};

// Upload handlers
const uploadSingleFile = async () => {
  if (!selectedFile.value) return;

  uploading.value = true;
  uploadProgress.value = 0;

  const options: FileUploadOptions = {
    onProgress: (progress) => {
      uploadProgress.value = progress;
    },
    onSuccess: (response) => {
      console.log('Upload successful:', response);
    },
    onError: (error) => {
      console.error('Upload failed:', error);
    }
  };

  try {
    // Replace with your actual upload endpoint
    const result = await customRequest(selectedFile.value, '/api/upload', options);

    if (result.success) {
      alert('File uploaded successfully!');
    } else {
      alert(`Upload failed: ${result.error}`);
    }
  } catch (error) {
    console.error('Upload error:', error);
    alert('Upload failed. Please try again.');
  } finally {
    uploading.value = false;
    uploadProgress.value = 0;
  }
};

const uploadMultipleFilesHandler = async () => {
  if (selectedFiles.value.length === 0) return;

  uploading.value = true;

  try {
    // Replace with your actual upload endpoint
    const results = await uploadMultipleFiles(selectedFiles.value, '/api/upload');

    const successCount = results.filter(r => r.success).length;
    const failCount = results.length - successCount;

    alert(`Upload completed: ${successCount} successful, ${failCount} failed`);

    if (successCount > 0) {
      selectedFiles.value = [];
      // Reset file input
      const fileInput = document.querySelector('input[type="file"][multiple]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    }
  } catch (error) {
    console.error('Multiple upload error:', error);
    alert('Upload failed. Please try again.');
  } finally {
    uploading.value = false;
  }
};
</script>

<style scoped>
.file-upload-demo {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.upload-section {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.upload-section h2 {
  margin-top: 0;
  color: #333;
}

.file-info {
  background-color: #f5f5f5;
  padding: 15px;
  border-radius: 8px;
}

.file-info h3 {
  margin-top: 0;
  color: #333;
}

.progress-bar {
  margin-top: 10px;
  width: 100%;
  height: 20px;
  background-color: #e0e0e0;
  border-radius: 10px;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  background-color: #4caf50;
  transition: width 0.3s ease;
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-weight: bold;
}

button {
  background-color: #4caf50;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  margin-left: 10px;
}

button:hover:not(:disabled) {
  background-color: #45a049;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

input[type="file"] {
  margin-right: 10px;
}
</style>