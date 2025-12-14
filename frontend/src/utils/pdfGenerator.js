import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveAs } from 'file-saver';
import { fetchCurrentUserName, buildSignatureFooter } from './userIdentity';

const formatDate = (date) => {
  try {
    if (!date) return 'N/A';
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return 'Invalid Date';
    
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'N/A';
  }
};

const formatNumber = (num) => {
  try {
    if (num === null || num === undefined || isNaN(num)) return '0';
    return Number(num).toLocaleString();
  } catch (error) {
    console.error('Error formatting number:', error);
    return '0';
  }
};

const addHeader = (doc, title, description) => {
  try {
    doc.addImage('/images/sti_logo.png', 'PNG', 14, 10, 30, 20); 
  } catch (error) {
    console.error('Error adding STI logo to PDF:', error);
    console.warn('Proceeding without logo');
  }

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('STI COLLEGE NOVALICHES', 50, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Diamond Avenue Corner, Quirino Highway, San Bartolome,', 50, 28);
  doc.text('Novaliches, Quezon City', 50, 35);

  doc.setLineWidth(0.5);
  doc.line(14, 45, 196, 45);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 55);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(description, 14, 65);
  
  doc.setFontSize(10);
  doc.text(`Generated on: ${formatDate(new Date())}`, 14, 75);
  
  return 85; 
};

const addFooter = (doc, reportTitle) => {
  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;
  const footerY = pageHeight - 20; 

  doc.setLineWidth(0.5);
  doc.setDrawColor(128, 128, 128); 
  doc.line(14, footerY - 5, pageWidth - 14, footerY - 5);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('STI TrustElect', 14, footerY);

  const pageNumber = doc.internal.getCurrentPageInfo().pageNumber;
  const totalPages = doc.internal.getNumberOfPages();
  const pageText = `Page ${pageNumber} of ${totalPages}`;
  
  const textWidth = doc.getTextWidth(pageText);
  doc.text(pageText, pageWidth - 14 - textWidth, footerY);
  
  return footerY - 10; 
};

const addFooterToAllPages = (doc, reportTitle) => {
  const totalPages = doc.internal.getNumberOfPages();
  const currentPage = doc.internal.getCurrentPageInfo().pageNumber;

  const originalPage = currentPage;

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(doc, reportTitle || 'TrustElect Report');
  }

  if (originalPage) {
    doc.setPage(originalPage);
  }
};

const originalAddPage = jsPDF.prototype.addPage;
jsPDF.prototype.addPage = function() {
  originalAddPage.call(this);
  addFooter(this, this._reportTitle || 'TrustElect Report');
  return this;
};

const originalAutoTableAddPage = autoTable.prototype.addPage;
autoTable.prototype.addPage = function() {
  originalAutoTableAddPage.call(this);
  addFooter(this.doc, this.doc._reportTitle || 'TrustElect Report');
  return this;
};

const originalOutput = jsPDF.prototype.output;
jsPDF.prototype.output = function(type, options) {
  addFooterToAllPages(this, this._reportTitle || 'TrustElect Report');
  return originalOutput.call(this, type, options);
};

const addSignatureBlockToLastPage = (doc, footerText) => {
  if (!footerText) {
    return;
  }

  const totalPages = doc.internal.getNumberOfPages();
  if (totalPages === 0) {
    return;
  }

  doc.setPage(totalPages);
  const pageHeight = doc.internal.pageSize.height || 297; 
  const startY = Math.max(pageHeight - 60, 20);
  const lines = footerText.split('\n');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  lines.forEach((line, index) => {
    doc.text(line, 14, startY + index * 6);
  });
};

const createSummaryTable = (doc, data, columns, startY) => {
  autoTable(doc, {
    startY: startY,
    head: [columns.map(col => col.header)],
    body: data.map(row => columns.map(col => row[col.key]?.toString() || '')),
    theme: 'grid',
    styles: {
      fontSize: 10,
      cellPadding: 5,
      textColor: [0, 0, 0]
    },
    bodyStyles: {
      textColor: [0, 0, 0]
    },
    headStyles: {
      fillColor: [1, 87, 155],
      textColor: 255,
      fontStyle: 'bold'
    },
    margin: { top: 10, bottom: 30, left: 14, right: 14 }
  });
  
  return doc.lastAutoTable.finalY + 10; 
};

