import React, { useState, useEffect } from 'react';

interface Document {
  id: string;
  name: string;
  url: string;
}

const DocumentManager: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [status, setStatus] = useState('');

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setStatus('Fetching documents...');
        const response = await fetch('/api/documents');
        const data = await response.json();
        setDocuments(data);
        setStatus('');
      } catch (error) {
        if (error instanceof Error) {
          setStatus(`Error fetching documents: ${error.message}`);
        } else {
          setStatus('An unknown error occurred');
        }
      }
    };

    fetchDocuments();
  }, []);

  const uploadDocument = async (file: File) => {
    try {
      setStatus('Uploading document...');
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });
      const json = await response.json();
      setStatus(`Document uploaded: ${JSON.stringify(json)}`);
    } catch (error) {
      if (error instanceof Error) {
        setStatus(`Error uploading document: ${error.message}`);
      } else {
        setStatus('An unknown error occurred');
      }
    }
  };

  return (
    <div>
      <h1>Document Manager</h1>
      <label>
        Upload Document:
        <input type="file" onChange={(e) => uploadDocument(e.target.files![0])} />
      </label>
      {status && <p>{status}</p>}
      <ul>
        {documents.map((doc) => (
          <li key={doc.id}>
            <a href={doc.url} target="_blank" rel="noopener noreferrer">
              {doc.name}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DocumentManager;
