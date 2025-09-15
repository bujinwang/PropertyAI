#!/usr/bin/env node

/**
 * Feedback Analysis Script for Epic 21
 * Advanced Analytics and AI Insights Features
 *
 * Analyzes user feedback to generate insights and recommendations
 */

const fs = require('fs').promises;
const path = require('path');

class FeedbackAnalyzer {
  constructor() {
    this.feedbackData = [];
    this.analysis = {
      summary: {},
      trends: {},
      insights: [],
      recommendations: [],
      alerts: []
    };
  }

  /**
   * Load feedback data from JSON file or API
   */
  async loadFeedbackData(source = 'api') {
    try {
      if (source === 'api') {
        // In production, this would call the actual API
        console.log('Loading feedback data from API...');
        // Simulate API call
        this.feedbackData = await this.getMockFeedbackData();
      } else {
        // Load from file
        const filePath = path.join(__dirname, '../data/feedback-export.json');
        const data = await fs.readFile(filePath, 'utf8');
        this.feedbackData = JSON.parse(data);
      }

      console.log(`Loaded ${this.feedbackData.length} feedback entries`);
    } catch (error) {
      console.error('Error loading feedback data:', error.message);
      throw error;
    }
  }

  /**
   * Generate comprehensive analysis
   */
  async analyzeFeedback() {
    console.log('Analyzing feedback data...');

    this.analyzeSummary();
    this.analyzeTrends();
    this.generateInsights();
    this.generateRecommendations();
    this.identifyAlerts();

    return this.analysis;
  }

