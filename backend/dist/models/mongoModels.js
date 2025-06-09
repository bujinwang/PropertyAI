"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationDetails = exports.ListingDetails = exports.AiContent = void 0;
const mongoose_1 = require("mongoose");
// Mongoose schema for AI-generated content
const AiContentSchema = new mongoose_1.Schema({
    contentId: { type: String, required: true, unique: true },
    contentType: { type: String, required: true },
    originalPrompt: { type: String, required: true },
    generatedContent: { type: String, required: true },
    relatedEntityId: { type: String },
    relatedEntityType: { type: String },
    modelName: { type: String, required: true },
    modelVersion: { type: String },
    parameters: { type: mongoose_1.Schema.Types.Mixed },
    createdBy: { type: String, required: true },
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
    tags: [String],
    usageMetrics: {
        views: { type: Number, default: 0 },
        conversions: { type: Number, default: 0 },
        engagement: { type: Number, default: 0 },
    },
    feedback: [{
            userId: { type: String, required: true },
            rating: { type: Number, required: true },
            comments: { type: String },
            timestamp: { type: Date, default: Date.now },
        }],
    revisionHistory: [{
            version: { type: Number, required: true },
            content: { type: String, required: true },
            prompt: { type: String, required: true },
            timestamp: { type: Date, default: Date.now },
            revisedBy: { type: String, required: true },
        }],
}, {
    timestamps: true,
});
exports.AiContent = (0, mongoose_1.model)('AiContent', AiContentSchema);
const ListingDetailsSchema = new mongoose_1.Schema({
    listingId: { type: String, required: true, unique: true },
    amenities: [String],
    photos: [{ url: String, caption: String }],
    virtualTourUrl: String,
    floorPlan: { url: String, description: String },
    communityFeatures: [String],
    nearbySchools: [{ name: String, rating: Number }],
    crimeRate: mongoose_1.Schema.Types.Mixed,
    demographics: mongoose_1.Schema.Types.Mixed,
}, { timestamps: true });
exports.ListingDetails = (0, mongoose_1.model)('ListingDetails', ListingDetailsSchema);
const ApplicationDetailsSchema = new mongoose_1.Schema({
    applicationId: { type: String, required: true, unique: true },
    applicantInfo: {
        previousAddresses: [{ address: String, duration: String }],
        employmentHistory: [{ employer: String, position: String, duration: String }],
    },
    creditReport: mongoose_1.Schema.Types.Mixed,
    backgroundCheck: mongoose_1.Schema.Types.Mixed,
    references: [{ name: String, relationship: String, contact: String }],
}, { timestamps: true });
exports.ApplicationDetails = (0, mongoose_1.model)('ApplicationDetails', ApplicationDetailsSchema);
//# sourceMappingURL=mongoModels.js.map