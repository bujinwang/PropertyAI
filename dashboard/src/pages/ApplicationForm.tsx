import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  IconButton,
  Divider,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import tenantScreeningService from '../services/tenantScreeningService';
import { ApplicationFormData, ApplicantFormData, Employment, Reference } from '../types/tenantScreening';

const steps = ['Property Details', 'Applicant Information', 'Employment & Income', 'References', 'Review'];

const ApplicationForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<ApplicationFormData>({
    propertyId: '',
    applicants: [
      {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        currentAddress: {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'US',
        },
        employmentHistory: [
          {
            employer: '',
            position: '',
            startDate: '',
            currentEmployer: true,
            monthlyIncome: 0,
          }
        ],
        references: [],
      }
    ],
  });

  useEffect(() => {
    const fetchApplication = async () => {
      if (!isEditMode) return;
      
      try {
        setLoading(true);
        const data = await tenantScreeningService.getApplicationById(id!);
        
        // Transform application data to form data format
        // This would be more complex in a real application
        setFormData({
          propertyId: data.propertyId,
          moveInDate: data.moveInDate,
          leaseTermMonths: data.leaseTermMonths,
          applicants: data.applicants || [
            {
              firstName: data.applicantName?.split(' ')[0] || '',
              lastName: data.applicantName?.split(' ')[1] || '',
              email: data.applicantEmail || '',
              phone: '',
              dateOfBirth: '',
              currentAddress: {
                street: '',
                city: '',
                state: '',
                zipCode: '',
                country: 'US',
              },
              employmentHistory: [
                {
                  employer: '',
                  position: '',
                  startDate: '',
                  currentEmployer: true,
                  monthlyIncome: 0,
                }
              ],
              references: [],
            }
          ],
          notes: data.notes,
        });
        
        setError(null);
      } catch (err) {
        console.error(`Failed to fetch application ${id}:`, err);
        setError('Failed to load application data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchApplication();
  }, [id, isEditMode]);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);
      
      // Basic validation
      if (!formData.propertyId) {
        setError('Property ID is required');
        return;
      }
      
      const applicant = formData.applicants[0];
      if (!applicant.firstName || !applicant.lastName || !applicant.email) {
        setError('Applicant name and email are required');
        return;
      }
      
      if (isEditMode) {
        await tenantScreeningService.updateApplication(id!, formData);
      } else {
        await tenantScreeningService.createApplication(formData);
      }
      
      navigate('/tenant-screening');
    } catch (err: any) {
      console.error('Failed to submit application:', err);
      
      // More detailed error message
      const errorMessage = err.response?.data?.message || 
                          err.message || 
                          'Failed to submit application. Please try again later.';
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const updateFormData = (field: keyof ApplicationFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateApplicant = (index: number, field: keyof ApplicantFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      applicants: prev.applicants.map((applicant, i) => 
        i === index ? { ...applicant, [field]: value } : applicant
      )
    }));
  };

  const updateApplicantAddress = (applicantIndex: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      applicants: prev.applicants.map((applicant, i) => 
        i === applicantIndex ? {
          ...applicant,
          currentAddress: { ...applicant.currentAddress, [field]: value }
        } : applicant
      )
    }));
  };

  const addEmployment = (applicantIndex: number) => {
    const newEmployment: Employment = {
      employer: '',
      position: '',
      startDate: '',
      currentEmployer: false,
      monthlyIncome: 0,
    };
    
    setFormData(prev => ({
      ...prev,
      applicants: prev.applicants.map((applicant, i) => 
        i === applicantIndex ? {
          ...applicant,
          employmentHistory: [...applicant.employmentHistory, newEmployment]
        } : applicant
      )
    }));
  };

  const updateEmployment = (applicantIndex: number, employmentIndex: number, field: keyof Employment, value: any) => {
    setFormData(prev => ({
      ...prev,
      applicants: prev.applicants.map((applicant, i) => 
        i === applicantIndex ? {
          ...applicant,
          employmentHistory: applicant.employmentHistory.map((emp, j) =>
            j === employmentIndex ? { ...emp, [field]: value } : emp
          )
        } : applicant
      )
    }));
  };

  const removeEmployment = (applicantIndex: number, employmentIndex: number) => {
    setFormData(prev => ({
      ...prev,
      applicants: prev.applicants.map((applicant, i) => 
        i === applicantIndex ? {
          ...applicant,
          employmentHistory: applicant.employmentHistory.filter((_, j) => j !== employmentIndex)
        } : applicant
      )
    }));
  };

  const addReference = (applicantIndex: number) => {
    const newReference: Reference = {
      name: '',
      relationship: '',
      phone: '',
      email: '',
      years: 0,
    };
    
    setFormData(prev => ({
      ...prev,
      applicants: prev.applicants.map((applicant, i) => 
        i === applicantIndex ? {
          ...applicant,
          references: [...(applicant.references || []), newReference]
        } : applicant
      )
    }));
  };

  const updateReference = (applicantIndex: number, referenceIndex: number, field: keyof Reference, value: any) => {
    setFormData(prev => ({
      ...prev,
      applicants: prev.applicants.map((applicant, i) => 
        i === applicantIndex ? {
          ...applicant,
          references: (applicant.references || []).map((ref, j) =>
            j === referenceIndex ? { ...ref, [field]: value } : ref
          )
        } : applicant
      )
    }));
  };

  const removeReference = (applicantIndex: number, referenceIndex: number) => {
    setFormData(prev => ({
      ...prev,
      applicants: prev.applicants.map((applicant, i) => 
        i === applicantIndex ? {
          ...applicant,
          references: (applicant.references || []).filter((_, j) => j !== referenceIndex)
        } : applicant
      )
    }));
  };

  const renderStepContent = (step: number) => {
    const applicant = formData.applicants[0]; // For now, handle single applicant

    switch (step) {
      case 0: // Property Details
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Property Information
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Property ID"
                value={formData.propertyId}
                onChange={(e) => updateFormData('propertyId', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Desired Move-in Date"
                type="date"
                value={formData.moveInDate || ''}
                onChange={(e) => updateFormData('moveInDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Lease Term (Months)"
                type="number"
                value={formData.leaseTermMonths || ''}
                onChange={(e) => updateFormData('leaseTermMonths', parseInt(e.target.value) || undefined)}
              />
            </Grid>
          </Grid>
        );

      case 1: // Applicant Information
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Personal Information
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="First Name"
                value={applicant.firstName}
                onChange={(e) => updateApplicant(0, 'firstName', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={applicant.lastName}
                onChange={(e) => updateApplicant(0, 'lastName', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={applicant.email}
                onChange={(e) => updateApplicant(0, 'email', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone"
                value={applicant.phone}
                onChange={(e) => updateApplicant(0, 'phone', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Date of Birth"
                type="date"
                value={applicant.dateOfBirth}
                onChange={(e) => updateApplicant(0, 'dateOfBirth', e.target.value)}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Current Address
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Street Address"
                value={applicant.currentAddress.street}
                onChange={(e) => updateApplicantAddress(0, 'street', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="City"
                value={applicant.currentAddress.city}
                onChange={(e) => updateApplicantAddress(0, 'city', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="State"
                value={applicant.currentAddress.state}
                onChange={(e) => updateApplicantAddress(0, 'state', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="ZIP Code"
                value={applicant.currentAddress.zipCode}
                onChange={(e) => updateApplicantAddress(0, 'zipCode', e.target.value)}
                required
              />
            </Grid>
          </Grid>
        );

      case 2: // Employment & Income
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Employment History
            </Typography>
            {applicant.employmentHistory.map((employment, index) => (
              <Card key={index} sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1">
                      Employment {index + 1}
                    </Typography>
                    {applicant.employmentHistory.length > 1 && (
                      <IconButton
                        color="error"
                        onClick={() => removeEmployment(0, index)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Employer"
                        value={employment.employer}
                        onChange={(e) => updateEmployment(0, index, 'employer', e.target.value)}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Position"
                        value={employment.position}
                        onChange={(e) => updateEmployment(0, index, 'position', e.target.value)}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Start Date"
                        type="date"
                        value={employment.startDate}
                        onChange={(e) => updateEmployment(0, index, 'startDate', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Monthly Income"
                        type="number"
                        value={employment.monthlyIncome}
                        onChange={(e) => updateEmployment(0, index, 'monthlyIncome', parseFloat(e.target.value) || 0)}
                        InputProps={{ startAdornment: '$' }}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={employment.currentEmployer}
                            onChange={(e) => updateEmployment(0, index, 'currentEmployer', e.target.checked)}
                          />
                        }
                        label="Current Employer"
                      />
                    </Grid>
                    {!employment.currentEmployer && (
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="End Date"
                          type="date"
                          value={employment.endDate || ''}
                          onChange={(e) => updateEmployment(0, index, 'endDate', e.target.value)}
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            ))}
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => addEmployment(0)}
              sx={{ mt: 1 }}
            >
              Add Employment
            </Button>
          </Box>
        );

      case 3: // References
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              References
            </Typography>
            {(applicant.references || []).map((reference, index) => (
              <Card key={index} sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1">
                      Reference {index + 1}
                    </Typography>
                    <IconButton
                      color="error"
                      onClick={() => removeReference(0, index)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Name"
                        value={reference.name}
                        onChange={(e) => updateReference(0, index, 'name', e.target.value)}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Relationship"
                        value={reference.relationship}
                        onChange={(e) => updateReference(0, index, 'relationship', e.target.value)}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Phone"
                        value={reference.phone}
                        onChange={(e) => updateReference(0, index, 'phone', e.target.value)}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Email"
                        type="email"
                        value={reference.email || ''}
                        onChange={(e) => updateReference(0, index, 'email', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Years Known"
                        type="number"
                        value={reference.years}
                        onChange={(e) => updateReference(0, index, 'years', parseInt(e.target.value) || 0)}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            ))}
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => addReference(0)}
              sx={{ mt: 1 }}
            >
              Add Reference
            </Button>
          </Box>
        );

      case 4: // Review
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Application Review
            </Typography>
            
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Property Details
                </Typography>
                <Typography variant="body2">Property ID: {formData.propertyId}</Typography>
                <Typography variant="body2">Move-in Date: {formData.moveInDate || 'Not specified'}</Typography>
                <Typography variant="body2">Lease Term: {formData.leaseTermMonths || 'Not specified'} months</Typography>
              </CardContent>
            </Card>

            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Applicant Information
                </Typography>
                <Typography variant="body2">Name: {applicant.firstName} {applicant.lastName}</Typography>
                <Typography variant="body2">Email: {applicant.email}</Typography>
                <Typography variant="body2">Phone: {applicant.phone}</Typography>
                <Typography variant="body2">Date of Birth: {applicant.dateOfBirth}</Typography>
                <Typography variant="body2">
                  Address: {applicant.currentAddress.street}, {applicant.currentAddress.city}, {applicant.currentAddress.state} {applicant.currentAddress.zipCode}
                </Typography>
              </CardContent>
            </Card>

            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Employment History
                </Typography>
                {applicant.employmentHistory.map((emp, index) => (
                  <Box key={index} sx={{ mb: 1 }}>
                    <Typography variant="body2">
                      {emp.employer} - {emp.position} (${emp.monthlyIncome}/month)
                      {emp.currentEmployer && ' - Current'}
                    </Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>

            {(applicant.references || []).length > 0 && (
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    References
                  </Typography>
                  {(applicant.references || []).map((ref, index) => (
                    <Box key={index} sx={{ mb: 1 }}>
                      <Typography variant="body2">
                        {ref.name} - {ref.relationship} ({ref.phone})
                      </Typography>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            )}

            <TextField
              fullWidth
              label="Additional Notes"
              multiline
              rows={4}
              value={formData.notes || ''}
              onChange={(e) => updateFormData('notes', e.target.value)}
              sx={{ mt: 2 }}
            />
          </Box>
        );

      default:
        return null;
    }
  };

  // Remove these duplicate function declarations (lines 680-695):
  // const handleNext = () => {
  //   setActiveStep((prevActiveStep) => prevActiveStep + 1);
  // };
  
  // const handleBack = () => {
  //   setActiveStep((prevActiveStep) => prevActiveStep - 1);
  // };
  
  // const handleSubmit = async () => {
  //   try {
  //     setSubmitting(true);
  //     
  //     if (isEditMode) {
  //       await tenantScreeningService.updateApplication(id!, formData);
  //     } else {
  //       await tenantScreeningService.createApplication(formData);
  //     }
  //     
  //     navigate('/tenant-screening');
  //   } catch (err) {
  //     console.error('Failed to submit application:', err);
  //     setError('Failed to submit application. Please try again later.');
  //   } finally {
  //     setSubmitting(false);
  //   }
  // };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          component={RouterLink}
          to="/tenant-screening"
          startIcon={<ArrowBackIcon />}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Typography variant="h4" component="h1">
          {isEditMode ? 'Edit Application' : 'New Application'}
        </Typography>
      </Box>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box>
          {activeStep === steps.length ? (
            // Final step - submission complete
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Typography variant="h5" gutterBottom>
                Application submitted successfully!
              </Typography>
              <Typography variant="body1" paragraph>
                Your application has been submitted and is pending review.
              </Typography>
              <Button
                variant="contained"
                component={RouterLink}
                to="/tenant-screening"
                sx={{ mt: 2 }}
              >
                View All Applications
              </Button>
            </Box>
          ) : (
            // Form steps
            <Box>
              <Box sx={{ py: 3, minHeight: '300px' }}>
                {renderStepContent(activeStep)}
              </Box>

              {/* Navigation buttons */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 2 }}>
                <Button
                  variant="outlined"
                  disabled={activeStep === 0}
                  onClick={handleBack}
                >
                  Back
                </Button>
                <Box>
                  {activeStep === steps.length - 1 ? (
                    <Button
                      variant="contained"
                      onClick={handleSubmit}
                      disabled={submitting}
                    >
                      {submitting ? <CircularProgress size={24} /> : 'Submit'}
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      onClick={handleNext}
                    >
                      Next
                    </Button>
                  )}
                </Box>
              </Box>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default ApplicationForm;