const generateElectionReport = (data) => {
  const doc = new jsPDF();
  doc._reportTitle = 'Election Summary Report';
  
  let currentY = addHeader(doc, 'Election Summary Report', 'Overview of all elections with detailed statistics and voter turnout.');

  const summaryData = [
    { metric: "Total Elections", value: formatNumber(data.summary.total_elections) },
    { metric: "Ongoing Elections", value: formatNumber(data.summary.ongoing_elections) },
    { metric: "Completed Elections", value: formatNumber(data.summary.completed_elections) },
    { metric: "Total Votes Cast", value: formatNumber(data.summary.total_votes_cast) },
    { metric: "Voter Turnout", value: `${data.summary.voter_turnout_percentage}%` }
  ];
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text("Summary Statistics", 14, currentY);
  
  currentY = createSummaryTable(doc, summaryData, [
    { header: "Metric", key: "metric" },
    { header: "Value", key: "value" }
  ], currentY + 10);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text("Recent Elections", 14, currentY); 
  
  createSummaryTable(doc, data.recent_elections, [
    { header: "Title", key: "title" },
    { header: "Status", key: "status" },
    { header: "Type", key: "election_type" },
    { header: "Start Date", key: "start_date" },
    { header: "End Date", key: "end_date" }
  ], currentY + 10);

  return doc;
};

const generateUserReport = (data) => {
  const doc = new jsPDF();
  doc._reportTitle = 'User Management Report';
  
  let currentY = addHeader(doc, 'User Management Report', 'Comprehensive overview of all registered users and their roles.');
  
  const summaryData = [
    { metric: "Total Users", value: formatNumber(data.summary.total_users) },
    { metric: "Active Users", value: formatNumber(data.summary.active_users) },
    { metric: "Inactive Users", value: formatNumber(data.summary.inactive_users) }
  ];
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text("Summary Statistics", 14, currentY);
  
  currentY = createSummaryTable(doc, summaryData, [
    { header: "Metric", key: "metric" },
    { header: "Value", key: "value" }
  ], currentY + 10);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text("Role Distribution", 14, currentY);
  
  createSummaryTable(doc, data.role_distribution, [
    { header: "Role", key: "role_name" },
    { header: "Total Users", key: "total_users" },
    { header: "Active", key: "active_users" },
    { header: "Inactive", key: "inactive_users" }
  ], currentY + 10);

  return doc;
};

const generateAdminActivityReport = (data) => {
  const doc = new jsPDF();
  doc._reportTitle = 'Admin Activity Report';
  
  let currentY = addHeader(doc, 'Admin Activity Report', 'Summary of administrative actions and system activities.');

  const summary = data.summary || {};
  const summaryData = [
    { metric: "Total Activities", value: formatNumber(summary.total_activities || 0) },
    { metric: "Active Admins", value: formatNumber(summary.active_admins || 0) },
    { metric: "Today's Activities", value: formatNumber(summary.activities_today || 0) },
    { metric: "Most Common Action", value: summary.most_common_action || 'N/A' }
  ];

  const activities = data.activities || [];
  const activitiesData = activities.map(activity => ({
    admin: activity.admin_name || 'Unknown',
    action: activity.action || 'Unknown',
    entity: activity.entity_type || 'Unknown',
    timestamp: formatDate(activity.created_at instanceof Date ? activity.created_at : new Date(activity.created_at))
  }));
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text("Summary Statistics", 14, currentY);
  
  currentY = createSummaryTable(doc, summaryData, [
    { header: "Metric", key: "metric" },
    { header: "Value", key: "value" }
  ], currentY + 10);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text("Recent Activities", 14, currentY);
  
  if (activitiesData.length > 0) {
    createSummaryTable(doc, activitiesData, [
      { header: "Admin", key: "admin" },
      { header: "Action", key: "action" },
      { header: "Entity", key: "entity" },
      { header: "Timestamp", key: "timestamp" }
    ], currentY + 10);
  } else {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text("No activities found for the selected period.", 14, currentY + 10);
  }

  return doc;
};