  /**
   * Analyze summary statistics
   */
  analyzeSummary() {
    const total = this.feedbackData.length;
    const ratings = this.feedbackData.map(f => f.rating);
    const averageRating = ratings.reduce((sum, r) => sum + r, 0) / total;

    const statusCounts = this.feedbackData.reduce((acc, f) => {
      acc[f.status] = (acc[f.status] || 0) + 1;
      return acc;
    }, {});

    const categoryCounts = this.feedbackData.reduce((acc, f) => {
      acc[f.category] = (acc[f.category] || 0) + 1;
      return acc;
    }, {});

    const featureCounts = this.feedbackData.reduce((acc, f) => {
      acc[f.feature] = (acc[f.feature] || 0) + 1;
      return acc;
    }, {});

    this.analysis.summary = {
      totalFeedback: total,
      averageRating: Math.round(averageRating * 10) / 10,
      ratingDistribution: this.calculateRatingDistribution(ratings),
      statusBreakdown: statusCounts,
      topCategories: this.getTopItems(categoryCounts, 5),
      featureBreakdown: featureCounts,
      responseRate: this.calculateResponseRate(statusCounts),
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Analyze trends over time
   */
  analyzeTrends() {
    const now = new Date();
    const periods = {
      last7days: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      last30days: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      last90days: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    };

    this.analysis.trends = {};

    Object.entries(periods).forEach(([period, startDate]) => {
      const periodData = this.feedbackData.filter(f =>
        new Date(f.createdAt) >= startDate
      );

      if (periodData.length > 0) {
        const avgRating = periodData.reduce((sum, f) => sum + f.rating, 0) / periodData.length;
        const negativeFeedback = periodData.filter(f => f.rating <= 2).length;

        this.analysis.trends[period] = {
          feedbackCount: periodData.length,
          averageRating: Math.round(avgRating * 10) / 10,
          negativeFeedbackCount: negativeFeedback,
          negativeFeedbackRate: Math.round((negativeFeedback / periodData.length) * 100)
        };
      }
    });
  }

  /**
   * Generate insights from feedback analysis
   */
  generateInsights() {
    const insights = [];

    // Rating insights
    const avgRating = this.analysis.summary.averageRating;
    if (avgRating >= 4.0) {
      insights.push({
        type: 'positive',
        title: 'High User Satisfaction',
        description: `Average rating of ${avgRating}/5 indicates strong user satisfaction with Epic 21 features.`,
        impact: 'high'
      });
    } else if (avgRating <= 3.0) {
      insights.push({
        type: 'concern',
        title: 'User Satisfaction Concerns',
        description: `Average rating of ${avgRating}/5 suggests areas for improvement.`,
        impact: 'high'
      });
    }

    // Feature-specific insights
    const featureBreakdown = this.analysis.summary.featureBreakdown;
    const topFeature = Object.entries(featureBreakdown)
      .sort(([,a], [,b]) => b - a)[0];

    if (topFeature) {
      insights.push({
        type: 'info',
        title: 'Most Discussed Feature',
        description: `${this.formatFeatureName(topFeature[0])} receives the most feedback (${topFeature[1]} submissions).`,
        impact: 'medium'
      });
    }

    // Response rate insights
    const responseRate = this.analysis.summary.responseRate;
    if (responseRate < 50) {
      insights.push({
        type: 'action',
        title: 'Low Response Rate',
        description: `Only ${responseRate}% of feedback has been addressed. Consider improving response times.`,
        impact: 'medium'
      });
    }

    // Trend insights
    const recentTrends = this.analysis.trends.last7days;
    if (recentTrends && recentTrends.negativeFeedbackRate > 20) {
      insights.push({
        type: 'alert',
        title: 'Increasing Negative Feedback',
        description: `${recentTrends.negativeFeedbackRate}% of recent feedback is negative. Investigate recent changes.`,
        impact: 'high'
      });
    }

    this.analysis.insights = insights;
  }

  /**
   * Generate recommendations based on analysis
   */
  generateRecommendations() {
    const recommendations = [];

    // Based on low-rated categories
    const lowRatedFeedback = this.feedbackData.filter(f => f.rating <= 2);
    const lowRatedCategories = lowRatedFeedback.reduce((acc, f) => {
      acc[f.category] = (acc[f.category] || 0) + 1;
      return acc;
    }, {});

    const topProblemCategory = Object.entries(lowRatedCategories)
      .sort(([,a], [,b]) => b - a)[0];

    if (topProblemCategory) {
      recommendations.push({
        priority: 'high',
        category: 'usability',
        title: `Address ${this.formatCategoryName(topProblemCategory[0])} Issues`,
        description: `${topProblemCategory[1]} users reported issues with ${this.formatCategoryName(topProblemCategory[0])}. Consider UI/UX improvements.`,
        effort: 'medium',
        impact: 'high'
      });
    }

    // Response time recommendations
    if (this.analysis.summary.responseRate < 70) {
      recommendations.push({
        priority: 'medium',
        category: 'process',
        title: 'Improve Feedback Response Times',
        description: 'Implement automated acknowledgment and faster resolution processes.',
        effort: 'low',
        impact: 'medium'
      });
    }

    // Feature adoption recommendations
    const featureBreakdown = this.analysis.summary.featureBreakdown;
    const leastUsedFeature = Object.entries(featureBreakdown)
      .sort(([,a], [,b]) => a - b)[0];

    if (leastUsedFeature) {
      recommendations.push({
        priority: 'low',
        category: 'adoption',
        title: `Increase ${this.formatFeatureName(leastUsedFeature[0])} Adoption`,
        description: `Only ${leastUsedFeature[1]} users have provided feedback on ${this.formatFeatureName(leastUsedFeature[0])}. Consider additional training or feature promotion.`,
        effort: 'low',
        impact: 'low'
      });
    }

    this.analysis.recommendations = recommendations;
  }

  /**
   * Identify alerts that require immediate attention
   */
  identifyAlerts() {
    const alerts = [];

    // Critical rating drop
    const recentAvg = this.analysis.trends.last7days?.averageRating;
    const overallAvg = this.analysis.summary.averageRating;

    if (recentAvg && overallAvg && (overallAvg - recentAvg) > 0.5) {
      alerts.push({
        level: 'critical',
        title: 'Significant Rating Drop',
        description: `Recent average rating (${recentAvg}) is 0.5+ points below overall average (${overallAvg}). Immediate investigation required.`,
        actionRequired: 'Investigate recent changes and user complaints',
        timeframe: 'Immediate'
      });
    }

    // High volume of negative feedback
    const recentNegative = this.analysis.trends.last7days?.negativeFeedbackRate;
    if (recentNegative && recentNegative > 30) {
      alerts.push({
        level: 'high',
        title: 'High Negative Feedback Volume',
        description: `${recentNegative}% of recent feedback is negative. May indicate systemic issues.`,
        actionRequired: 'Review recent feature updates and user pain points',
        timeframe: 'Within 24 hours'
      });
    }

    // Unaddressed critical feedback
    const unaddressedCritical = this.feedbackData.filter(f =>
      f.priority === 'critical' &&
      ['new', 'acknowledged'].includes(f.status)
    ).length;

    if (unaddressedCritical > 0) {
      alerts.push({
        level: 'medium',
        title: 'Unaddressed Critical Feedback',
        description: `${unaddressedCritical} critical feedback items remain unaddressed.`,
        actionRequired: 'Prioritize and resolve critical user issues',
        timeframe: 'Within 48 hours'
      });
    }

    this.analysis.alerts = alerts;
  }

  /**
   * Helper methods
   */
  calculateRatingDistribution(ratings) {
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratings.forEach(rating => {
      distribution[rating] = (distribution[rating] || 0) + 1;
    });
    return distribution;
  }

  calculateResponseRate(statusCounts) {
    const total = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);
    const responded = (statusCounts.acknowledged || 0) +
                     (statusCounts.in_review || 0) +
                     (statusCounts.addressed || 0) +
                     (statusCounts.closed || 0);
    return Math.round((responded / total) * 100);
  }

  getTopItems(obj, count) {
    return Object.entries(obj)
      .sort(([,a], [,b]) => b - a)
      .slice(0, count)
      .map(([key, value]) => ({ [key]: value }));
  }

  formatFeatureName(feature) {
    const names = {
      predictive_maintenance: 'Predictive Maintenance',
      tenant_churn_prediction: 'Tenant Churn Prediction',
      market_trend_integration: 'Market Trend Integration',
      ai_powered_reporting: 'AI-Powered Reporting',
      risk_assessment_dashboard: 'Risk Assessment Dashboard'
    };
    return names[feature] || feature;
  }

  formatCategoryName(category) {
    const names = {
      accuracy: 'accuracy',
      usability: 'usability',
      performance: 'performance',
      functionality: 'functionality',
      design: 'design',
      integration: 'integration',
      data_quality: 'data quality'
    };
    return names[category] || category;
  }

  /**
   * Mock data for development/testing
   */
  async getMockFeedbackData() {
    return [
      {
        id: '1',
        userId: 'user1',
        userType: 'property_manager',
        feature: 'predictive_maintenance',
        feedbackType: 'usability_feedback',
        rating: 4,
        title: 'Great predictive insights',
        description: 'The maintenance predictions are very accurate and helpful.',
        category: 'accuracy',
        priority: 'medium',
        status: 'addressed',
        createdAt: '2025-09-10T10:00:00Z'
      },
      {
        id: '2',
        userId: 'user2',
        userType: 'maintenance_staff',
        feature: 'market_trend_integration',
        feedbackType: 'performance_feedback',
        rating: 2,
        title: 'Slow loading times',
        description: 'Market data takes too long to load, affecting workflow.',
        category: 'performance',
        priority: 'high',
        status: 'acknowledged',
        createdAt: '2025-09-12T14:30:00Z'
      },
      // Add more mock data as needed
    ];
  }

  /**
   * Export analysis results
   */
  async exportAnalysis(format = 'json') {
    const filename = `epic21-feedback-analysis-${new Date().toISOString().split('T')[0]}`;

    if (format === 'json') {
      await fs.writeFile(
        path.join(__dirname, `../reports/${filename}.json`),
        JSON.stringify(this.analysis, null, 2)
      );
    } else if (format === 'markdown') {
      const markdown = this.generateMarkdownReport();
      await fs.writeFile(
        path.join(__dirname, `../reports/${filename}.md`),
        markdown
      );
    }

    console.log(`Analysis exported to ${filename}.${format}`);
  }

  /**
   * Generate markdown report
   */
  generateMarkdownReport() {
    const { summary, trends, insights, recommendations, alerts } = this.analysis;

    return `# Epic 21 Feedback Analysis Report

Generated: ${new Date().toISOString()}

## Executive Summary

- **Total Feedback**: ${summary.totalFeedback}
- **Average Rating**: ${summary.averageRating}/5
- **Response Rate**: ${summary.responseRate}%

## Key Metrics

### Rating Distribution
${Object.entries(summary.ratingDistribution)
  .map(([rating, count]) => `- ${rating} stars: ${count}`)
  .join('\n')}

### Top Categories
${summary.topCategories.map(cat => `- ${Object.keys(cat)[0]}: ${Object.values(cat)[0]}`).join('\n')}

## Trends

${Object.entries(trends).map(([period, data]) =>
  `### ${period.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
- Feedback Count: ${data.feedbackCount}
- Average Rating: ${data.averageRating}
- Negative Feedback: ${data.negativeFeedbackRate}%`
).join('\n\n')}

## Insights

${insights.map(insight =>
  `### ${insight.title}
**Type**: ${insight.type} | **Impact**: ${insight.impact}
${insight.description}`
).join('\n\n')}

## Recommendations

${recommendations.map(rec =>
  `### ${rec.title}
**Priority**: ${rec.priority} | **Effort**: ${rec.effort} | **Impact**: ${rec.impact}
${rec.description}`
).join('\n\n')}

## Alerts

${alerts.length === 0 ? 'No active alerts' :
  alerts.map(alert =>
    `### ${alert.title} (${alert.level.toUpperCase()})
${alert.description}
**Action Required**: ${alert.actionRequired}
**Timeframe**: ${alert.timeframe}`
  ).join('\n\n')}

---
*Report generated by Epic 21 Feedback Analysis Script*
`;
  }
}

// Main execution
async function main() {
  const analyzer = new FeedbackAnalyzer();

  try {
    console.log('🚀 Starting Epic 21 Feedback Analysis...\n');

    // Load data
    await analyzer.loadFeedbackData(process.argv[2] === '--file' ? 'file' : 'api');

    // Analyze
    await analyzer.analyzeFeedback();

    // Display results
    console.log('\n📊 Analysis Results:');
    console.log('==================');
    console.log(`Total Feedback: ${analyzer.analysis.summary.totalFeedback}`);
    console.log(`Average Rating: ${analyzer.analysis.summary.averageRating}/5`);
    console.log(`Response Rate: ${analyzer.analysis.summary.responseRate}%`);

    if (analyzer.analysis.alerts.length > 0) {
      console.log('\n🚨 Active Alerts:');
      analyzer.analysis.alerts.forEach(alert => {
        console.log(`- ${alert.level.toUpperCase()}: ${alert.title}`);
      });
    }

    // Export results
    const format = process.argv.includes('--markdown') ? 'markdown' : 'json';
    await analyzer.exportAnalysis(format);

    console.log('\n✅ Analysis completed successfully!');

  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = FeedbackAnalyzer;