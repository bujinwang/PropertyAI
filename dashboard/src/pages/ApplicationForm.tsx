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
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import tenantScreeningService from '../services/tenantScreeningService';
import { ApplicationFormData } from '../types/tenantScreening';

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
      
      if (isEditMode) {
        await tenantScreeningService.updateApplication(id!, formData);
      } else {
        await tenantScreeningService.createApplication(formData);
      }
      
      navigate('/tenant-screening');
    } catch (err) {
      console.error('Failed to submit application:', err);
      setError('Failed to submit application. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };

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
              {/* Step content would go here */}
              <Box sx={{ py: 3, minHeight: '300px' }}>
                <Typography variant="h6" gutterBottom>
                  {steps[activeStep]}
                </Typography>
                
                {/* This is a placeholder for the actual form fields */}
                <Typography variant="body1" paragraph>
                  This is a placeholder for the {steps[activeStep].toLowerCase()} form step.
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  In a complete implementation, this would contain form fields relevant to this step.
                </Typography>
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
