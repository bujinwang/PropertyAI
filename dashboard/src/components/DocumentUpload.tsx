import React, { useState, useCallback, useEffect } from 'react';
import { Formik, Form, Field, FormikHelpers } from 'formik';
import * as Yup from 'yup';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Paper,
  LinearProgress,
  Alert,
  Chip,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from '@mui/material';
import { CloudUpload as CloudUploadIcon, InsertDriveFile as FileIcon } from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { dashboardService, Document, Property, Tenant, Lease, MaintenanceRequest } from '../services/dashboardService';

type Values = {
  file: File | null;
  name: string;
  description: string;
  propertyId: string;
  tenantId: string;
  leaseId: string;
  maintenanceId: string;
  tags: string[];
};

interface DocumentUploadProps {
  open: boolean;
  onClose: () => void;
  onSubmitSuccess?: () => void;
  initialValues?: Partial<Document>;
  isEdit?: boolean;
  documentId?: string;
}

const validationSchema = Yup.object<Values>({
  file: Yup.mixed().when('isEdit', {
    is: false,
    then: (schema) => schema.required('File is required'),
    otherwise: (schema) => schema.nullable(),
  }),
  name: Yup.string().required('Name is required').max(255, 'Name must be less than 255 characters'),
  description: Yup.string().max(1000, 'Description must be less than 1000 characters'),
  propertyId: Yup.string(),
  tenantId: Yup.string(),
  leaseId: Yup.string(),
  maintenanceId: Yup.string(),
  tags: Yup.array().of(Yup.string()),
});

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'image/jpg',
];

