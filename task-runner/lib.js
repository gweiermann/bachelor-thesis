import amqlib from 'amqplib';
import { v4 as uuid } from 'uuid';

export class TaskRunner {
    constructor() {
        this.connection = null;
        this.channel = null;
    }

    async connect() {
        this.connection = await amqlib.connect('amqp://localhost');
        this.channel = await this.connection.createChannel();
        await this.channel.assertQueue('tasks')
        await this.channel.assertQueue('results')
    }

    async takeTask() {
        await this.channel.consume('tasks', async (msg) => {
            const { task, uid } = JSON.parse(msg.content.toString());
            return {
                task,
                finish: async (result) => {
                    this.channel.sendToQueue('results', Buffer.from(JSON.stringify({ result, uid })))
                    this.channel.ack(msg)
                }
            }
        })
    }

    async runTask(task) {
        const id = uuid()
        await this.channel.sendToQueue('tasks', Buffer.from(JSON.stringify({ task, id })))
    }
}