const JobsQueueManager = require('./jobs-queue-manager');
const jobsQueueManager = new JobsQueueManager();
jobsQueueManager.addTask(`${__dirname}/example.job`, 2, 's', true);
jobsQueueManager.addTask(function (JobQueueResolve, JobQueueReject){
    
    JobQueueResolve('ok');

}, 3, 's', true);
jobsQueueManager.start();