const DocumentUpload: React.FC<DocumentUploadProps> = ({
  open,
  onClose,
  onSubmitSuccess,
  initialValues = {},
  isEdit = false,
  documentId
}) => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [propertiesData, tenantsData, leasesData, maintenanceData] = await Promise.all([
          dashboardService.getProperties(1, 100),
          dashboardService.getTenants(1, 100),
          dashboardService.getLeases(1, 100),
          dashboardService.getMaintenanceRequests(1, 100),
        ]);
        setProperties(propertiesData.data);
        setTenants(tenantsData.data);
        setLeases(leasesData.data);
        setMaintenanceRequests(maintenanceData.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchData();
    }
  }, [open]);

  const createDropzoneConfig = (setFieldValue: (field: string, value: any) => void) => {
    const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
      if (acceptedFiles.length > 0) {
        setFieldValue('file', acceptedFiles[0]);
        setFieldValue('name', acceptedFiles[0].name);
      }
      if (rejectedFiles.length > 0) {
        // Handle rejected files - could show error message
        console.error('File rejected:', rejectedFiles);
      }
    }, [setFieldValue]);

    return useDropzone({
      onDrop,
      accept: {
        'application/pdf': ['.pdf'],
        'application/msword': ['.doc'],
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
        'application/vnd.ms-excel': ['.xls'],
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
        'image/jpeg': ['.jpg', '.jpeg'],
        'image/png': ['.png'],
      },
      maxSize: MAX_FILE_SIZE,
      multiple: false,
      disabled: isEdit,
    });
  };

  const handleSubmit = async (values: any, { setSubmitting }: FormikHelpers<any>) => {
    try {
      setIsUploading(true);
      setUploadProgress(0);

      const uploadData = {
        file: values.file,
        name: values.name,
        description: values.description || undefined,
        propertyId: values.propertyId || undefined,
        tenantId: values.tenantId || undefined,
        leaseId: values.leaseId || undefined,
        maintenanceId: values.maintenanceId || undefined,
        tags: values.tags || [],
      };

      if (isEdit && documentId) {
        await dashboardService.updateDocument(documentId, {
          name: values.name,
          description: values.description,
          tags: values.tags,
        });
      } else {
        await dashboardService.uploadDocument(uploadData);
      }

      setUploadProgress(100);
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
      onClose();
    } catch (error) {
      console.error('Error uploading document:', error);
    } finally {
      setIsUploading(false);
      setSubmitting(false);
    }
  };

  const initialFormValues: Values = {
    file: null,
    name: initialValues.name || '',
    description: initialValues.description || '',
    propertyId: initialValues.propertyId || '',
    tenantId: initialValues.tenantId || '',
    leaseId: initialValues.leaseId || '',
    maintenanceId: initialValues.maintenanceId || '',
    tags: initialValues.tags || [],
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h6">
          {isEdit ? 'Edit Document' : 'Upload Document'}
        </Typography>
      </DialogTitle>
      <Formik
        initialValues={initialFormValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ isSubmitting, errors, touched, setFieldValue, values, setFieldTouched }) => {
          const { getRootProps, getInputProps, isDragActive } = createDropzoneConfig(setFieldValue);

          return (
            <Form>
              <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
                  {!isEdit && (
                    <Box>
                      <Typography variant="subtitle1" gutterBottom>
                        File Upload
                      </Typography>
                      <Paper
                        {...getRootProps()}
                        sx={{
                          p: 3,
                          textAlign: 'center',
                          cursor: 'pointer',
                          border: '2px dashed',
                          borderColor: isDragActive ? 'primary.main' : 'grey.300',
                          bgcolor: isDragActive ? 'action.hover' : 'background.paper',
                          '&:hover': {
                            borderColor: 'primary.main',
                            bgcolor: 'action.hover',
                          },
                        }}
                      >
                        <input {...getInputProps()} />
                        <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                        <Typography variant="h6" gutterBottom>
                          {isDragActive ? 'Drop the file here' : 'Drag & drop a file here, or click to select'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Supported formats: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG (Max 10MB)
                        </Typography>
                      </Paper>

                    {values.file && (
                      <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <FileIcon />
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {values.file.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatFileSize(values.file.size)}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    )}

                    {isUploading && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" gutterBottom>
                          Uploading... {uploadProgress}%
                        </Typography>
                        <LinearProgress variant="determinate" value={uploadProgress} />
                      </Box>
                    )}
                  </Box>
                )}

                <Field
                  as={TextField}
                  name="name"
                  label="Document Name"
                  fullWidth
                  required
                  error={Boolean(touched.name && errors.name)}
                  helperText={touched.name && errors.name ? (errors.name as string) : ''}
                />

                <Field
                  as={TextField}
                  name="description"
                  label="Description"
                  multiline
                  rows={3}
                  fullWidth
                  error={Boolean(touched.description && errors.description)}
                  helperText={touched.description && errors.description ? (errors.description as string) : ''}
                />

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <FormControl fullWidth>
                    <Autocomplete
                      options={properties}
                      getOptionLabel={(option) => option.title}
                      value={properties.find(p => p.id === values.propertyId) || null}
                      onChange={(event, newValue) => {
                        setFieldValue('propertyId', newValue?.id || '');
                        setFieldTouched('propertyId', true);
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Associated Property"
                          error={Boolean(touched.propertyId && errors.propertyId)}
                          helperText={touched.propertyId && errors.propertyId ? (errors.propertyId as string) : ''}
                        />
                      )}
                      loading={loading}
                    />
                  </FormControl>

                  <FormControl fullWidth>
                    <Autocomplete
                      options={tenants}
                      getOptionLabel={(option) => option.name}
                      value={tenants.find(t => t.id === values.tenantId) || null}
                      onChange={(event, newValue) => {
                        setFieldValue('tenantId', newValue?.id || '');
                        setFieldTouched('tenantId', true);
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Associated Tenant"
                          error={Boolean(touched.tenantId && errors.tenantId)}
                          helperText={touched.tenantId && errors.tenantId ? (errors.tenantId as string) : ''}
                        />
                      )}
                      loading={loading}
                    />
                  </FormControl>
                </Box>

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <FormControl fullWidth>
                    <Autocomplete
                      options={leases}
                      getOptionLabel={(option) => `${option.tenantName} - ${option.unitAddress}`}
                      value={leases.find(l => l.id === values.leaseId) || null}
                      onChange={(event, newValue) => {
                        setFieldValue('leaseId', newValue?.id || '');
                        setFieldTouched('leaseId', true);
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Associated Lease"
                          error={Boolean(touched.leaseId && errors.leaseId)}
                          helperText={touched.leaseId && errors.leaseId ? (errors.leaseId as string) : ''}
                        />
                      )}
                      loading={loading}
                    />
                  </FormControl>

                  <FormControl fullWidth>
                    <Autocomplete
                      options={maintenanceRequests}
                      getOptionLabel={(option) => option.title}
                      value={maintenanceRequests.find(m => m.id === values.maintenanceId) || null}
                      onChange={(event, newValue) => {
                        setFieldValue('maintenanceId', newValue?.id || '');
                        setFieldTouched('maintenanceId', true);
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Associated Maintenance"
                          error={Boolean(touched.maintenanceId && errors.maintenanceId)}
                          helperText={touched.maintenanceId && errors.maintenanceId ? (errors.maintenanceId as string) : ''}
                        />
                      )}
                      loading={loading}
                    />
                  </FormControl>
                </Box>

                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Tags
                  </Typography>
                  <Autocomplete
                    multiple
                    options={[]} // Allow free text
                    value={values.tags}
                    onChange={(event, newValue) => {
                      setFieldValue('tags', newValue);
                    }}
                    freeSolo
                    renderTags={(value: readonly string[], getTagProps) =>
                      value.map((option: string, index: number) => (
                        <Chip variant="outlined" label={option} {...getTagProps({ index })} key={index} />
                      ))
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Add tags"
                        placeholder="Type and press enter to add tags"
                      />
                    )}
                  />
                </Box>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={onClose} disabled={isSubmitting || isUploading}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting || isUploading || (!isEdit && !values.file)}
              >
                {isEdit ? 'Update' : 'Upload'}
              </Button>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </Dialog>
  </LocalizationProvider>
);

export default DocumentUpload;