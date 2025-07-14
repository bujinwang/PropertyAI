import { Application } from '../models/mongo/Application';

class ManualReviewService {
  async getApplicationsForReview() {
    return Application.find({ status: 'Requires Manual Review' });
  }

  async approveApplication(applicationId: string) {
    return Application.findByIdAndUpdate(
      applicationId,
      { status: 'Verified' },
      { new: true }
    );
  }

  async rejectApplication(applicationId: string) {
    return Application.findByIdAndUpdate(
      applicationId,
      { status: 'Rejected' },
      { new: true }
    );
  }
}

export default new ManualReviewService();
