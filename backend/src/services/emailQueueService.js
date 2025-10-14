const emailService = require('./emailService');

class EmailQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.batchSize = 25; // Process 25 emails at a time (increased from 5)
    this.delayBetweenBatches = 2000; // 2 seconds between batches (reduced from 5)
    this.delayBetweenEmails = 300; // 0.3 seconds between individual emails (reduced from 2)
    this.maxRetries = 3; // Maximum retries for failed emails
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
        let retryCount = 0;
        let emailSent = false;
        
        while (retryCount < this.maxRetries && !emailSent) {
          try {
            await emailService.sendElectionNotification(
              emailData.userId, 
              emailData.email, 
              emailData.electionData
            );
            console.log(`✅ Email sent to ${emailData.email}`);
            successCount++;
            emailSent = true;
            
          } catch (error) {
            retryCount++;
            console.error(`❌ Failed to send email to ${emailData.email} (attempt ${retryCount}/${this.maxRetries}):`, error.message);
            
            // If rate limited, wait longer before retry
            if (error.message.includes('too many connections') || error.message.includes('421')) {
              console.log('⏳ Rate limit detected, waiting 10 seconds before retry...');
              await new Promise(resolve => setTimeout(resolve, 10000));
            } else if (retryCount < this.maxRetries) {
              // Wait a bit before retrying other errors
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          }
        }
        
        if (!emailSent) {
          errorCount++;
          console.error(`❌ Failed to send email to ${emailData.email} after ${this.maxRetries} attempts`);
        }
        
        // Delay between individual emails (only if not the last email in batch)
        if (this.queue.length > 0 || batch.indexOf(emailData) < batch.length - 1) {
          await new Promise(resolve => setTimeout(resolve, this.delayBetweenEmails));
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

  // Method to configure batch size dynamically
  setBatchSize(size) {
    if (size > 0 && size <= 50) { // Max 50 emails per batch to avoid overwhelming
      this.batchSize = size;
      console.log(`📧 Batch size updated to ${this.batchSize} emails per batch`);
    } else {
      console.log('⚠️  Batch size must be between 1 and 50');
    }
  }

  // Method to get current configuration
  getConfig() {
    return {
      batchSize: this.batchSize,
      delayBetweenBatches: this.delayBetweenBatches,
      delayBetweenEmails: this.delayBetweenEmails,
      maxRetries: this.maxRetries
    };
  }
}

// Create a singleton instance
const emailQueue = new EmailQueue();

module.exports = {
  emailQueue,
  addElectionNotificationToQueue: (userId, email, electionData) => {
    emailQueue.addToQueue({ userId, email, electionData });
  },
  setEmailBatchSize: (size) => {
    emailQueue.setBatchSize(size);
  },
  getEmailQueueConfig: () => {
    return emailQueue.getConfig();
  }
};
