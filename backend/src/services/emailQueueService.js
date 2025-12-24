const emailService = require('./emailService');

class EmailQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.batchSize = 10; 
    this.delayBetweenBatches = 3000; 
    this.delayBetweenEmails = 500;
    this.maxRetries = 3; 
  }

  
  addToQueue(emailData) {
    this.queue.push(emailData);
    
    if (!this.processing) {
      this.processQueue();
    }
  }

  async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    let successCount = 0;
    let errorCount = 0;

    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, this.batchSize);

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
            successCount++;
            emailSent = true;
            
          } catch (error) {
            retryCount++;
            console.error(`Failed to send email to ${emailData.email} (attempt ${retryCount}/${this.maxRetries}):`, error.message);
            
            if (error.message.includes('split is not a function') || error.message.includes('Date formatting error')) {
              console.error(`Date formatting error for ${emailData.email}, skipping retry. Election data:`, emailData.electionData);
              errorCount++;
              break; 
            }
            
            if (error.message.includes('too many connections') || error.message.includes('421')) {
              await new Promise(resolve => setTimeout(resolve, 10000));
            } else if (retryCount < this.maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          }
        }
        
        if (!emailSent) {
          errorCount++;
          console.error(` Failed to send email to ${emailData.email} after ${this.maxRetries} attempts`);
        }
        
        if (this.queue.length > 0 || batch.indexOf(emailData) < batch.length - 1) {
          await new Promise(resolve => setTimeout(resolve, this.delayBetweenEmails));
        }
      }

      if (this.queue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, this.delayBetweenBatches));
      }
    }

    this.processing = false;
  }

  getQueueSize() {
    return this.queue.length;
  }

  isProcessing() {
    return this.processing;
  }

  setBatchSize(size) {
    if (size > 0 && size <= 50) { 
      this.batchSize = size;
    } else {    }
  }

  getConfig() {
    return {
      batchSize: this.batchSize,
      delayBetweenBatches: this.delayBetweenBatches,
      delayBetweenEmails: this.delayBetweenEmails,
      maxRetries: this.maxRetries
    };
  }
}

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
