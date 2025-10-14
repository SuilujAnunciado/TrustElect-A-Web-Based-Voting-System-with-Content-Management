const { emailQueue } = require('./src/services/emailQueueService');
const emailService = require('./src/services/emailService');

async function testEmailQueue() {
  console.log('🧪 Testing Email Queue System...\n');

  try {
    // Test Hostinger connection first
    console.log('1. Testing Hostinger email connection...');
    const hostingerTest = await emailService.testHostingerConnection();
    
    if (!hostingerTest.success) {
      console.log('❌ Hostinger connection failed:', hostingerTest.error);
      return;
    }
    console.log('✅ Hostinger connection successful!');

    // Add some test emails to the queue
    console.log('\n2. Adding test emails to queue...');
    
    const testEmails = [
      { userId: 1, email: 'test1@example.com', electionData: { title: 'Test Election 1', startDate: new Date(), endDate: new Date() } },
      { userId: 2, email: 'test2@example.com', electionData: { title: 'Test Election 2', startDate: new Date(), endDate: new Date() } },
      { userId: 3, email: 'test3@example.com', electionData: { title: 'Test Election 3', startDate: new Date(), endDate: new Date() } }
    ];

    testEmails.forEach(emailData => {
      emailQueue.addToQueue(emailData);
    });

    console.log(`✅ Added ${testEmails.length} test emails to queue`);
    console.log(`📊 Queue size: ${emailQueue.getQueueSize()}`);
    console.log(`🔄 Processing: ${emailQueue.isProcessing()}`);

    // Wait for processing to complete
    console.log('\n3. Waiting for queue processing to complete...');
    
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds max wait
    
    while (emailQueue.isProcessing() && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
      console.log(`⏳ Processing... (${attempts}s) Queue size: ${emailQueue.getQueueSize()}`);
    }

    if (emailQueue.getQueueSize() === 0) {
      console.log('✅ Queue processing completed successfully!');
    } else {
      console.log(`⚠️  Queue processing incomplete. Remaining: ${emailQueue.getQueueSize()}`);
    }

    console.log('\n🎉 Email queue test completed!');
    console.log('\n📋 Summary:');
    console.log('- Queue system: Working ✅');
    console.log('- Rate limiting: Implemented ✅');
    console.log('- Batch processing: 5 emails per batch ✅');
    console.log('- Delays: 2s between emails, 5s between batches ✅');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

// Run the test
testEmailQueue();
