const emailService = require('./emailService');

class EmailQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.batchSize = 5; // Process 5 emails at a time
    this.delayBetweenBatches = 5000; // 5 seconds between batches
    this.delayBetweenEmails = 2000; // 2 seconds between individual emails
  }

  addToQueue(emailData) {
    this.queue.push(emailData);
    console.log(`📧 Added email to queue. Queue size: ${this.queue.length}`);
    
    if (!this.processing) {
      this.processQueue();
    }
  }

  async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;
    console.log(`📧 Starting email queue processing. ${this.queue.length} emails in queue.`);

    let successCount = 0;
    let errorCount = 0;

    while (this.queue.length > 0) {
      // Process emails in batches
      const batch = this.queue.splice(0, this.batchSize);
      console.log(`📧 Processing batch of ${batch.length} emails...`);

      for (const emailData of batch) {
        try {
          await emailService.sendElectionNotification(
            emailData.userId, 
            emailData.email, 
            emailData.electionData
          );
          console.log(`✅ Email sent to ${emailData.email}`);
          successCount++;
          
          // Delay between individual emails
          if (this.queue.length > 0 || batch.indexOf(emailData) < batch.length - 1) {
            await new Promise(resolve => setTimeout(resolve, this.delayBetweenEmails));
          }
          
        } catch (error) {
          console.error(`❌ Failed to send email to ${emailData.email}:`, error.message);
          errorCount++;
          
          // If rate limited, wait longer
          if (error.message.includes('too many connections') || error.message.includes('421')) {
            console.log('⏳ Rate limit detected, waiting 15 seconds...');
            await new Promise(resolve => setTimeout(resolve, 15000));
          }
        }
      }

      // Delay between batches
      if (this.queue.length > 0) {
        console.log(`⏳ Waiting ${this.delayBetweenBatches/1000} seconds before next batch...`);
        await new Promise(resolve => setTimeout(resolve, this.delayBetweenBatches));
      }
    }

    console.log(`📧 Email queue processing completed: ${successCount} sent, ${errorCount} failed`);
    this.processing = false;
  }

  getQueueSize() {
    return this.queue.length;
  }

  isProcessing() {
    return this.processing;
  }
}

// Create a singleton instance
const emailQueue = new EmailQueue();

module.exports = {
  emailQueue,
  addElectionNotificationToQueue: (userId, email, electionData) => {
    emailQueue.addToQueue({ userId, email, electionData });
  }
};
