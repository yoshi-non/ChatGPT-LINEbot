const https = require("https")
const express = require("express")
const app = express()
const { Configuration, OpenAIApi } = require("openai")
require('dotenv').config()

const PORT = process.env.PORT || 3000
const TOKEN = process.env.LINE_ACCESS_TOKEN

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
})

const openai = new OpenAIApi(configuration)

app.use(express.json())
app.use(express.urlencoded({
    extended: true
}))

app.get("/", (req, res) => {
    res.sendStatus(200)
})

app.post("/webhook", async (req, res) => {
    res.send("HTTP POST request sent to the webhook URL!")
    // ユーザーがボットにメッセージを送った場合、返信メッセージを送る
    if (req.body.event.type === "message") {
        const prompt = req.body.event.messages.text
        const response = await openai.createCompletion({
            model: "text-davinci-003",
            prompt: prompt,
            temperature: 0,
            max_tokens: 3000,
            top_p: 1,
            frequency_penalty: 0.5,
            presence_penalty: 0,
        });
        console.log(prompt)
        console.log(response)
        // 文字列化したメッセージデータ
        const postText = response.data.choices[0].text
        const dataString = JSON.stringify({
            replyToken: req.body.events[0].replyToken,
            messages: [
                {
                    "type": "text",
                    "text": postText.trim()
                }
            ]
        })
        // リクエストヘッダー
        const headers = {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + TOKEN
        }

        // リクエストに渡すオプション
        const webhookOptions = {
            "hostname": "api.line.me",
            "path": "/v2/bot/message/reply",
            "method": "POST",
            "headers": headers,
            "body": dataString
        }

        // リクエストの定義
        const request = https.request(webhookOptions, (res) => {
            res.on("data", (d) => {
                process.stdout.write(d)
            })
        })

        // エラーをハンドル
        request.on("error", (err) => {
            console.error(err)
        })

        // データを送信
        request.write(dataString)
        request.end()
    }
})

app.listen(PORT, () => {
    console.log(`Connect to ${PORT}`)
})