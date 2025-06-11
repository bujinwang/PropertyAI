import React from 'react';

const DocumentVerificationStatusScreen: React.FC = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Document Verification Status</h1>

      {/* Document Checklist */}
      <div className="mb-8 bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-2">Document Checklist</h2>
        {/* Placeholder for document checklist */}
        <ul>
          <li className="flex justify-between items-center p-2 border-b">
            <span>Proof of Income</span>
            <span className="text-green-600 font-semibold">Verified</span>
          </li>
          <li className="flex justify-between items-center p-2 border-b">
            <span>Government ID</span>
            <span className="text-yellow-600 font-semibold">Pending Review</span>
          </li>
          <li className="flex justify-between items-center p-2">
            <span>Reference Letter</span>
            <span className="text-red-600 font-semibold">Rejected</span>
          </li>
        </ul>
      </div>

      {/* Flagged Documents */}
      <div className="mb-8 bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-2">Flagged Documents</h2>
        {/* Placeholder for flagged documents */}
        <p className="text-gray-500">No documents are currently flagged for review.</p>
      </div>

      {/* AI-Suggested Follow-Up Questions */}
      <div className="mb-8 bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-2">AI-Suggested Follow-Up Questions</h2>
        {/* Placeholder for AI questions */}
        <p className="text-gray-500">No follow-up questions suggested at this time.</p>
      </div>

      {/* Request Additional Documentation */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Request Additional Documentation</h2>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="mb-4">
            <label htmlFor="document-name" className="block text-sm font-medium text-gray-700">Document Name</label>
            <input type="text" id="document-name" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
          </div>
          <div className="mb-4">
            <label htmlFor="due-date" className="block text-sm font-medium text-gray-700">Due Date</label>
            <input type="date" id="due-date" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
          </div>
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">
            Send Request
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentVerificationStatusScreen;
