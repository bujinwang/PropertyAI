import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import { RiskAssessmentDashboard } from '../components/risk-assessment';
import { Applicant } from '../types/risk-assessment';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`risk-assessment-tabpanel-${index}`}
      aria-labelledby={`risk-assessment-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

/**
 * Demo page for Risk Assessment Dashboard components
 * Showcases the complete risk assessment interface
 */
export const RiskAssessmentDemo: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [compareApplicants, setCompareApplicants] = useState<string[]>([]);
  const [showApplicantDialog, setShowApplicantDialog] = useState(false);
  const [showCompareDialog, setShowCompareDialog] = useState(false);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleApplicantSelect = (applicant: Applicant) => {
    setSelectedApplicant(applicant);
    setShowApplicantDialog(true);
  };

  const handleCompareApplicants = (applicantIds: string[]) => {
    setCompareApplicants(applicantIds);
    setShowCompareDialog(true);
  };

  const handleCloseApplicantDialog = () => {
    setShowApplicantDialog(false);
    setSelectedApplicant(null);
  };

  const handleCloseCompareDialog = () => {
    setShowCompareDialog(false);
    setCompareApplicants([]);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        AI Risk Assessment Dashboard Demo
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        This demo showcases the AI Risk Assessment Dashboard components, including 
        summary metrics, applicant lists with color-coded risk indicators, and 
        compliance features for fair housing requirements.
      </Typography>

      <Paper sx={{ mt: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="Risk assessment demo tabs">
            <Tab label="Dashboard Overview" id="risk-assessment-tab-0" />
            <Tab label="Component Features" id="risk-assessment-tab-1" />
            <Tab label="Accessibility" id="risk-assessment-tab-2" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Typography variant="h5" gutterBottom>
            Complete Dashboard View
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            The full risk assessment dashboard with summary metrics, applicant list, 
            and compliance notices. This demonstrates the complete user experience 
            for property managers reviewing applicant risk assessments.
          </Typography>
          
          <Box mt={3}>
            <RiskAssessmentDashboard
              onApplicantSelect={handleApplicantSelect}
              onCompareApplicants={handleCompareApplicants}
            />
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Typography variant="h5" gutterBottom>
            Component Features
          </Typography>
          
          <Box mb={4}>
            <Typography variant="h6" gutterBottom>
              Key Features Demonstrated:
            </Typography>
            <ul>
              <li><strong>Summary Metrics:</strong> Total applicants, risk categories, average scores</li>
              <li><strong>Color-coded Risk Indicators:</strong> Green (low), yellow (medium), red (high)</li>
              <li><strong>Sortable Applicant List:</strong> Sort by name, date, risk level, or score</li>
              <li><strong>Risk Level Filtering:</strong> Filter applicants by risk category</li>
              <li><strong>Multi-select Comparison:</strong> Select multiple applicants for comparison</li>
              <li><strong>Fair Housing Compliance:</strong> Built-in compliance notices and disclaimers</li>
              <li><strong>Real-time Updates:</strong> Refresh functionality for live data</li>
            </ul>
          </Box>

          <Box mb={4}>
            <Typography variant="h6" gutterBottom>
              Interaction Patterns:
            </Typography>
            <ul>
              <li>Click on applicant rows to view detailed risk breakdowns</li>
              <li>Use checkboxes to select multiple applicants for comparison</li>
              <li>Sort columns by clicking on table headers</li>
              <li>Filter by risk level using the dropdown filter</li>
              <li>Refresh data using the refresh button in metrics section</li>
            </ul>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography variant="h5" gutterBottom>
            Accessibility Features
          </Typography>
          
          <Box mb={4}>
            <Typography variant="h6" gutterBottom>
              Keyboard Navigation:
            </Typography>
            <ul>
              <li>All interactive elements are keyboard accessible</li>
              <li>Tab through table rows and action buttons</li>
              <li>Use Enter/Space to activate buttons and checkboxes</li>
              <li>Arrow keys for dropdown navigation</li>
            </ul>
          </Box>

          <Box mb={4}>
            <Typography variant="h6" gutterBottom>
              Screen Reader Support:
            </Typography>
            <ul>
              <li>Proper ARIA labels for all interactive elements</li>
              <li>Table headers associated with data cells</li>
              <li>Risk level indicators have descriptive labels</li>
              <li>Loading states announced to screen readers</li>
            </ul>
          </Box>

          <Box mb={4}>
            <Typography variant="h6" gutterBottom>
              Visual Accessibility:
            </Typography>
            <ul>
              <li>High contrast colors for risk level indicators</li>
              <li>Color-blind friendly color palette</li>
              <li>Clear visual hierarchy with proper typography</li>
              <li>Sufficient spacing between interactive elements</li>
            </ul>
          </Box>

          <Box mb={4}>
            <Typography variant="h6" gutterBottom>
              Compliance Features:
            </Typography>
            <ul>
              <li>Fair housing disclaimers prominently displayed</li>
              <li>Clear indication that AI is providing guidance only</li>
              <li>Emphasis on human review requirements</li>
              <li>Transparent risk factor explanations</li>
            </ul>
          </Box>
        </TabPanel>
      </Paper>

      {/* Applicant Details Dialog */}
      <Dialog
        open={showApplicantDialog}
        onClose={handleCloseApplicantDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Applicant Details: {selectedApplicant?.name}
        </DialogTitle>
        <DialogContent>
          {selectedApplicant && (
            <Box>
              <Typography variant="body1" paragraph>
                <strong>Email:</strong> {selectedApplicant.email}
              </Typography>
              <Typography variant="body1" paragraph>
                <strong>Application Date:</strong> {selectedApplicant.applicationDate.toLocaleDateString()}
              </Typography>
              <Typography variant="body1" paragraph>
                <strong>Status:</strong> {selectedApplicant.status}
              </Typography>
              {selectedApplicant.riskAssessment && (
                <>
                  <Typography variant="body1" paragraph>
                    <strong>Risk Level:</strong> {selectedApplicant.riskAssessment.riskLevel}
                  </Typography>
                  <Typography variant="body1" paragraph>
                    <strong>Risk Score:</strong> {selectedApplicant.riskAssessment.overallScore}
                  </Typography>
                  <Typography variant="body1" paragraph>
                    <strong>Explanation:</strong> {selectedApplicant.riskAssessment.explanation}
                  </Typography>
                  <Typography variant="body1" paragraph>
                    <strong>Confidence:</strong> {selectedApplicant.riskAssessment.confidence}%
                  </Typography>
                </>
              )}
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Note: This is a simplified view. In the full implementation, 
                this would show detailed risk factor breakdowns, charts, and 
                additional applicant information.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseApplicantDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Compare Applicants Dialog */}
      <Dialog
        open={showCompareDialog}
        onClose={handleCloseCompareDialog}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Compare Applicants ({compareApplicants.length} selected)
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            Selected applicant IDs: {compareApplicants.join(', ')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Note: This is a placeholder for the comparison interface. 
            In the full implementation, this would show a detailed 
            side-by-side comparison of risk factors, scores, and 
            recommendations for the selected applicants.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCompareDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default RiskAssessmentDemo;