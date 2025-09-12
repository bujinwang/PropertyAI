import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import { NavigationProps } from '../navigation/types';
import { SafeAreaView } from 'react-native-safe-area-context';

type DocumentViewerScreenProps = NavigationProps<'Settings'>;

interface Document {
  id: string;
  title: string;
  type: 'lease' | 'policy' | 'manual' | 'receipt' | 'other';
  fileName: string;
  fileSize: string;
  uploadDate: string;
  category: string;
  isSigned?: boolean;
  requiresSignature?: boolean;
}

const mockDocuments: Document[] = [
  {
    id: '1',
    title: 'Lease Agreement - Unit 204',
    type: 'lease',
    fileName: 'lease_agreement_204.pdf',
    fileSize: '2.4 MB',
    uploadDate: '2024-01-15',
    category: 'Legal Documents',
    isSigned: true,
    requiresSignature: true,
  },
  {
    id: '2',
    title: 'House Rules & Regulations',
    type: 'policy',
    fileName: 'house_rules.pdf',
    fileSize: '1.2 MB',
    uploadDate: '2024-01-10',
    category: 'Policies',
  },
  {
    id: '3',
    title: 'Tenant Handbook',
    type: 'manual',
    fileName: 'tenant_handbook.pdf',
    fileSize: '3.1 MB',
    uploadDate: '2024-01-08',
    category: 'Guides',
  },
  {
    id: '4',
    title: 'Maintenance Request Receipt',
    type: 'receipt',
    fileName: 'maintenance_receipt_001.pdf',
    fileSize: '245 KB',
    uploadDate: '2024-01-20',
    category: 'Receipts',
  },
  {
    id: '5',
    title: 'Pet Policy Addendum',
    type: 'policy',
    fileName: 'pet_policy.pdf',
    fileSize: '890 KB',
    uploadDate: '2024-01-12',
    category: 'Policies',
    requiresSignature: true,
    isSigned: false,
  },
];

const categories = ['All', 'Legal Documents', 'Policies', 'Guides', 'Receipts'];

export function DocumentViewerScreen({ navigation }: DocumentViewerScreenProps) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [documents, setDocuments] = useState<Document[]>(mockDocuments);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  const filteredDocuments = selectedCategory === 'All'
    ? documents
    : documents.filter(doc => doc.category === selectedCategory);

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'lease': return '📄';
      case 'policy': return '📋';
      case 'manual': return '📖';
      case 'receipt': return '🧾';
      default: return '📄';
    }
  };

  const getStatusColor = (doc: Document) => {
    if (doc.requiresSignature && !doc.isSigned) return '#dc3545';
    if (doc.isSigned) return '#28a745';
    return '#6c757d';
  };

  const getStatusText = (doc: Document) => {
    if (doc.requiresSignature && !doc.isSigned) return 'Signature Required';
    if (doc.isSigned) return 'Signed';
    return 'Available';
  };

  const handleDocumentPress = (document: Document) => {
    if (document.requiresSignature && !document.isSigned) {
      Alert.alert(
        'Signature Required',
        'This document requires your electronic signature. Would you like to sign it now?',
        [
          { text: 'Sign Now', onPress: () => handleSignDocument(document) },
          { text: 'View Document', onPress: () => viewDocument(document) },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } else {
      viewDocument(document);
    }
  };

  const viewDocument = (document: Document) => {
    // Mock document viewing
    Alert.alert(
      'Document Viewer',
      `Opening ${document.title}...\n\nFile: ${document.fileName}\nSize: ${document.fileSize}`,
      [
        { text: 'Download', onPress: () => downloadDocument(document) },
        { text: 'Share', onPress: () => shareDocument(document) },
        { text: 'Close', style: 'cancel' },
      ]
    );
  };

  const handleSignDocument = (document: Document) => {
    Alert.alert(
      'Electronic Signature',
      'By signing this document electronically, you agree to the terms and conditions outlined in the document.',
      [
        {
          text: 'I Agree & Sign',
          onPress: () => {
            // Update document status
            setDocuments(prev =>
              prev.map(doc =>
                doc.id === document.id
                  ? { ...doc, isSigned: true }
                  : doc
              )
            );
            Alert.alert('Success', 'Document has been signed successfully!');
          }
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const downloadDocument = (document: Document) => {
    Alert.alert('Download Started', `Downloading ${document.fileName}...`);
  };

  const shareDocument = (document: Document) => {
    Alert.alert('Share', `Sharing ${document.title}...`);
  };

  const renderDocumentCard = (document: Document) => (
    <TouchableOpacity
      key={document.id}
      style={styles.documentCard}
      onPress={() => handleDocumentPress(document)}
    >
      <View style={styles.documentHeader}>
        <View style={styles.documentIcon}>
          <Text style={styles.iconText}>{getDocumentIcon(document.type)}</Text>
        </View>
        <View style={styles.documentInfo}>
          <Text style={styles.documentTitle} numberOfLines={2}>
            {document.title}
          </Text>
          <Text style={styles.documentMeta}>
            {document.fileSize} • {new Date(document.uploadDate).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.documentActions}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(document) }]}>
            <Text style={styles.statusText}>{getStatusText(document)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.documentFooter}>
        <Text style={styles.categoryText}>{document.category}</Text>
        <TouchableOpacity style={styles.moreButton}>
          <Text style={styles.moreText}>⋯</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Documents</Text>
        <Text style={styles.subtitle}>View and manage your property documents</Text>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.filterButton,
                selectedCategory === category && styles.selectedFilter,
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedCategory === category && styles.selectedFilterText,
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.documentList}>
        <View style={styles.documentsContainer}>
          {filteredDocuments.length > 0 ? (
            filteredDocuments.map(renderDocumentCard)
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📄</Text>
              <Text style={styles.emptyTitle}>No documents found</Text>
              <Text style={styles.emptyText}>
                {selectedCategory === 'All'
                  ? 'You don\'t have any documents yet.'
                  : `No documents in ${selectedCategory.toLowerCase()}.`
                }
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.uploadButton}>
          <Text style={styles.uploadButtonText}>Upload Document</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
  },
  filterContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  filterScroll: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  filterButton: {
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  selectedFilter: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  filterText: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
  },
  selectedFilterText: {
    color: '#fff',
  },
  documentList: {
    flex: 1,
  },
  documentsContainer: {
    padding: 20,
  },
  documentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  documentIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 20,
  },
  documentInfo: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  documentMeta: {
    fontSize: 12,
    color: '#6c757d',
  },
  documentActions: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  documentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryText: {
    fontSize: 12,
    color: '#6c757d',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  moreButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreText: {
    fontSize: 18,
    color: '#6c757d',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  uploadButton: {
    backgroundColor: '#28a745',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});