import Task from './Task';
import Executor, { CompletedTasksColleciton, PerformanceReport, TaskCollection } from './Executor';

type Queue = Task[];

export default async function run(queue: Queue, maxThreads = 0)
    : Promise<{
        completed: CompletedTasksColleciton
        performance: PerformanceReport
    }>
{
    const executor = new Executor();
    executor.start();

    /**
     * Код надо писать сюда
     * Тут что-то вызываем в правильном порядке executor.executeTask для тасков из очереди queue
     */

    let runningPromises: Promise<void>[] = [];
    const currentQueue = [...queue];

    while (currentQueue.length > 0) {
        let qIdx = 0;
        while (qIdx < currentQueue.length) {
            const task = currentQueue[qIdx];

            // Если превышено количество тредов
            if (maxThreads > 0 && runningPromises.length >= maxThreads) {
                break;
            }

            // Если задача уже запущена для этого id
            if (executor.executeData.running[task.targetId]) {
                // Переходим к следующей задаче
                qIdx++;
            }
            else {
                // Запустить задачу
                currentQueue.splice(qIdx, 1);
                const promise = executor.executeTask(task).then(() => {
                    // Задача выполнена, удалить из списка
                    runningPromises = runningPromises.filter(p => p !== promise);
                });
                runningPromises.push(promise);
            }
        }

        // Ждём, пока завершится хотя бы одна задача
        await Promise.race(runningPromises);
    }

    // Дождаться завершения оставшихся задач
    await Promise.all(runningPromises);

    /**
     * Конец реализации
     */

    executor.stop();
    return {
        completed: executor.executeData.completed,
        performance: executor.performanceReport,
    };
}