const generateElectionDetailReport = (data) => {
  const doc = new jsPDF();
  doc._reportTitle = data.title || 'Election Detail Report';
  
  let yPos = addHeader(doc, data.title, data.description);

  const summaryData = [
    { metric: "Election Title", value: data.summary.election_title },
    { metric: "Election Type", value: data.summary.election_type },
    { metric: "Status", value: data.summary.status },
    { metric: "Start Date", value: data.summary.start_date },
    { metric: "End Date", value: data.summary.end_date },
    { metric: "Total Eligible Voters", value: data.summary.total_eligible_voters },
    { metric: "Total Votes Cast", value: data.summary.total_votes_cast },
    { metric: "Voter Turnout", value: data.summary.voter_turnout_percentage }
  ];
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text("Election Summary", 14, yPos);
  
  yPos = createSummaryTable(doc, summaryData, [
    { header: "Metric", key: "metric" },
    { header: "Value", key: "value" }
  ], yPos + 10);

  if (data.positions && data.positions.length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text("Positions and Candidates", 14, yPos);
    yPos += 10;
    
    data.positions.forEach((position, index) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`${position.name} (Max Choices: ${position.max_choices})`, 14, yPos);
      yPos += 10;
      
      if (position.candidates && position.candidates.length > 0) {
        const candidateData = position.candidates.map(candidate => ({
          name: candidate.name,
          party: candidate.party,
          votes: candidate.vote_count,
          percentage: candidate.vote_percentage
        }));
        
        yPos = createSummaryTable(doc, candidateData, [
          { header: "Candidate", key: "name" },
          { header: "Party", key: "party" },
          { header: "Votes", key: "votes" },
          { header: "Percentage", key: "percentage" }
        ], yPos);
      } else {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text("No candidates found for this position.", 14, yPos);
        yPos += 10;
      }
      
      yPos += 10; 
    });
  }

  
  return doc;
};

