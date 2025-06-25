import express from 'express'
import { getTemplate } from './get-template.js'
import { getConfig } from './get-config.js'

const app = express()

app.get('/template/:taskId', async (req, res) => {
    const template = await getTemplate(req.params.taskId)
    if (!template) {
        res.status(404).json({ ok: false, error: `Template '${req.params.taskId}' not found` })
        return
    }
    res.json({ ok: true, data: template })
})

app.get('/config/:taskId', async (req, res) => {
    const config = await getConfig(req.params.taskId)
    if (!config) {
        res.status(404).json({ ok: false, error: `Config '${req.params.taskId}' not found` })
        return
    }
    res.json({ ok: true, data: config })
})

app.listen(80, () => {
    console.log('Server is running on port 80')
})