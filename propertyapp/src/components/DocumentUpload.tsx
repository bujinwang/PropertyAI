import React, { useState } from 'react';
import { View, Button, Text } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';

const DocumentUpload: React.FC = () => {
  const [file, setFile] = useState<DocumentPicker.DocumentPickerResult | null>(
    null
  );
  const [status, setStatus] = useState<string>('');

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({});
    if (result.canceled === false) {
      setFile(result);
    }
  };

  const uploadDocument = async () => {
    if (!file || file.canceled === true || !file.assets) {
      return;
    }

    const data = new FormData();
    const doc = {
      uri: file.assets[0].uri,
      name: file.assets[0].name,
      type: file.assets[0].mimeType,
    };
    data.append('document', doc as unknown as Blob);

    try {
      setStatus('Uploading...');
      const response = await fetch('/api/document-verification', {
        method: 'POST',
        body: data,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      const json = await response.json();
      setStatus(`Upload successful: ${JSON.stringify(json)}`);
    } catch (error) {
      if (error instanceof Error) {
        setStatus(`Upload failed: ${error.message}`);
      } else {
        setStatus('Upload failed with an unknown error.');
      }
    }
  };

  return (
    <View>
      <Button title="Select Document" onPress={pickDocument} />
      {file && file.canceled === false && file.assets && (
        <Text>{file.assets[0].name}</Text>
      )}
      <Button
        title="Upload Document"
        onPress={uploadDocument}
        disabled={!file || file.canceled === true}
      />
      {status && <Text>{status}</Text>}
    </View>
  );
};

export default DocumentUpload;