const generateElectionResultReport = (data) => {
  const doc = new jsPDF();
  doc._reportTitle = data.title || 'Election Result Report';
  
  let yPos = addHeader(doc, data.title, data.description);

  const electionData = [
    { metric: "Election Title", value: data.election_details.title },
    { metric: "Election Type", value: data.election_details.type },
    { metric: "Status", value: data.election_details.status },
    { metric: "Start Date", value: data.election_details.date_from },
    { metric: "End Date", value: data.election_details.date_to },
    { metric: "Total Eligible Voters", value: formatNumber(data.election_details.total_eligible_voters) },
    { metric: "Total Votes Cast", value: formatNumber(data.election_details.total_votes) },
    { metric: "Voter Turnout", value: `${data.election_details.voter_turnout_percentage}%` }
  ];
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text("Election Details", 14, yPos);
  
  yPos = createSummaryTable(doc, electionData, [
    { header: "Detail", key: "metric" },
    { header: "Value", key: "value" }
  ], yPos + 10);

  if (data.summary) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text("Summary Statistics", 14, yPos);
    yPos += 10;
    
    const summaryData = [
      { metric: "Total Positions", value: formatNumber(data.summary.total_positions) },
      { metric: "Total Candidates", value: formatNumber(data.summary.total_candidates) },
      { metric: "Total Votes Cast", value: formatNumber(data.summary.total_votes_cast) },
      { metric: "Voter Turnout", value: `${data.summary.voter_turnout}%` }
    ];
    
    yPos = createSummaryTable(doc, summaryData, [
      { header: "Metric", key: "metric" },
      { header: "Value", key: "value" }
    ], yPos);
  }

  if (data.positions && data.positions.length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text("Election Results by Position", 14, yPos);
    yPos += 10;
    
    data.positions.forEach((position, positionIndex) => {
      if (yPos > 200) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Position: ${position.position_name}`, 14, yPos);
      yPos += 8;

      if (position.candidates && position.candidates.length > 0) {
        const winner = position.candidates.find(c => c.is_winner) || position.candidates[0];
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 100, 0);
        doc.text(`Winner: ${winner.name} (${winner.vote_count} votes - ${winner.vote_percentage}%)`, 14, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += 8;
      }

      if (position.candidates && position.candidates.length > 0) {
        const candidateData = position.candidates.map((candidate, index) => ({
          rank: candidate.rank,
          name: candidate.name,
          party: candidate.party,
          votes: formatNumber(candidate.vote_count),
          percentage: `${candidate.vote_percentage}%`,
          status: candidate.status
        }));
        
        yPos = createSummaryTable(doc, candidateData, [
          { header: "Rank", key: "rank" },
          { header: "Candidate", key: "name" },
          { header: "Party", key: "party" },
          { header: "Votes", key: "votes" },
          { header: "Percentage", key: "percentage" },
          { header: "Status", key: "status" }
        ], yPos);
      } else {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text("No candidates found for this position.", 14, yPos);
        yPos += 10;
      }
      
      yPos += 15; 
    });
  }

  
  return doc;
};

const generateFailedLoginReport = (data) => {
  const doc = new jsPDF();
  doc._reportTitle = 'Failed Login Report';
  
  let yPos = addHeader(doc, "Failed Login Report", "Analysis of failed login attempts and account lockouts across the system.");
  
  const summaryData = [
    { metric: "Total Failed Attempts", value: formatNumber(data.summary.total_attempts) },
    { metric: "Locked Accounts", value: formatNumber(data.summary.locked_accounts) }
  ];
  
  const recentAttemptsData = data.recent_attempts.map(attempt => ({
    timestamp: attempt.timestamp,
    email: attempt.email,
    reason: attempt.reason,
    status: attempt.status
  }));
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text("Summary Statistics", 14, yPos);
  
  yPos = createSummaryTable(doc, summaryData, [
    { header: "Metric", key: "metric" },
    { header: "Value", key: "value" }
  ], yPos + 10);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text("Recent Failed Login Attempts", 14, yPos);
  
  createSummaryTable(doc, recentAttemptsData, [
    { header: "Timestamp", key: "timestamp" },
    { header: "Email", key: "email" },
    { header: "Reason", key: "reason" },
    { header: "Status", key: "status" }
  ], yPos + 10);
  
  
  return doc;
};

const generateAuditLogReport = (data) => {
  const doc = new jsPDF();
  doc._reportTitle = 'Activity Audit Log Report';
  
  let yPos = addHeader(doc, "Activity Audit Log Report", "Track all system activities and user actions across the platform.");
  
  const summaryData = [
    { metric: "Total Activities", value: formatNumber(data.summary.total_activities) },
    { metric: "Activities Today", value: formatNumber(data.summary.activities_today) },
    { metric: "Last 24 Hours", value: formatNumber(data.summary.last_24_hours) },
    { metric: "Weekly Activities", value: formatNumber(data.summary.weekly_activities) }
  ];
  
  const logsData = data.logs.map(log => ({
    user: log.user_email,
    role: log.user_role,
    action: log.action,
    entity: log.entity_type,
    timestamp: formatDate(log.created_at)
  }));
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text("Summary Statistics", 14, yPos);
  
  yPos = createSummaryTable(doc, summaryData, [
    { header: "Metric", key: "metric" },
    { header: "Value", key: "value" }
  ], yPos + 10);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text("Recent Activities", 14, yPos);
  
  createSummaryTable(doc, logsData, [
    { header: "User", key: "user" },
    { header: "Role", key: "role" },
    { header: "Action", key: "action" },
    { header: "Entity", key: "entity" },
    { header: "Timestamp", key: "timestamp" }
  ], yPos + 10);
  
  
  return doc;
};

const generateUpcomingElectionReport = (data) => {
  const doc = new jsPDF();
  doc._reportTitle = 'Upcoming Elections Report';
  
  let yPos = addHeader(doc, "Upcoming Elections Report", "Detailed overview of all upcoming elections including ballot information and voter eligibility.");
  
  const summaryData = [
    { metric: "Total Upcoming", value: formatNumber(data.summary.total_upcoming) },
    { metric: "Upcoming This Month", value: formatNumber(data.summary.upcoming_this_month) },
    { metric: "Total Expected Voters", value: formatNumber(data.summary.total_expected_voters) }
  ];
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text("Summary Statistics", 14, yPos);
  
  yPos = createSummaryTable(doc, summaryData, [
    { header: "Metric", key: "metric" },
    { header: "Value", key: "value" }
  ], yPos + 10);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text("Upcoming Elections", 14, yPos);
  
  const electionsData = data.elections.map(election => ({
    title: election.title,
    type: election.type,
    start: election.start_datetime,
    end: election.end_datetime,
    voters: formatNumber(election.expected_voters)
  }));
  
  createSummaryTable(doc, electionsData, [
    { header: "Title", key: "title" },
    { header: "Type", key: "type" },
    { header: "Start Date", key: "start" },
    { header: "End Date", key: "end" },
    { header: "Expected Voters", key: "voters" }
  ], yPos + 10);
  
  
  return doc;
};

const generateLiveVoteCountReport = (data) => {
  const doc = new jsPDF();
  doc._reportTitle = 'Live Vote Count Report';
  
  let yPos = addHeader(doc, "Live Vote Count Report", "Real-time monitoring of ongoing elections with live vote counts and turnout statistics.");
  
  const summaryData = [
    { metric: "Total Live Elections", value: formatNumber(data.summary.total_live_elections) },
    { metric: "Total Current Voters", value: formatNumber(data.summary.total_current_voters) },
    { metric: "Average Turnout", value: `${data.summary.average_turnout}%` },
    { metric: "Last Updated", value: data.last_updated }
  ];
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text("Summary Statistics", 14, yPos);
  
  yPos = createSummaryTable(doc, summaryData, [
    { header: "Metric", key: "metric" },
    { header: "Value", key: "value" }
  ], yPos + 10);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text("Live Elections", 14, yPos);
  
  const liveElectionsData = data.live_elections.map(election => ({
    title: election.title,
    type: election.election_type,
    eligible: formatNumber(election.eligible_voters),
    current: formatNumber(election.current_votes),
    turnout: election.live_turnout,
    remaining: election.time_remaining
  }));
  
  createSummaryTable(doc, liveElectionsData, [
    { header: "Title", key: "title" },
    { header: "Type", key: "type" },
    { header: "Eligible Voters", key: "eligible" },
    { header: "Current Votes", key: "current" },
    { header: "Turnout", key: "turnout" },
    { header: "Time Remaining", key: "remaining" }
  ], yPos + 10);
    
  return doc;
};

const generateSystemLoadReport = (data) => {
  const doc = new jsPDF();
  doc._reportTitle = 'System Load Report';
  
  let yPos = addHeader(doc, "System Load Report", "Analysis of peak usage times and system activity patterns.");
  
  const summaryData = [
    { metric: "Peak Login Hour", value: data.summary.peak_login_hour },
    { metric: "Peak Login Count", value: data.summary.peak_login_count },
    { metric: "Peak Voting Hour", value: data.summary.peak_voting_hour },
    { metric: "Peak Voting Count", value: data.summary.peak_voting_count },
    { metric: "Total Active Users", value: data.summary.total_active_users },
    { metric: "Timeframe", value: data.timeframe }
  ];
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text("Summary Statistics", 14, yPos);
  
  yPos = createSummaryTable(doc, summaryData, [
    { header: "Metric", key: "metric" },
    { header: "Value", key: "value" }
  ], yPos + 10);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text("Login Activity by Hour", 14, yPos);
  
  yPos = createSummaryTable(doc, data.login_activity, [
    { header: "Hour", key: "hour" },
    { header: "Count", key: "count" },
    { header: "Average", key: "average" }
  ], yPos + 10);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text("Voting Activity by Hour", 14, yPos);
  
  createSummaryTable(doc, data.voting_activity, [
    { header: "Hour", key: "hour" },
    { header: "Count", key: "count" },
    { header: "Average", key: "average" }
  ], yPos + 10);
  
  
  return doc;
};

const generateVoterParticipationReport = (data) => {
  const doc = new jsPDF();
  doc._reportTitle = 'Voter Participation Report';
  
  let yPos = addHeader(doc, "Voter Participation Report", "Detailed analysis of voter turnout and participation patterns.");
  
  const summaryData = [
    { metric: "Total Eligible Voters", value: formatNumber(data.summary.total_eligible_voters) },
    { metric: "Total Votes Cast", value: formatNumber(data.summary.total_votes_cast) },
    { metric: "Turnout Percentage", value: `${data.summary.turnout_percentage}%` },
    { metric: "Average Participation", value: `${data.summary.average_participation}%` }
  ];
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text("Summary Statistics", 14, yPos);
  
  yPos = createSummaryTable(doc, summaryData, [
    { header: "Metric", key: "metric" },
    { header: "Value", key: "value" }
  ], yPos + 10);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text("Department Statistics", 14, yPos);
  
  yPos = createSummaryTable(doc, data.department_stats, [
    { header: "Department", key: "department" },
    { header: "Turnout %", key: "turnout_percentage" },
    { header: "Total Students", key: "total_students" },
    { header: "Voted Count", key: "voted_count" }
  ], yPos + 10);
  
  if (data.voter_history && data.voter_history.length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text("Voter History (Sample)", 14, yPos);
    
    const voterSample = data.voter_history.slice(0, 20).map(voter => ({
      student_id: voter.student_id,
      name: voter.name,
      department: voter.department,
      participation_rate: `${voter.participation_rate}%`
    }));
    
    createSummaryTable(doc, voterSample, [
      { header: "Student ID", key: "student_id" },
      { header: "Name", key: "name" },
      { header: "Department", key: "department" },
      { header: "Participation Rate", key: "participation_rate" }
    ], yPos + 10);
  }
  
  
  return doc;
};

const generateCandidateListReport = (data) => {
  const doc = new jsPDF();
  doc._reportTitle = 'Candidate List Report';
  
  let yPos = addHeader(doc, "Candidate List Report", "Comprehensive list of all candidates per election with their course and party affiliations.");
  
  const electionData = [
    { metric: "Election Title", value: data.election_details.title },
    { metric: "Election Type", value: data.election_details.type },
    { metric: "Status", value: data.election_details.status },
    { metric: "Start Date", value: data.election_details.date_from },
    { metric: "End Date", value: data.election_details.date_to }
  ];
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text("Election Details", 14, yPos);
  
  yPos = createSummaryTable(doc, electionData, [
    { header: "Detail", key: "metric" },
    { header: "Value", key: "value" }
  ], yPos + 10);
  
  data.positions.forEach((position, index) => {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Position: ${position.name}`, 14, yPos);
    yPos += 10;
    
    const candidatesData = position.candidates.map(candidate => ({
      name: candidate.name,
      course: candidate.course,
      party: candidate.party,
      votes: formatNumber(candidate.vote_count || 0)
    }));
    
    yPos = createSummaryTable(doc, candidatesData, [
      { header: "Name", key: "name" },
      { header: "Course", key: "course" },
      { header: "Party", key: "party" },
      { header: "Votes", key: "votes" }
    ], yPos) + 20;
  });
  
  
  return doc;
};

