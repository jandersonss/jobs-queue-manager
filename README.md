# jobs-queue-manager

# Usar


    const JobsQueueManager = require('jobs-queue-manager');
    
    const jobsQueueManager = new JobsQueueManager();
    // Arquivo
    jobsQueueManager.addTask(`${__dirname}/example.job`, 2, 's', true);
    // Função 
    jobsQueueManager.addTask(function Example(JobQueueResolve, JobQueueReject){
    
    JobQueueResolve('ok');

	}, 3, 's', true);
	//Inicia as execuções
	jobsQueueManager.start();
