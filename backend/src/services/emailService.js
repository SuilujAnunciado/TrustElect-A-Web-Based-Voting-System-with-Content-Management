const nodemailer = require('nodemailer');
const pool = require('../config/db');
const { generateUniqueCode } = require('../utils/verificationCodeGenerator');

const gmailTransporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, 
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
});

const hostingerTransporter = nodemailer.createTransport({
  host: process.env.HOSTINGER_EMAIL_HOST,
  port: parseInt(process.env.HOSTINGER_EMAIL_PORT),
  secure: process.env.HOSTINGER_EMAIL_SECURE === 'true',
  auth: {
    user: process.env.HOSTINGER_EMAIL_USER,
    pass: process.env.HOSTINGER_EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  },

  pool: true,
  maxConnections: 1,
  maxMessages: 1, 
  rateLimit: 1, 
  rateDelta: 1000 
});

const logEmailStatus = async (userId, email, emailType, status, messageId = null, errorMessage = null, isSystemAccount = false, recipientEmail = null) => {
  try {
    await pool.query(
      `INSERT INTO email_logs 
        (user_id, email, email_type, status, message_id, error_message, is_forwarded, forwarded_to)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [userId, email, emailType, status, messageId, errorMessage, isSystemAccount, recipientEmail]
    );
  } catch (error) {
    console.error('Error logging email status:', error);
  }
};

const getFormattedPhTime = (date) => {
  return new Intl.DateTimeFormat('en-PH', {
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Manila'
  }).format(date);
};

const isSystemAccount = async (email) => {
  if (!email) return false;

  const isSuperAdmin = email.toLowerCase() === 'systemadmin.00000@novaliches.sti.edu.ph';
  
  if (isSuperAdmin) {
    return true;
  }
  
  const systemPatternResult = /^(systemadmin|admin)\.\d+@novaliches\.sti\.edu(\.ph)?$/i.test(email);
  const namePatternResult = /@novaliches\.sti\.edu(\.ph)?$/i.test(email) && email.includes('.');
  const employeeNumberPattern = /^[a-zA-Z]+\.\d{6}@novaliches\.sti\.edu(\.ph)?$/i.test(email);

  return false;
};

const checkIfAdminEmail = async (email) => {
  try {
    const query = `
      SELECT COUNT(*) as count 
      FROM admins 
      WHERE email = $1
    `;
    const result = await pool.query(query, [email]);

    return result.rows[0].count > 0;
  } catch (error) {
    console.error('Error checking if email is admin:', error);
  
    return false;
  }
};

const getAdminForwardingEmail = async (originalEmail) => {
  try {

    if (originalEmail.toLowerCase() === 'systemadmin.00000@novaliches.sti.edu.ph') {
      return process.env.ADMIN_EMAIL || 'louielouie457@gmail.com';
    }
    
    return originalEmail;
  } catch (error) {
    console.error('Error fetching admin forwarding email:', error);
    return originalEmail;
  }
};

const getAdminGmail = () => {
  return process.env.ADMIN_EMAIL || 'louielouie457@gmail.com';
};

const sendOTPEmail = async (userId, email, otp, purpose = 'login') => {
  try {
    const isSuperAdmin = email.toLowerCase() === 'systemadmin.00000@novaliches.sti.edu.ph';
    const originalEmail = email;

    let recipientEmail = email;
    if (isSuperAdmin) {

      recipientEmail = await getAdminForwardingEmail(originalEmail);
    } 

    const expiryTime = new Date(Date.now() + 10 * 60 * 1000);
    const formattedTime = getFormattedPhTime(expiryTime);

    let subject, title;
    if (purpose === 'reset') {
      subject = isSuperAdmin ? `[${originalEmail}] Password Reset Code` : 'Your TrustElect Password Reset Code';
      title = 'Password Reset Code';
    } else {
      subject = isSuperAdmin ? `[${originalEmail}] TrustElect Verification Code` : 'Your TrustElect Verification Code';
      title = 'Verification Code';
    }

    const mailOptions = {
      from: `"STI TrustElect" <${process.env.GMAIL_USER}>`,
      to: recipientEmail, 
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #01579B; padding: 15px; text-align: center; color: white;">
            <h2>STI TrustElect</h2>
          </div>
          <div style="padding: 15px; border: 1px solid #e0e0e0;">
            <p>Hello${isSuperAdmin ? ' Administrator' : ''},</p>
            ${isSuperAdmin ? `<p>This code is for account: <strong>${originalEmail}</strong></p>` : ''}
            <p>Your ${purpose === 'reset' ? 'password reset' : 'verification'} code is:</p>
            <div style="background-color: #f5f5f5; padding: 10px; text-align: center; font-size: 24px; font-weight: bold; margin: 15px 0;">
              ${otp}
            </div>
            <p>This code will expire at ${formattedTime}.</p>
            <p style="font-size: 12px; color: #666;">
              If you did not request this code, please ignore this email.
            </p>
            <div style="margin-top: 20px; font-size: 12px; color: #666; text-align: center;">
              <p>STI Novaliches - TrustElect System</p>
            </div>
          </div>
        </div>
      `,
      text: `${title}: ${otp}. ${isSuperAdmin ? `For account: ${originalEmail}. ` : ''}Expires at ${formattedTime}`
    };

    if (process.env.NODE_ENV === 'development') {
      
      try {
        const info = await gmailTransporter.sendMail(mailOptions);
        
        await logEmailStatus(
          userId, 
          originalEmail, 
          'otp', 
          'sent_dev_mode', 
          info.messageId,
          null,
          isSuperAdmin,
          isSuperAdmin ? recipientEmail : null
        );
      } catch (error) {
        console.error('DEV MODE: Email sending failed:', error.message);
      }
      
      return { 
        success: true, 
        dev: true,
        otp,
        originalEmail,
        recipientEmail,
        isSystemAccount: isSuperAdmin
      };
    }

    const info = await gmailTransporter.sendMail(mailOptions);

    await logEmailStatus(
      userId, 
      originalEmail, 
      'otp', 
      'sent', 
      info.messageId,
      null,
      isSuperAdmin,
      isSuperAdmin ? recipientEmail : null
    );
    
    return { 
      success: true, 
      messageId: info.messageId,
      originalEmail,
      recipientEmail,
      isSystemAccount: isSuperAdmin
    };
  } catch (error) {

    try {
      const isSuperAdmin = email.toLowerCase() === 'systemadmin.00000@novaliches.sti.edu.ph';
      const recipientEmail = isSuperAdmin ? await getAdminForwardingEmail(email) : email;
      
      await logEmailStatus(
        userId, 
        email, 
        'otp', 
        'failed', 
        null, 
        error.message,
        isSuperAdmin,
        isSuperAdmin ? recipientEmail : null
      );
    } catch (logError) {
      console.error('Error logging email status:', logError);
    }
    
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

const testConnection = async () => {
  try {
  
    const result = await gmailTransporter.verify();
    return { success: true };
  } catch (error) {
    console.error('Gmail connection failed:', error);
    return { success: false, error: error.message };
  }
};



const sendVoteReceiptEmail = async (userId, email, receiptData) => {
  try {
    const isSuperAdmin = email.toLowerCase() === 'systemadmin.00000@novaliches.sti.edu.ph';
    const originalEmail = email;

    let recipientEmail = email;
    if (isSuperAdmin) {
      recipientEmail = await getAdminForwardingEmail(originalEmail);
    }

    const verificationCode = generateUniqueCode(receiptData.voteToken);
    const voteDate = new Date(receiptData.voteDate).toLocaleString('en-PH', {
      timeZone: 'Asia/Manila',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const subject = isSuperAdmin ? `[${originalEmail}] Vote Receipt - ${receiptData.electionTitle}` : `Your Vote Receipt - ${receiptData.electionTitle}`;

    const selectionsHtml = receiptData.selections.map(selection => {
      const candidatesHtml = selection.candidates.map(candidate => `
        <div style="background-color: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 15px; margin: 10px 0;">
          <div style="display: flex; align-items: center; margin-bottom: 10px;">
            <div style="width: 60px; height: 60px; border-radius: 50%; background-color: #e3f2fd; display: flex; align-items: center; justify-content: center; margin-right: 15px;">
              <span style="font-size: 24px; font-weight: bold; color: #1976d2;">${candidate.name.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <h4 style="margin: 0; color: #333; font-size: 18px;">${candidate.name}</h4>
              ${candidate.party ? `<p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">${candidate.party}</p>` : ''}
            </div>
          </div>
        </div>
      `).join('');

      return `
        <div style="margin-bottom: 30px;">
          <h3 style="color: #01579B; border-bottom: 2px solid #01579B; padding-bottom: 10px; margin-bottom: 15px;">
            ${selection.position}
          </h3>
          ${candidatesHtml}
        </div>
      `;
    }).join('');

    const mailOptions = {
      from: `"STI TrustElect" <${process.env.HOSTINGER_EMAIL_USER}>`,
      to: recipientEmail,
      subject: subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Vote Receipt Confirmation</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f5f5f5;">
          <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <!-- Header -->
            <div style="background-color: #01579B !important; padding: 25px; text-align: center; color: white !important; border-radius: 10px 10px 0 0; width: 100%; box-sizing: border-box;">
              <h1 style="margin: 0; font-size: 28px; font-weight: bold; color: white !important;">STI TrustElect</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9; color: white !important;">Vote Receipt Confirmation</p>
            </div>

          <!-- Main Content -->
          <div style="padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
            <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
              Hello${isSuperAdmin ? ' Administrator' : ''},
            </p>
            ${isSuperAdmin ? `<p style="font-size: 14px; color: #666; margin-bottom: 20px;">This receipt is for account: <strong>${originalEmail}</strong></p>` : ''}
            
            <p style="font-size: 16px; color: #333; margin-bottom: 25px;">
              Thank you for participating in the election! Your vote has been successfully recorded and encrypted. 
              Below is your official vote receipt with verification details.
            </p>

            <!-- Election Info Card -->
            <div style="background-color: #f8f9fa; border: 1px solid #e9ecef; border-radius: 10px; padding: 20px; margin-bottom: 25px;">
              <h2 style="color: #01579B; margin: 0 0 15px 0; font-size: 22px;">Election Information</h2>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div>
                  <p style="margin: 0; font-weight: bold; color: #333; font-size: 14px;">Election Title</p>
                  <p style="margin: 5px 0 0 0; color: #666; font-size: 16px;">${receiptData.electionTitle}</p>
                </div>
                <div>
                  <p style="margin: 0; font-weight: bold; color: #333; font-size: 14px;">Vote Date & Time</p>
                  <p style="margin: 5px 0 0 0; color: #666; font-size: 16px;">${voteDate}</p>
                </div>
              </div>
            </div>

            <!-- Verification Code Card - HIGHLIGHTED -->
            <div style="background: linear-gradient(135deg, #ffeb3b 0%, #ffc107 100%); border: 3px solid #ff9800; border-radius: 15px; padding: 30px; margin-bottom: 25px; text-align: center; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
              <h3 style="color: #e65100; margin: 0 0 20px 0; font-size: 24px; font-weight: bold;">🔐 VERIFICATION CODE</h3>
              <div style="background-color: #ffffff; border: 3px solid #ff9800; border-radius: 12px; padding: 25px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <p style="margin: 0; font-size: 16px; color: #e65100; font-weight: bold; text-transform: uppercase;">YOUR UNIQUE VERIFICATION CODE</p>
                <div style="font-size: 48px; font-weight: bold; color: #ff5722; letter-spacing: 6px; margin: 20px 0; font-family: 'Courier New', monospace; text-shadow: 2px 2px 4px rgba(0,0,0,0.1);">
                  ${verificationCode}
                </div>
                <p style="margin: 15px 0 0 0; font-size: 14px; color: #e65100; font-weight: bold;">Use this code to verify your vote was recorded correctly</p>
              </div>
              <div style="background-color: #fff3e0; border: 2px solid #ff9800; border-radius: 8px; padding: 15px; margin-top: 20px;">
                <p style="margin: 0; font-size: 12px; color: #e65100; font-weight: bold;">
                  <strong>Receipt ID:</strong> <span style="font-family: monospace; font-size: 11px; word-break: break-all;">${receiptData.voteToken}</span>
                </p>
              </div>
            </div>

            <!-- Student Info -->
            <div style="background-color: #f8f9fa; border: 1px solid #e9ecef; border-radius: 10px; padding: 20px; margin-bottom: 25px;">
              <h3 style="color: #01579B; margin: 0 0 15px 0; font-size: 18px;">Voter Information</h3>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div>
                  <p style="margin: 0; font-weight: bold; color: #333; font-size: 14px;">Student Name</p>
                  <p style="margin: 5px 0 0 0; color: #666; font-size: 16px;">${receiptData.student.firstName} ${receiptData.student.lastName}</p>
                </div>
                <div>
                  <p style="margin: 0; font-weight: bold; color: #333; font-size: 14px;">Student ID</p>
                  <p style="margin: 5px 0 0 0; color: #666; font-size: 16px;">${receiptData.student.studentId}</p>
                </div>
              </div>
            </div>

            <!-- Vote Selections -->
            <div style="margin-bottom: 25px;">
              <h3 style="color: #01579B; margin: 0 0 20px 0; font-size: 20px; text-align: center;">Your Vote Selections</h3>
              ${selectionsHtml}
            </div>

            <!-- Important Notes -->
            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 10px; padding: 20px; margin-bottom: 25px;">
              <h4 style="color: #856404; margin: 0 0 15px 0; font-size: 16px;">📋 Important Information</h4>
              <ul style="margin: 0; padding-left: 20px; color: #856404; font-size: 14px; line-height: 1.6;">
                <li style="margin-bottom: 8px;">Please save this receipt for your records as proof of your vote submission.</li>
                <li style="margin-bottom: 8px;">Use the verification code above to confirm your vote was recorded correctly.</li>
                <li style="margin-bottom: 8px;">Your vote is encrypted and stored securely in our system.</li>
                <li style="margin-bottom: 8px;">This receipt serves as official documentation of your participation in the election.</li>
              </ul>
            </div>

            <!-- Footer -->
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0; font-size: 14px; color: #666;">
                <strong>STI Novaliches - TrustElect System</strong>
              </p>
              <p style="margin: 5px 0 0 0; font-size: 12px; color: #999;">
                This is an automated message. Please do not reply to this email.
              </p>
            </div>
          </div>
        </div>
        </body>
        </html>
      `,
      text: `Vote Receipt - ${receiptData.electionTitle}\n\nVerification Code: ${verificationCode}\nReceipt ID: ${receiptData.voteToken}\nVote Date: ${voteDate}\n\nThank you for voting!`
    };

    const info = await hostingerTransporter.sendMail(mailOptions);
    
    return { 
      success: true, 
      messageId: info.messageId,
      verificationCode,
      originalEmail,
      recipientEmail,
      isSystemAccount: isSuperAdmin
    };
  } catch (error) {
    console.error(`ERROR SENDING VOTE RECEIPT to ${email}:`, error.message);
    throw new Error(`Failed to send vote receipt email: ${error.message}`);
  }
};

const sendElectionNotification = async (userId, email, electionData) => {
  try {
    const isSuperAdmin = email.toLowerCase() === 'systemadmin.00000@novaliches.sti.edu.ph';
    const originalEmail = email;

    let recipientEmail = email;
    if (isSuperAdmin) {
      recipientEmail = await getAdminForwardingEmail(originalEmail);
    }

    let userName = '';
    try {
      const userQuery = `
        SELECT u.first_name, u.last_name, u.role_id
        FROM users u
        WHERE u.id = $1
      `;
      const userResult = await pool.query(userQuery, [userId]);
      
      if (userResult.rows.length > 0) {
        const user = userResult.rows[0];
        userName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
        
        if (user.role_id === 3) {
          const studentQuery = `
            SELECT s.first_name, s.last_name
            FROM students s
            WHERE s.user_id = $1
          `;
          const studentResult = await pool.query(studentQuery, [userId]);
          if (studentResult.rows.length > 0) {
            const student = studentResult.rows[0];
            userName = `${student.first_name || ''} ${student.last_name || ''}`.trim();
          }
        }
      }
    } catch (nameError) {
      console.error('Error fetching user name for election notification:', nameError);
    }


    const formatElectionDate = (dateStr, timeStr) => {
      try {
        if (!dateStr || !timeStr) return 'Date not set';
        
        let dateString;
        
        if (dateStr instanceof Date) {
          dateString = dateStr.toISOString().split('T')[0];
        }
        else if (typeof dateStr === 'string') {
          dateString = dateStr.split('T')[0].split(' ')[0];
        }
        else {
          const str = String(dateStr);
          if (str.includes('-') || str.includes('/')) {
            dateString = str.split('T')[0].split(' ')[0];
          } else {
            console.error('Cannot parse date:', typeof dateStr, dateStr);
            return 'Invalid date';
          }
        }
        
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
          console.error('Invalid date format:', dateString);
          return 'Invalid date format';
        }
        
        const [year, month, day] = dateString.split('-').map(Number);
        
        const timeString = String(timeStr);
        const timeParts = timeString.includes(':') ? timeString.split(':') : [timeString, '00'];
        const hours = parseInt(timeParts[0], 10);
        const minutes = parseInt(timeParts[1], 10);
        
        const dateObj = new Date(year, month - 1, day + 1, hours, minutes);
        
        if (isNaN(dateObj.getTime())) {
          console.error('Invalid date object created:', { year, month, day, hours, minutes });
          return 'Invalid date';
        }
        
        return new Intl.DateTimeFormat('en-PH', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true 
        }).format(dateObj);
      } catch (error) {
        console.error('Date formatting error:', error);
        console.error('dateStr:', dateStr, 'type:', typeof dateStr);
        console.error('timeStr:', timeStr, 'type:', typeof timeStr);
        return 'Invalid date';
      }
    };

    const electionStartDate = formatElectionDate(electionData.startDate, electionData.startTime);
    const electionEndDate = formatElectionDate(electionData.endDate, electionData.endTime);

    const subject = isSuperAdmin ? `[${originalEmail}] Election Notification - ${electionData.title}` : `Election Notification - ${electionData.title}`;

    const mailOptions = {
      from: `"STI TrustElect" <${process.env.HOSTINGER_EMAIL_USER}>`,
      to: recipientEmail,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #01579B; padding: 15px; text-align: center; color: white;">
            <h2>STI TrustElect</h2>
          </div>
          <div style="padding: 15px; border: 1px solid #e0e0e0;">
            <p>Hello${isSuperAdmin ? ' Administrator' : userName ? ` ${userName}` : ''},</p>
            ${isSuperAdmin ? `<p>This notification is for account: <strong>${originalEmail}</strong></p>` : ''}
            
            <div style="background-color: #f8f9fa; border: 1px solid #e9ecef; border-radius: 10px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #01579B; margin: 0 0 15px 0; font-size: 20px;">🗳️ Election Notification</h3>
              <p style="font-size: 16px; color: #333; margin-bottom: 15px;">
                <strong>You are eligible to vote in the upcoming election!</strong>
              </p>
              <p style="font-size: 14px; color: #666; margin-bottom: 10px;">
                <strong>Election:</strong> ${electionData.title}
              </p>
              <p style="font-size: 14px; color: #666; margin-bottom: 10px;">
                <strong>Start Date:</strong> ${electionStartDate}
              </p>
              <p style="font-size: 14px; color: #666; margin-bottom: 15px;">
                <strong>End Date:</strong> ${electionEndDate}
              </p>
            </div>

            <div style="background-color: #e3f2fd; border: 2px solid #2196f3; border-radius: 10px; padding: 20px; margin: 20px 0; text-align: center;">
              <h3 style="color: #01579B; margin: 0 0 15px 0; font-size: 18px;">Ready to Vote?</h3>
              <p style="font-size: 14px; color: #666; margin-bottom: 20px;">
                Click the button below to access TrustElect Voting System and cast your vote.
              </p>
              <a href="https://trustelectonline.com" 
                 style="background-color: #01579B; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Go to TrustElect
              </a>
            </div>

            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 10px; padding: 15px; margin: 20px 0;">
              <h4 style="color: #856404; margin: 0 0 10px 0; font-size: 16px;">📋 Important Information</h4>
              <ul style="margin: 0; padding-left: 20px; color: #856404; font-size: 14px; line-height: 1.6;">
                <li style="margin-bottom: 5px;">Make sure to vote within the specified time period</li>
                <li style="margin-bottom: 5px;">Your vote is confidential and secure</li>
                <li style="margin-bottom: 5px;">You will receive a receipt after voting</li>
              </ul>
            </div>

            <div style="margin-top: 20px; font-size: 12px; color: #666; text-align: center;">
              <p>STI Novaliches - TrustElect System</p>
            </div>
          </div>
        </div>
      `,
      text: `Election Notification - ${electionData.title}\n\nYou are eligible to vote in the upcoming election!\n\nElection: ${electionData.title}\nStart Date: ${electionStartDate}\nEnd Date: ${electionEndDate}\n\nVisit: https://trustelectonline.com to cast your vote.\n\nSTI Novaliches - TrustElect System`
    };

    const info = await hostingerTransporter.sendMail(mailOptions);

    await logEmailStatus(
      userId, 
      originalEmail, 
      'election_notification', 
      'sent', 
      info.messageId,
      null,
      isSuperAdmin,
      isSuperAdmin ? recipientEmail : null
    );
    
    return { 
      success: true, 
      messageId: info.messageId,
      originalEmail,
      recipientEmail,
      isSystemAccount: isSuperAdmin
    };
  } catch (error) {
    throw new Error(`Failed to send election notification: ${error.message}`);
  }
};

module.exports = {
  sendOTPEmail,
  sendVoteReceiptEmail,
  sendElectionNotification,
  testConnection,
  isSystemAccount,
  checkIfAdminEmail,
  getAdminForwardingEmail
};