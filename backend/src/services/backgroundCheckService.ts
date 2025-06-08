import Checkr from 'checkr';

class BackgroundCheckService {
  private checkr: any;

  constructor() {
    this.checkr = new Checkr(process.env.CHECKR_API_KEY);
  }

  async createCandidate(data: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    zipcode: string;
    dob: string;
    ssn: string;
  }) {
    return this.checkr.candidates.create(data);
  }

  async createReport(candidateId: string, pkg: string) {
    return this.checkr.reports.create({
      candidate_id: candidateId,
      package: pkg,
    });
  }

  async getReport(reportId: string) {
    return this.checkr.reports.get(reportId);
  }
}

export default new BackgroundCheckService();
