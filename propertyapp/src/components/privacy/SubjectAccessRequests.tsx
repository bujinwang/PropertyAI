import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  FlatList,
  Modal,
  TextInput
} from 'react-native';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { 
  SarRequestType, 
  SarRequestStatus,
  DataCategory,
  CreateSarRequest,
  SarRequest,
  dataCategoryInfo,
  sarTypeInfo,
  createSarRequest,
  getSarRequests,
  cancelSarRequest,
  downloadSarData
} from '@/services/sarService';
import { FontAwesome } from '@expo/vector-icons';

// Component for displaying request type information
interface RequestTypeCardProps {
  type: SarRequestType;
  selected: boolean;
  onSelect: () => void;
}

const RequestTypeCard: React.FC<RequestTypeCardProps> = ({ type, selected, onSelect }) => {
  const typeInfo = sarTypeInfo[type];
  
  return (
    <TouchableOpacity onPress={onSelect}>
      <Card style={[styles.typeCard, selected && styles.selectedCard]}>
        <Card.Title 
          title={typeInfo.title} 
          titleStyle={[styles.typeTitle, selected && styles.selectedText]} 
        />
        <Card.Content>
          <Text style={[styles.typeDescription, selected && styles.selectedText]}>
            {typeInfo.description}
          </Text>
          <Text style={[styles.timeframe, selected && styles.selectedText]}>
            {typeInfo.timeframe}
          </Text>
          
          {selected && (
            <View style={styles.expandedTypeInfo}>
              <View style={styles.requirementSection}>
                <Text style={styles.sectionTitle}>Requirements:</Text>
                {typeInfo.requirements.map((req, idx) => (
                  <Text key={`req-${idx}`} style={styles.listItem}>• {req}</Text>
                ))}
              </View>
              
              <View style={styles.processSection}>
                <Text style={styles.sectionTitle}>Process:</Text>
                {typeInfo.process.map((step, idx) => (
                  <Text key={`process-${idx}`} style={styles.listItem}>
                    {idx + 1}. {step}
                  </Text>
                ))}
              </View>
            </View>
          )}
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
};

// Component for data category selection
interface DataCategoryItemProps {
  category: DataCategory;
  selected: boolean;
  onToggle: () => void;
}

const DataCategoryItem: React.FC<DataCategoryItemProps> = ({ category, selected, onToggle }) => {
  const [expanded, setExpanded] = useState(false);
  const info = dataCategoryInfo[category];
  
  return (
    <Card style={styles.categoryCard}>
      <Card.Title 
        title={info.title}
        right={(props) => (
          <Checkbox
            status={selected ? 'checked' : 'unchecked'}
            onPress={onToggle}
          />
        )}
      />
      <Card.Content>
        <Text style={styles.categoryDescription}>{info.description}</Text>
        
        <TouchableOpacity
          style={styles.expandButton}
          onPress={() => setExpanded(!expanded)}
        >
          <Text style={styles.expandButtonText}>
            {expanded ? 'Hide Details' : 'Show Details'}
          </Text>
        </TouchableOpacity>
        
        {expanded && (
          <View style={styles.expandedCategoryInfo}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Examples:</Text>
              <View style={styles.infoValue}>
                {info.examples.map((example, idx) => (
                  <Text key={`example-${idx}`} style={styles.exampleItem}>• {example}</Text>
                ))}
              </View>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Processing Time:</Text>
              <Text style={styles.infoValue}>{info.processingTime}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Data Format:</Text>
              <Text style={styles.infoValue}>{info.dataFormat}</Text>
            </View>
          </View>
        )}
      </Card.Content>
    </Card>
  );
};

// Component for request history item
interface RequestHistoryItemProps {
  request: SarRequest;
  onCancel: () => void;
  onDownload: () => void;
}

const RequestHistoryItem: React.FC<RequestHistoryItemProps> = ({ request, onCancel, onDownload }) => {
  const getStatusColor = (status: SarRequestStatus) => {
    switch (status) {
      case SarRequestStatus.PENDING: return '#ffc107'; // Warning yellow
      case SarRequestStatus.IN_PROGRESS: return '#17a2b8'; // Info blue
      case SarRequestStatus.COMPLETED: return '#28a745'; // Success green
      case SarRequestStatus.DENIED: return '#dc3545'; // Danger red
      case SarRequestStatus.CANCELLED: return '#6c757d'; // Secondary gray
      default: return '#6c757d';
    }
  };
  
  const typeInfo = sarTypeInfo[request.type];
  const requestDate = request.requestDate.toLocaleDateString();
  const completionDate = request.completionDate?.toLocaleDateString();
  const isPending = request.status === SarRequestStatus.PENDING || request.status === SarRequestStatus.IN_PROGRESS;
  const isCompleted = request.status === SarRequestStatus.COMPLETED;
  
  return (
    <Card style={styles.historyItem}>
      <Card.Title 
        title={typeInfo.title}
        subtitle={`Requested on ${requestDate}`}
        right={(props) => (
          <View style={styles.statusBadge}>
            <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(request.status) }]} />
            <Text style={styles.statusText}>{request.status}</Text>
          </View>
        )}
      />
      <Card.Content>
        <View style={styles.historyItemContent}>
          <Text style={styles.categoryLabel}>Data Categories:</Text>
          <View style={styles.categoriesList}>
            {request.categories.map((category, idx) => (
              <Text key={`cat-${idx}`} style={styles.categoryItem}>
                • {dataCategoryInfo[category].title}
              </Text>
            ))}
          </View>
          
          {request.requestReason && (
            <View style={styles.reasonSection}>
              <Text style={styles.reasonLabel}>Reason for Request:</Text>
              <Text style={styles.reasonText}>{request.requestReason}</Text>
            </View>
          )}
          
          {request.responseNotes && (
            <View style={styles.notesSection}>
              <Text style={styles.notesLabel}>Response Notes:</Text>
              <Text style={styles.notesText}>{request.responseNotes}</Text>
            </View>
          )}
          
          {completionDate && (
            <Text style={styles.completionDate}>
              Completed on: {completionDate}
            </Text>
          )}
          
          {request.expiryDate && isCompleted && (
            <Text style={styles.expiryDate}>
              Data available until: {request.expiryDate.toLocaleDateString()}
            </Text>
          )}
        </View>
      </Card.Content>
      
      <Card.Actions>
        {isPending && (
          <Button
            mode="outlined"
            onPress={onCancel}
            style={styles.cancelButton}
          >
            Cancel Request
          </Button>
        )}
        
        {isCompleted && request.downloadUrl && (
          <Button
            mode="contained"
            onPress={onDownload}
            style={styles.downloadButton}
            icon="download"
          >
            Download Data
          </Button>
        )}
      </Card.Actions>
    </Card>
  );
};

