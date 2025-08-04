import React, { useState } from 'react';
import { 
 Container, 
 Typography, 
 Box, 
 Grid, 
 Paper, 
 Button,
 Divider
} from '@mui/material';
import {
 AIGeneratedContent,
 ConfidenceIndicator,
 SuggestionChip,
 ExplanationTooltip,
 LoadingStateIndicator,
} from '../design-system/components/ai';
import ToneStyleConfiguration from '../components/communication-training/ToneStyleConfiguration';
import TemplateApprovalWorkflowDemo from '../components/communication-training/TemplateApprovalWorkflow.demo';
import { AIFeedback, AIExplanation } from '../types/ai';
import { ToneStyleConfig, DEFAULT_TONE_STYLE_EXAMPLES } from '../types/communication-training';

const AIComponentsDemo: React.FC = () => {
 const [loading, setLoading] = useState(false);
 const [progress, setProgress] = useState(0);
 const [toneStyleConfig, setToneStyleConfig] = useState<ToneStyleConfig>({
  tone: 'friendly',
  style: 'detailed',
  examples: DEFAULT_TONE_STYLE_EXAMPLES
 });

 const handleFeedback = (feedback: AIFeedback) => {
  console.log('Feedback received:', feedback);
 };

 const sampleExplanation: AIExplanation = {
  title: 'Risk Assessment Explanation',
  content: 'This risk score is calculated based on multiple factors including credit history, income verification, and rental history.',
  factors: [
   {
    name: 'Credit Score',
    value: 750,
    weight: 0.4,
    description: 'Excellent credit score indicates low financial risk',
    impact: 'positive'
   },
   {
    name: 'Income Ratio',
    value: '3.2x rent',
    weight: 0.3,
    description: 'Income is 3.2 times the monthly rent',
    impact: 'positive'
   },
   {
    name: 'Rental History',
    value: 'Limited',
    weight: 0.3,
    description: 'Limited rental history available for verification',
    impact: 'negative'
   }
  ],
  methodology: 'Machine learning model trained on 10,000+ rental applications',
  limitations: [
   'Model accuracy decreases for applicants with unique circumstances',
   'Recent changes in employment may not be fully reflected'
  ]
 };

 const simulateLoading = () => {
  setLoading(true);
  setProgress(0);
  
  const interval = setInterval(() => {
   setProgress(prev => {
    if (prev >= 100) {
     clearInterval(interval);
     setLoading(false);
     return 100;
    }
    return prev + 10;
   });
  }, 200);
 };

 return (
  <Container maxWidth="lg" sx={{ py: 4 }}>
   <Typography variant="h3" gutterBottom>
    AI Components Demo
   </Typography>
   <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
    Demonstration of the core AI component infrastructure
   </Typography>

   <Grid container spacing={4}>
    {/* AIGeneratedContent Demo */}
    <Grid xs={12}>
     <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
       AI Generated Content
      </Typography>
      <Box sx={{ mb: 2 }}>
       <AIGeneratedContent
        confidence={85}
        explanation="This content was generated using advanced natural language processing to provide personalized recommendations."
        onFeedback={handleFeedback}
       >
        <Typography variant="body1">
         Based on your property's location and amenities, we recommend setting the rent at $2,400/month. 
         This price point aligns with similar properties in your area and should attract quality tenants 
         while maximizing your rental income.
        </Typography>
       </AIGeneratedContent>
      </Box>
      
      <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
       Filled Variant
      </Typography>
      <AIGeneratedContent
       variant="filled"
       confidence={92}
       explanation={sampleExplanation}
       onFeedback={handleFeedback}
      >
       <Typography variant="body1">
        This applicant has a <strong>low risk score of 2.1/10</strong>. 
        They demonstrate excellent financial stability and are highly likely to be a reliable tenant.
       </Typography>
      </AIGeneratedContent>
     </Paper>
    </Grid>

    {/* ConfidenceIndicator Demo */}
    <Grid xs={12} md={6}>
     <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
       Confidence Indicators
      </Typography>
      
      <Box sx={{ mb: 3 }}>
       <Typography variant="h6" sx={{ mb: 1 }}>High Confidence (Green)</Typography>
       <ConfidenceIndicator confidence={85} colorCoded />
      </Box>
      
      <Box sx={{ mb: 3 }}>
       <Typography variant="h6" sx={{ mb: 1 }}>Medium Confidence (Yellow) with Tooltip</Typography>
       <ConfidenceIndicator 
        confidence={72} 
        showTooltip 
        explanation="Confidence based on data quality and model accuracy. Medium confidence suggests reviewing additional factors."
        colorCoded 
       />
      </Box>
      
      <Box sx={{ mb: 3 }}>
       <Typography variant="h6" sx={{ mb: 1 }}>Low Confidence (Red)</Typography>
       <ConfidenceIndicator 
        confidence={45} 
        colorCoded 
        showTooltip
       />
      </Box>
      
      <Box sx={{ mb: 3 }}>
       <Typography variant="h6" sx={{ mb: 1 }}>Circular Variant - High Confidence</Typography>
       <ConfidenceIndicator 
        confidence={94} 
        variant="circular" 
        size="large"
        colorCoded 
        showTooltip
       />
      </Box>
      
      <Box sx={{ mb: 3 }}>
       <Typography variant="h6" sx={{ mb: 1 }}>Without Numerical Score</Typography>
       <ConfidenceIndicator 
        confidence={78} 
        colorCoded 
        showNumericalScore={false}
       />
      </Box>
     </Paper>
    </Grid>

    {/* SuggestionChip Demo */}
    <Grid xs={12} md={6}>
     <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
       Suggestion Chips
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
       <SuggestionChip 
        label="Increase rent by 5%" 
        confidence={78}
       />
       
       <SuggestionChip 
        label="Schedule maintenance inspection" 
        confidence={91}
        showFeedback
        onFeedback={handleFeedback}
       />
       
       <SuggestionChip 
        label="Update property photos" 
        confidence={65}
        variant="filled"
        showFeedback
        onFeedback={handleFeedback}
       />
      </Box>
     </Paper>
    </Grid>

    {/* ExplanationTooltip Demo */}
    <Grid xs={12} md={6}>
     <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
       Explanation Tooltips
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
       <ExplanationTooltip
        title="Simple Explanation"
        content="This is a simple text explanation that provides context for the user."
       >
        <Button variant="outlined">
         Hover for Simple Explanation
        </Button>
       </ExplanationTooltip>
       
       <ExplanationTooltip
        title="Detailed Risk Analysis"
        content={sampleExplanation}
        placement="right"
       >
        <Button variant="outlined">
         Hover for Detailed Explanation
        </Button>
       </ExplanationTooltip>
      </Box>
     </Paper>
    </Grid>

    {/* LoadingStateIndicator Demo */}
    <Grid xs={12} md={6}>
     <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
       Loading State Indicators
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
       <Button 
        variant="contained" 
        onClick={simulateLoading}
        disabled={loading}
       >
        Simulate Loading
       </Button>
       
       {loading && (
        <>
         <LoadingStateIndicator
          message="Processing AI analysis..."
          variant="progress"
          progress={progress}
          estimatedTime={10}
         />
         
         <LoadingStateIndicator
          message="Generating recommendations..."
          variant="spinner"
          estimatedTime={15}
         />
        </>
       )}
       
       <Divider sx={{ my: 1 }} />
       
       <Typography variant="h6">Skeleton Loading</Typography>
       <LoadingStateIndicator
        message="Loading property data..."
        variant="skeleton"
        estimatedTime={5}
       />
      </Box>
     </Paper>
    </Grid>

    {/* ToneStyleConfiguration Demo */}
    <Grid xs={12}>
     <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
       Tone & Style Configuration
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
       Configure AI communication tone and style for different scenarios
      </Typography>
      
      <ToneStyleConfiguration
       config={toneStyleConfig}
       onConfigChange={setToneStyleConfig}
      />
     </Paper>
    </Grid>

    {/* Template Approval Workflow Demo */}
    <Grid xs={12}>
     <Paper sx={{ p: 3 }}>
      <TemplateApprovalWorkflowDemo />
     </Paper>
    </Grid>
   </Grid>
  </Container>
 );
};

export default AIComponentsDemo;