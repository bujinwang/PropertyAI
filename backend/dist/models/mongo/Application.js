"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Application = void 0;
const mongoose_1 = require("mongoose");
const ApplicationSchema = new mongoose_1.Schema({
    listingId: { type: String, required: true },
    applicantId: { type: String, required: true },
    status: {
        type: String,
        enum: ['Pending', 'Accepted', 'Rejected', 'Requires Manual Review'],
        default: 'Pending',
    },
}, { timestamps: true });
exports.Application = (0, mongoose_1.model)('Application', ApplicationSchema);
//# sourceMappingURL=Application.js.map