// Main component for subject access requests
export const SubjectAccessRequests: React.FC = () => {
  // State for request history
  const [requests, setRequests] = useState<SarRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // State for new request form
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [selectedRequestType, setSelectedRequestType] = useState<SarRequestType | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<DataCategory[]>([]);
  const [requestReason, setRequestReason] = useState('');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  // Fetch request history
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const fetchedRequests = await getSarRequests();
        setRequests(fetchedRequests);
      } catch (error) {
        console.error('Error fetching SAR requests:', error);
        Alert.alert('Error', 'Failed to load your request history. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRequests();
  }, []);
  
  // Handle category selection
  const handleCategoryToggle = (category: DataCategory) => {
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(c => c !== category);
      } else {
        return [...prev, category];
      }
    });
  };
  
  // Handle cancel request
  const handleCancelRequest = async (id: string) => {
    Alert.alert(
      'Cancel Request',
      'Are you sure you want to cancel this request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await cancelSarRequest(id);
              if (success) {
                // Update the local state
                setRequests(prev => 
                  prev.map(req => 
                    req.id === id 
                      ? { ...req, status: SarRequestStatus.CANCELLED } 
                      : req
                  )
                );
                Alert.alert('Success', 'Request cancelled successfully.');
              } else {
                Alert.alert('Error', 'Failed to cancel the request. Please try again.');
              }
            } catch (error) {
              console.error('Error cancelling request:', error);
              Alert.alert('Error', 'An error occurred while cancelling the request.');
            }
          }
        }
      ]
    );
  };
  
  // Handle download data
  const handleDownloadData = async (id: string) => {
    try {
      await downloadSarData(id);
      Alert.alert('Success', 'Your data has been downloaded successfully.');
    } catch (error) {
      console.error('Error downloading data:', error);
      Alert.alert('Error', 'Failed to download your data. Please try again later.');
    }
  };
  
  // Handle submit new request
  const handleSubmitRequest = async () => {
    // Validate form
    if (!selectedRequestType) {
      Alert.alert('Error', 'Please select a request type.');
      return;
    }
    
    if (selectedCategories.length === 0) {
      Alert.alert('Error', 'Please select at least one data category.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const newRequest: CreateSarRequest = {
        type: selectedRequestType,
        categories: selectedCategories,
        requestReason: requestReason.trim() || undefined,
        additionalDetails: additionalDetails.trim() || undefined
      };
      
      const createdRequest = await createSarRequest(newRequest);
      
      // Add to local state
      setRequests(prev => [createdRequest, ...prev]);
      
      // Reset form and close modal
      resetForm();
      setShowNewRequestModal(false);
      
      Alert.alert('Success', 'Your request has been submitted successfully.');
    } catch (error) {
      console.error('Error submitting request:', error);
      Alert.alert('Error', 'Failed to submit your request. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Reset form
  const resetForm = () => {
    setSelectedRequestType(null);
    setSelectedCategories([]);
    setRequestReason('');
    setAdditionalDetails('');
    setCurrentStep(1);
  };
  
  // Handle modal close
  const handleCloseModal = () => {
    if (isSubmitting) return;
    
    Alert.alert(
      'Discard Request',
      'Are you sure you want to discard this request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Discard',
          onPress: () => {
            resetForm();
            setShowNewRequestModal(false);
          }
        }
      ]
    );
  };
  
  // Go to next step
  const goToNextStep = () => {
    if (currentStep === 1 && !selectedRequestType) {
      Alert.alert('Error', 'Please select a request type.');
      return;
    }
    
    if (currentStep === 2 && selectedCategories.length === 0) {
      Alert.alert('Error', 'Please select at least one data category.');
      return;
    }
    
    setCurrentStep(prev => prev + 1);
  };
  
  // Go to previous step
  const goToPreviousStep = () => {
    setCurrentStep(prev => prev - 1);
  };
  
  // Render request type selection step
  const renderTypeSelectionStep = () => (
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>Select Request Type</Text>
      <Text style={styles.modalDescription}>
        Choose the type of data request you&apos;d like to submit.
      </Text>
      
      <ScrollView style={styles.typeList}>
        {Object.values(SarRequestType).map(type => (
          <RequestTypeCard
            key={type}
            type={type}
            selected={selectedRequestType === type}
            onSelect={() => setSelectedRequestType(type)}
          />
        ))}
      </ScrollView>
      
      <View style={styles.modalActions}>
        <Button
          mode="outlined"
          onPress={handleCloseModal}
          style={styles.modalButton}
        >
          Cancel
        </Button>
        <Button
          mode="contained"
          onPress={goToNextStep}
          style={styles.modalButton}
          disabled={!selectedRequestType}
        >
          Next
        </Button>
      </View>
    </View>
  );
  
  // Render data category selection step
  const renderCategorySelectionStep = () => (
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>Select Data Categories</Text>
      <Text style={styles.modalDescription}>
        Choose the categories of data you&apos;d like to include in your request.
      </Text>
      
      <ScrollView style={styles.categoryList}>
        {Object.values(DataCategory).map(category => (
          <DataCategoryItem
            key={category}
            category={category}
            selected={selectedCategories.includes(category)}
            onToggle={() => handleCategoryToggle(category)}
          />
        ))}
      </ScrollView>
      
      <View style={styles.modalActions}>
        <Button
          mode="outlined"
          onPress={goToPreviousStep}
          style={styles.modalButton}
        >
          Back
        </Button>
        <Button
          mode="contained"
          onPress={goToNextStep}
          style={styles.modalButton}
          disabled={selectedCategories.length === 0}
        >
          Next
        </Button>
      </View>
    </View>
  );
  
  // Render additional details step
  const renderAdditionalDetailsStep = () => (
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>Additional Details</Text>
      <Text style={styles.modalDescription}>
        Please provide any additional details that may help us process your request.
      </Text>
      
      <View style={styles.formContainer}>
        <Text style={styles.inputLabel}>Reason for Request (Optional)</Text>
        <TextInput
          style={styles.textInput}
          value={requestReason}
          onChangeText={setRequestReason}
          multiline
          numberOfLines={3}
          placeholder="e.g., Personal records, Account closure, etc."
        />
        
        <Text style={styles.inputLabel}>Additional Details (Optional)</Text>
        <TextInput
          style={styles.textInput}
          value={additionalDetails}
          onChangeText={setAdditionalDetails}
          multiline
          numberOfLines={3}
          placeholder="Any specific instructions or details about your request..."
        />
      </View>
      
      <View style={styles.modalActions}>
        <Button
          mode="outlined"
          onPress={goToPreviousStep}
          style={styles.modalButton}
          disabled={isSubmitting}
        >
          Back
        </Button>
        <Button
          mode="contained"
          onPress={handleSubmitRequest}
          style={styles.modalButton}
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          Submit Request
        </Button>
      </View>
    </View>
  );
  
  // Render modal content based on current step
  const renderModalContent = () => {
    switch (currentStep) {
      case 1:
        return renderTypeSelectionStep();
      case 2:
        return renderCategorySelectionStep();
      case 3:
        return renderAdditionalDetailsStep();
      default:
        return null;
    }
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Loading your request history...</Text>
      </View>
    );
  }
  
  // Render main component
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Subject Access Requests</Text>
      <Text style={styles.sectionDescription}>
        Request access to your personal data, request data deletion, or submit other data-related requests.
      </Text>
      
      <Button
        mode="contained"
        onPress={() => setShowNewRequestModal(true)}
        style={styles.newRequestButton}
        icon={({ color }) => <FontAwesome name="plus" size={16} color={color} />}
      >
        New Data Request
      </Button>
      
      <View style={styles.requestsContainer}>
        <Text style={styles.requestsTitle}>Your Request History</Text>
        {requests.length === 0 ? (
          <View style={styles.emptyState}>
            <FontAwesome name="inbox" size={48} color="#6c757d" />
            <Text style={styles.emptyStateText}>You haven&apos;t submitted any data requests yet.</Text>
          </View>
        ) : (
          <FlatList
            data={requests}
            keyExtractor={(item) => item.id || Math.random().toString()}
            renderItem={({ item }) => (
              <RequestHistoryItem
                request={item}
                onCancel={() => item.id && handleCancelRequest(item.id)}
                onDownload={() => item.id && handleDownloadData(item.id)}
              />
            )}
            contentContainerStyle={styles.requestsList}
          />
        )}
      </View>
      
      {/* New Request Modal */}
      <Modal
        visible={showNewRequestModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>
                Data Request - Step {currentStep} of 3
              </Text>
              <TouchableOpacity onPress={handleCloseModal} disabled={isSubmitting}>
                <FontAwesome name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            
            {renderModalContent()}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#212529',
  },
  sectionDescription: {
    fontSize: 16,
    marginBottom: 20,
    color: '#6c757d',
    lineHeight: 22,
  },
  newRequestButton: {
    marginBottom: 24,
    backgroundColor: '#0066cc',
  },
  requestsContainer: {
    flex: 1,
  },
  requestsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#212529',
  },
  requestsList: {
    paddingBottom: 24,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6c757d',
  },
  historyItem: {
    marginBottom: 16,
  },
  historyItemContent: {
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#495057',
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    color: '#495057',
  },
  categoriesList: {
    marginBottom: 8,
  },
  categoryItem: {
    fontSize: 14,
    color: '#6c757d',
    marginLeft: 8,
    marginBottom: 2,
  },
  reasonSection: {
    marginTop: 8,
    marginBottom: 8,
  },
  reasonLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    color: '#495057',
  },
  reasonText: {
    fontSize: 14,
    color: '#6c757d',
  },
  notesSection: {
    marginTop: 8,
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    color: '#495057',
  },
  notesText: {
    fontSize: 14,
    color: '#6c757d',
    fontStyle: 'italic',
  },
  completionDate: {
    fontSize: 14,
    color: '#28a745',
    marginTop: 8,
  },
  expiryDate: {
    fontSize: 14,
    color: '#dc3545',
    marginTop: 4,
  },
  cancelButton: {
    borderColor: '#dc3545',
    borderWidth: 1,
  },
  downloadButton: {
    backgroundColor: '#28a745',
  },
  
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: 'white',
    borderRadius: 8,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
  },
  modalContent: {
    padding: 16,
    flex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#212529',
  },
  modalDescription: {
    fontSize: 16,
    marginBottom: 16,
    color: '#6c757d',
    lineHeight: 22,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  
  // Type selection styles
  typeList: {
    flex: 1,
  },
  typeCard: {
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCard: {
    borderColor: '#0066cc',
    backgroundColor: '#e6f2ff',
  },
  typeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  selectedText: {
    color: '#0066cc',
  },
  typeDescription: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 8,
  },
  timeframe: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
  },
  expandedTypeInfo: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  requirementSection: {
    marginBottom: 12,
  },
  processSection: {
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#495057',
  },
  listItem: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 4,
    marginLeft: 8,
  },
  
  // Category selection styles
  categoryList: {
    flex: 1,
  },
  categoryCard: {
    marginBottom: 12,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 8,
  },
  expandButton: {
    marginTop: 4,
    marginBottom: 8,
  },
  expandButtonText: {
    fontSize: 14,
    color: '#0066cc',
  },
  expandedCategoryInfo: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  infoRow: {
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    color: '#495057',
  },
  infoValue: {
    fontSize: 14,
    color: '#6c757d',
  },
  exampleItem: {
    fontSize: 14,
    color: '#6c757d',
    marginLeft: 8,
    marginBottom: 2,
  },
  
  // Form styles
  formContainer: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#495057',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 4,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: 'white',
    textAlignVertical: 'top',
  },
}); 