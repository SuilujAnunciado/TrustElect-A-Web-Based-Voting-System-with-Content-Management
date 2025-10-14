const emailService = require('./src/services/emailService');

async function testHostingerEmail() {
  console.log('🧪 Testing Hostinger Email Setup...\n');

  try {
    // Test Hostinger connection
    console.log('1. Testing Hostinger connection...');
    const connectionTest = await emailService.testHostingerConnection();
    
    if (connectionTest.success) {
      console.log('✅ Hostinger connection successful!');
    } else {
      console.log('❌ Hostinger connection failed:', connectionTest.error);
      return;
    }

    // Test election notification
    console.log('\n2. Testing election notification...');
    const electionData = {
      title: 'Test Election 2024',
      startDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next week
    };

    const notificationResult = await emailService.sendElectionNotification(
      1, // Test user ID
      'test@example.com', // Test email
      electionData
    );

    if (notificationResult.success) {
      console.log('✅ Election notification sent successfully!');
      console.log('📧 Message ID:', notificationResult.messageId);
    } else {
      console.log('❌ Election notification failed');
    }

    // Test vote receipt
    console.log('\n3. Testing vote receipt...');
    const receiptData = {
      electionTitle: 'Test Election 2024',
      voteDate: new Date(),
      voteToken: 'test-vote-token-12345',
      student: {
        firstName: 'John',
        lastName: 'Doe',
        studentId: '2024-00001'
      },
      selections: [
        {
          position: 'President',
          candidates: [
            { name: 'Test Candidate 1', party: 'Test Party' }
          ]
        }
      ]
    };

    const receiptResult = await emailService.sendVoteReceiptEmail(
      1, // Test user ID
      'test@example.com', // Test email
      receiptData
    );

    if (receiptResult.success) {
      console.log('✅ Vote receipt sent successfully!');
      console.log('📧 Message ID:', receiptResult.messageId);
      console.log('🔐 Verification Code:', receiptResult.verificationCode);
    } else {
      console.log('❌ Vote receipt failed');
    }

    console.log('\n🎉 Hostinger email system test completed!');
    console.log('\n📋 Summary:');
    console.log('- Gmail transporter: For OTP emails (unchanged)');
    console.log('- Hostinger transporter: For notifications and vote receipts');
    console.log('- Election notifications: Professional design with voting link');
    console.log('- Vote receipts: Highlighted verification code');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testHostingerEmail();
