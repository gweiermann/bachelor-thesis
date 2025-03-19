'use server'

import { execFile } from 'node:child_process'
import path from 'node:path'
import { getTask } from './tasks'
import stream from 'stream'

export async function analyzeCode(challengeName, codeWithoutPrototype) {
    const task = await getTask(challengeName)
    if (!task) {
        throw new Error("Task not found!")
    }

    const code = `
        #include <iostream>
        
        ${task.code.functionPrototype}
        {
            ${codeWithoutPrototype}
        }
        
        int main() {
            ${task.code.main}
            return 0;
        }
    `

    console.log(code)

    return new Promise((resolve, reject) => {
        const child = execFile(
            'docker',
            ['compose', 'run', '--rm', 'app', task.name],
            { cwd: path.join(process.cwd(), '../docker')},
            (err, stdout, stderr) => {
                if (err) {
                    reject(err)
                }
            
                resolve(stdout)
        });

        var codeStream = new stream.Readable();
        codeStream.push(code);
        codeStream.push(null);
        codeStream.pipe(child.stdin);
    })
}