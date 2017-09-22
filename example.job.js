/**
 * ExemploJob - Arquivo de exemplo para execução das tarefas
 * O gerenciamento das tarefas é feita a parte de Promises
 * @param {* Execute quando finalizar todo o processo da tarefa} JobQueueResolve 
 * @param {* Execute caso uma ocorra um erro que impeça a conclusão da tarefa } JobQueueReject 
 */

function ExemploJob(JobQueueResolve, JobQueueReject) {
    /** Execute todas as tarefas necessárias
     * Ao final execute um dos callbacks
     * JobQueueResolve() - Para uma tarefa realizada com sucesso. 
     * JobQueueReject() - Para uma tarefa realizada com erros.
     * Ambas funções podem receber um parametro que sejá gerado um log.
     */
    let func = this.function;
    let x = Math.floor(Math.random() * 3) + 1;
    console.log("Timeout: ", (x * 1000));
    // Exemplo 
    setTimeout(() => {
        if (x % 2 == 0) {
            JobQueueResolve((func.name + " - Tarefa Executada"));
        } else {
            JobQueueReject((func.name + " - Tarefa Falhou"));
        }

    }, (x * 1000));
}

module.exports = exports = ExemploJob;