const generateDepartmentVoterReport = (data) => {
  const doc = new jsPDF();
  doc._reportTitle = data.title || 'Department Voter Report';
  
  let yPos = addHeader(doc, data.title, data.description);

  if (data.election_details) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text("Election Summary", 14, yPos);
    yPos += 10;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Students: ${formatNumber(data.election_details.total_students)}`, 14, yPos);
    yPos += 6;
    doc.text(`Total Voted: ${formatNumber(data.election_details.total_voted)}`, 14, yPos);
    yPos += 6;
    doc.text(`Overall Participation: ${data.election_details.overall_participation}`, 14, yPos);
    yPos += 15;
  }

  if (data.summary) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text("Summary Statistics", 14, yPos);
    yPos += 10;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Departments: ${data.summary.total_departments}`, 14, yPos);
    yPos += 6;
    doc.text(`Total Students: ${formatNumber(data.summary.total_students)}`, 14, yPos);
    yPos += 6;
    doc.text(`Total Voted: ${formatNumber(data.summary.total_voted)}`, 14, yPos);
    yPos += 6;
    doc.text(`Overall Participation: ${data.summary.overall_participation}`, 14, yPos);
    yPos += 15;
  }

  if (data.positions && data.positions.length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text("Department Statistics", 14, yPos);
    yPos += 10;

    const departmentData = data.positions.map(dept => ({
      department: dept.position_name,
      totalStudents: formatNumber(dept.totalStudents || 0),
      voted: formatNumber(dept.votedCount || 0),
      notVoted: formatNumber(dept.notVoted || 0),
      turnout: (dept.participationRate || 0).toFixed(1) + '%'
    }));
    
    yPos = createSummaryTable(doc, departmentData, [
      { header: "Department", key: "department" },
      { header: "Total Students", key: "totalStudents" },
      { header: "Voted", key: "voted" },
      { header: "Not Voted", key: "notVoted" },
      { header: "Turnout Rate", key: "turnout" }
    ], yPos);
  }
  
  
  return doc;
};

