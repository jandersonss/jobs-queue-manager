const moment = require('moment');
const _ = require('lodash');

class JobsQueueManager {
    constructor(maxTimeExecutionLimit = (1000 * 60 * 60 * 5), intervalCheckTasksToExecute = 1000) {
        // Intervalo para buscar novas tarefas caso não seja encontrado anteriormente
        this.intervalCheckTasksToExecute = intervalCheckTasksToExecute;
        // Tempo maximo de execução da tarefa
        this.maxTimeExecutionLimit = maxTimeExecutionLimit;
        // Armazena informações de controle das execuções das tarefas
        this.controlQueue = {
            error: 0,
            success: 0,
            functions: {}
        };
        this.running = false;
        //Quantidade de reexecuções das tarefas
        this.countCycles = 0;
        //Lista das tarefas a serem executadas
        this.tasksList = [];
        //Lista das tarefas em execução
        this.fila = [];
    }

    getFunction(func) {
        if (typeof func === 'string') {
            func = require(func);
        }
        return func;
    }

    /**
     * Adiciona Uma Tarefa
     * @param {* Função recebendo com parametros resolve, reject } taskFunction 
     * @param {* Intervalo para execução} interval 
     * @param {* Tipo do intervalo [m-Minuto, h-Hora, d-Dia, mm-Mes, y-Anos] } intervalType 
     * @param {* Execução imediata ao iniciar o server } imediate
     */
    addTask(taskFunction, interval = 1, intervalType = 'd', imediate = false) {
        this.tasksList.push({
            function: this.getFunction(taskFunction),
            intervalType: intervalType,
            interval: interval,
            lastExecution: Date.now(),
            imediate: imediate
        });
    }

    /**
     * Verifica de a tarefa está no intervalo definido para ser reexecutada
     * @param {* Tarefa} task 
     */
    checkInteval(task) {
        const getTypeInterval = (type) => {
            const types = {
                s: 'seconds',
                m: 'minutes',
                h: 'hours',
                d: 'days',
                w: 'week',
                mm: 'months',
                y: 'years'
            };
            if (!types.hasOwnProperty(type)) return 'days';
            return types[type];
        };
        if (!task.lastExecution || task.imediate) {
            delete task.imediate;
            return true
        };
        return moment(Date.now()).diff(task.lastExecution, getTypeInterval(task.intervalType), true) >= task.interval;
    }
    getMaxExecution(){
        return this.maxTimeExecutionLimit > 0 ? Number(this.maxTimeExecutionLimit/1/60/60/1000).toFixed(2) : 0;
    }

    checkMaxTimeExecutionLimit(resolve, reject){
        this.getMaxExecution();
        setTimeout(()=>{
            resolve({
                mensagem: `Limite máximo de execução de  excedido. `
            });
        }, this.maxTimeExecutionLimit);
    }   
    /**
     *  Inicia a verifição e execução das tarefas
     */
    runTasks() {
        let tasksNames = [];
        this.tasksList.filter((task) => {
            if (this.checkInteval(task)) {
                task.lastExecution = Date.now();
                tasksNames.push(task.function.name);
                // Adiciona promessa a fila de execução
                this.fila.push(new Promise((resolve, reject) => {
                    task.function(resolve, reject);
                    this.checkMaxTimeExecutionLimit(resolve, reject);
                }).then((data) => {
                    this.handerSuccess({
                        functionName: task.function.name,
                        data: data
                    });
                }).catch((error) => {
                    this.handerError({
                        functionName: task.function.name,
                        error: error
                    });
                }));
            }
            return false;
        });

        if (this.fila.length === 0) {
            setTimeout(this.runTasks.bind(this), this.intervalCheckTasksToExecute);
        } else {
            this.log('info', '- Tarefas em execução: %s \n- %s \n', this.fila.length, tasksNames.join('\n- '));
        }
    }

    isAllResolveRejects() {
        // this.log('info', '==========================================');
        // this.log('info', '== Tarefas executadas com successo: ', this.controlQueue.success);
        // this.log('info', '== Tarefas executadas com erro: ', this.controlQueue.error);
        // this.log('info', '==========================================');
        return this.controlQueue.error + this.controlQueue.success === this.fila.length;
    }

    relatorio() {
        this.log('info', '---------------------------------------------------------');
        this.log('info', '------------------ Tarefas Finalizadas ------------------');
        this.log('info', '---------------------------------------------------------');
        _.each(this.controlQueue.functions, (obj, taskName) => {
            let txtStatus = obj.status ? 'Ok.' : 'Falhou.';
            this.log('info', `- ${taskName}: ${txtStatus}`);
            this.log('info', `-> `, obj.data.mensagem || obj.data);

        });
        this.log('info', '---------------------------------------------------------');
    }

    restart(force) {
        // Verifica se todas as promessas foram executadas, para reiniciar as execuções
        if (!force && !this.isAllResolveRejects()) return;
        this.relatorio();
        this.fila = [];
        this.controlQueue = {
            error: 0,
            success: 0,
            functions: {}
        };
        this.countCycles++;
        this.log('info', '\n\n\n\nCiclo Atual: ', this.countCycles);
        this.start();
    }

    handerSuccess(obj) {
        if (obj) {
            obj.data = obj.data || {};
            this.controlQueue.functions[obj.functionName] = {
                status: true,
                data: obj.data
            };
        }
        this.controlQueue.success++;
        this.restart();
    }

    handerError(obj) {
        if (obj) {
            obj.error = obj.error || {};
            this.controlQueue.functions[obj.functionName] = {
                status: false,
                data: obj.error
            };
        }
        this.controlQueue.error++;
        this.restart();
    }

    manager() {
        if (!this.running) {
            this.running = true;
            process.on('unhandledRejection', (reason, p) => {
                this.log('error', 'Possibly Unhandled Rejection at: Promise ', p, ' reason: ', reason);
            });
        }
    }

    start() {
        if (this.countCycles === 0) {
            this.log('info', 'Iniciando JobsQueueManager');
        }
        this.log('info', '** Configuração\n- Limite máximo de tempo de execução : %s h (%s ms)', this.getMaxExecution(), this.maxTimeExecutionLimit);
        this.manager();
        this.runTasks();
    }

    log(type, ...objs) {
        if (!console.hasOwnProperty(type)) {
            console.error("Tipo de Log informado não existe. [log,info,error,dir]");
        }
        console[type](...objs);
    }
}

module.exports = exports = JobsQueueManager;