const generateComprehensiveElectionReport = (data) => {
  const doc = new jsPDF();
  doc._reportTitle = data.title || 'Comprehensive Election Report';
  
  let yPos = addHeader(doc, data.title, data.description);

  if (data.election_details) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text("Election Details", 14, yPos);
    yPos += 10;
    
    const electionData = [
      { metric: "Election Title", value: data.election_details.title },
      { metric: "Election Type", value: data.election_details.type },
      { metric: "Status", value: data.election_details.status },
      { metric: "Start Date", value: data.election_details.start_date },
      { metric: "End Date", value: data.election_details.end_date },
      { metric: "Description", value: data.election_details.description || 'N/A' },
      { metric: "Total Eligible Voters", value: formatNumber(data.election_details.total_eligible_voters) },
      { metric: "Total Votes Cast", value: formatNumber(data.election_details.total_votes_cast) },
      { metric: "Voter Turnout", value: `${data.election_details.voter_turnout_percentage}%` },
      { metric: "Election Bulletin Code", value: data.bulletin_code || 'N/A' }
    ];
    
    yPos = createSummaryTable(doc, electionData, [
      { header: "Detail", key: "metric" },
      { header: "Value", key: "value" }
    ], yPos);
  }
  
  if (data.ballot_info && data.ballot_info.length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text("Ballot Information", 14, yPos);
    yPos += 10;
    
    data.ballot_info.forEach((position, index) => {
      if (yPos > 200) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Position: ${position.position_name} (Max Choices: ${position.max_choices})`, 14, yPos);
      yPos += 8;
      
      if (position.candidates && position.candidates.length > 0) {
        const candidateData = position.candidates.map(candidate => {
          const data = { name: candidate.name || 'Unknown Candidate' };
          
          data.course = candidate.course || 'Not specified';
          if (candidate.party) data.party = candidate.party;
          if (candidate.slogan) data.slogan = candidate.slogan;
          if (candidate.platform) data.platform = candidate.platform;
          
          return data;
        });
        const headers = [
          { header: "Candidate Name", key: "name" },
          { header: "Course", key: "course" }
        ];
        if (candidateData.some(c => c.party)) headers.push({ header: "Party", key: "party" });
        if (candidateData.some(c => c.slogan)) headers.push({ header: "Slogan", key: "slogan" });
        if (candidateData.some(c => c.platform)) headers.push({ header: "Platform", key: "platform" });
        
        yPos = createSummaryTable(doc, candidateData, headers, yPos);
      } else {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text("No candidates found for this position.", 14, yPos);
        yPos += 10;
      }
      
      yPos += 15; 
    });
  }

  if (data.results && data.results.length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text("Election Results", 14, yPos);
    yPos += 10;
    
    data.results.forEach((position, index) => {
      if (yPos > 200) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Position: ${position.position_name}`, 14, yPos);
      yPos += 8;

      if (position.candidates && position.candidates.length > 0) {
        const winner = position.candidates.find(c => c.is_winner) || position.candidates[0];
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 100, 0); 
        doc.text(`Winner: ${winner.name} (${formatNumber(winner.vote_count)} votes - ${winner.vote_percentage}%)`, 14, yPos);
        doc.setTextColor(0, 0, 0); 
        yPos += 8;
      }
      
      if (position.candidates && position.candidates.length > 0) {
        const candidateData = position.candidates.map(candidate => ({
          rank: candidate.rank,
          name: candidate.name,
          party: candidate.party,
          votes: formatNumber(candidate.vote_count),
          percentage: `${candidate.vote_percentage}%`,
          status: candidate.status
        }));
        
        yPos = createSummaryTable(doc, candidateData, [
          { header: "Rank", key: "rank" },
          { header: "Candidate", key: "name" },
          { header: "Party", key: "party" },
          { header: "Votes", key: "votes" },
          { header: "Percentage", key: "percentage" },
          { header: "Status", key: "status" }
        ], yPos);
      } else {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text("No results found for this position.", 14, yPos);
        yPos += 10;
      }
      
      yPos += 15;
    });
  }

  if (data.candidate_votes && data.candidate_votes.length > 0) {
    if (yPos > 150) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text("Detailed Candidate Vote Counts", 14, yPos);
    yPos += 10;
    
    data.candidate_votes.forEach((position, index) => {
      if (yPos > 200) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Position: ${position.position_name}`, 14, yPos);
      yPos += 8;
      
      if (position.candidates && position.candidates.length > 0) {
        const candidateData = position.candidates.map(candidate => ({
          name: candidate.name || 'Unknown Candidate',
          party: candidate.party || 'Independent',
          course: candidate.course || 'Not specified',
          votes: formatNumber(candidate.vote_count),
          percentage: `${candidate.vote_percentage}%`
        }));
        
        yPos = createSummaryTable(doc, candidateData, [
          { header: "Candidate", key: "name" },
          { header: "Course", key: "course" },
          { header: "Party", key: "party" },
          { header: "Votes", key: "votes" },
          { header: "Percentage", key: "percentage" }
        ], yPos);
      } else {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text("No candidate data found for this position.", 14, yPos);
        yPos += 10;
      }
      
      yPos += 15; 
    });
  }

  if (data.generated_at) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Report generated on: ${data.generated_at}`, 14, yPos);
  }
  
  return doc;
};

const generateVotingTimeReport = (data) => {
  const doc = new jsPDF();
  doc._reportTitle = 'Voting Time Report'; 
  
  let currentY = addHeader(doc, 'Voting Time Report', 'Detailed voter activity tracking including login times, session duration, and device information.');
  
  if (data.election_details) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Election Information', 14, currentY);
    currentY += 10;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Election: ${data.election_details.title}`, 14, currentY);
    currentY += 6;
    doc.text(`Total Records: ${data.election_details.total_records}`, 14, currentY);
    currentY += 6;
    doc.text(`Generated: ${data.election_details.report_generated}`, 14, currentY);
    currentY += 15;
  }

  if (data.summary) {
    const summaryData = [
      { metric: 'Total Voters', value: formatNumber(data.summary.total_voters) },
      { metric: 'Voted', value: formatNumber(data.summary.voted_count) },
      { metric: 'Not Voted', value: formatNumber(data.summary.not_voted_count) }
    ];
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary Statistics', 14, currentY);
    
    currentY = createSummaryTable(doc, summaryData, [
      { header: 'Metric', key: 'metric' },
      { header: 'Count', key: 'value' }
    ], currentY + 10);
    
    currentY += 20;
  }

  if (data.voting_data && data.voting_data.length > 0) {
    if (currentY > 200) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Voter Activity Details', 14, currentY);
    currentY += 10;

    const tableData = data.voting_data.map(voter => ({
      voter_id: voter.voter_id,
      login_time: voter.login_time,
      vote_submitted_time: voter.vote_submitted_time,
      session_duration: voter.session_duration,
      status: voter.status,
      device_browser_info: voter.device_browser_info
    }));

    createSummaryTable(doc, tableData, [
      { header: 'Voter ID', key: 'voter_id' },
      { header: 'Login Time', key: 'login_time' },
      { header: 'Vote Submitted Time', key: 'vote_submitted_time' },
      { header: 'Session Duration', key: 'session_duration' },
      { header: 'Status', key: 'status' },
      { header: 'IP Address Device / Browser', key: 'device_browser_info' }
    ], currentY);
  } else {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('No voting data available.', 14, currentY);
  }

  return doc;
};

export const generatePdfReport = async (reportId, data) => {
  try {
    let doc;
    
    switch (reportId) {
      case 1:
        doc = generateElectionReport(data);
        break;
      case 2:
        doc = generateUserReport(data);
        break;
      case 3:
        doc = generateFailedLoginReport(data);
        break;
      case 4:
        doc = generateAuditLogReport(data);
        break;
      case 5:
        doc = generateUpcomingElectionReport(data);
        break;
      case 6:
        doc = generateLiveVoteCountReport(data);
        break;
      case 7:
        doc = generateSystemLoadReport(data);
        break;
      case 8:
        doc = generateVoterParticipationReport(data);
        break;
      case 9:
        doc = generateCandidateListReport(data);
        break;
      case 10:
        doc = generateAdminActivityReport(data);
        break;
      case 11:
        doc = generateElectionDetailReport(data);
        break;
      case 12:
        doc = generateVotingTimeReport(data);
        break;
      case 13:
        doc = generateElectionResultReport(data);
        break;
      case 14:
        doc = generateDepartmentVoterReport(data);
        break;
      case 15:
        doc = generateComprehensiveElectionReport(data);
        break;
      default:
        throw new Error('Invalid report ID');
    }
    
    let currentUserName = null;
    try {
      currentUserName = await fetchCurrentUserName();
    } catch (error) {
      console.error('Unable to resolve current user name for PDF report:', error);
    }

    const signatureFooter = buildSignatureFooter(currentUserName);
    addSignatureBlockToLastPage(doc, signatureFooter);

    const reportTitle = getReportTitle(reportId);
    addFooterToAllPages(doc, reportTitle);

    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `${reportTitle.replace(/\s+/g, '_')}_${timestamp}.pdf`;
    
    doc.save(filename);
    
    return {
      success: true,
      message: 'PDF report generated successfully',
      filename
    };
  } catch (error) {
    console.error('Error generating PDF report:', error);
    return {
      success: false,
      message: `Failed to generate PDF report: ${error.message}`
    };
  }
};

const getReportTitle = (reportId) => {
  switch (reportId) {
    case 1:
      return 'Election Summary Report';
    case 2:
      return 'Role Based User Report';
    case 3:
      return 'Failed Login Report';
    case 4:
      return 'Activity Audit Log Report';
    case 5:
      return 'Upcoming Elections Report';
    case 6:
      return 'Live Vote Count Report';
    case 7:
      return 'System Load Report';
    case 8:
      return 'Voter Participation Report';
    case 9:
      return 'Candidate List Report';
    case 10:
      return 'Admin Activity Report';
    case 11:
      return 'Election Detail Report';
    case 12:
      return 'Voting Time Report';
    case 13:
      return 'Election Result Report';
    case 14:
      return 'Department Voter Report';
    case 15:
      return 'Comprehensive Election Report';
    default:
      return 'Report';
  }
};