const TelegramBot = require('node-telegram-bot-api');
const db = require('./db');
const config = require('./config');
const jsonToTable = require('json-to-table');
const bot = new TelegramBot(config.telegramBotToken, { polling: true });
const prettier = require('prettier');
const puppeteer = require('puppeteer');
const fs = require('fs');

async function generateImage(htmlContent, outputFilePath) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Set content of the page to the provided HTML
    await page.setContent(htmlContent);

    // You might need to adjust the viewport size based on your table size
    await page.setViewport({
        width: 800,
        height: 600,
        deviceScaleFactor: 1,
    });

    // Take a screenshot of the table
    await page.screenshot({ path: outputFilePath });

    await browser.close();
}


function generateRandomId(id, date) {
    const formattedDate = date.replace(/-/g, ''); // Remove dashes from the date string
    return `${id}_${formattedDate}`;
}

function convertTextToJson(text, username) {
    try {
        const currentDate = new Date().toISOString().slice(0, 10);
        const lines = text.split('\n').filter(line => line.trim() !== '');
        const id = lines.find(line => line.includes('NIK')).split(':')[1].trim();
        const durasiLine = lines.find(line => line.includes('Durasi'));
        const durasi = durasiLine.slice(durasiLine.indexOf(':') + 1).trim();
        const perihalIndex = lines.findIndex(line => line.includes('Perihal'));
        const perihalLines = [];
        for (let i = perihalIndex + 1; i < lines.length; i++) {
            if (lines[i].trim() === '') break; // Stop if an empty line is encountered
            perihalLines.push(lines[i].trim());
        }
        const perihal = perihalLines.join('\n'); // Join all perihal lines with newline character
        const result = {
            id: generateRandomId(id, currentDate),
            username: username,
            tanggal: currentDate,
            durasi: durasi,
            sub_judul : perihal.substring(0, 20),
            perihal: perihal
        };
        return result;
    } catch (error) {
        console.error("An error occurred:", error.message);
    }
}


// Function to convert date to a different timezone
function convertDateToTimezone(dateString, timezone='Asia/Makassar') {
    const date = new Date(dateString);
    const options = { timeZone: timezone };
    const dateFormatter = new Intl.DateTimeFormat('en-US', options);
    const [ { value: month }, , { value: day }, , { value: year } ] = dateFormatter.formatToParts(date);
    const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    return formattedDate;
}

function jsonToHtml(dataArray) {
    // return jsonToTable(dataArray);
    let html = `    <style>
    table {
        border-collapse: collapse;
        width: 100%;
    }

    th, td {
        border: 1px solid #dddddd;
        text-align: left;
        padding: 8px;
    }

    th {
        background-color: #f2f2f2;
    }
</style>
<table>
    <tr>
        <th>id</th>
        <th>Tanggal</th>
        <th>Rangkuman</th>
    </tr>
    `
    // console.log(dataArray.length);
    dataArray.forEach((data,i=0) => {
        
            html += `<tr>
            <td>${data.id}</td>
            <td>${convertDateToTimezone(data.tanggal)}</td>
            <td>${data.sub_judul}</td>
        </tr>`;
        
    });
    html += `</table>`;
    return html;
}

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const messageText = msg.text;
  const user = msg.from.username
//   const user = msg.chat.username
//   console.log(msg);

    if(messageText==='/get iplist'){
        // Select all messages from the database
        db.connection.query('SELECT * FROM IpList ', (error, results, fields) => {
            if (error) {
            console.error('Error selecting messages from database:', error);
            return;
            }
            let info = []
            results.forEach(ele => {
                info.push(`${ele.name} : ${ele.ipaddr}`)
            });
            bot.sendMessage(chatId, `data IP addres user RSPelita: \n ${info.join('\n')}`);
        });
    }
    else if(messageText==='/set iplist'){    
        bot.sendMessage(chatId, `http://192.168.1.227/ITUtl/`);
    }
    else if(messageText==='/get remote list'){    
        bot.sendMessage(chatId, `list anydesk remot\n\n210766838 inacb\n269900226 linux server\n1867185632 linux proxmox\n953790503 win proxmox\n1819903078 adminakre`);
    }
    else if(messageText==='/help'){    
        let info = "help:\n\n`/get iplist`\n\tliat semua ip list di pelita\n\n```/set iplist```\n\tcrud semua ip list di pelita\n\n ```/set lembur```\n\tbikin lemburan unit it\n\n```/lembur saya```\n\tliat lemburan unit it\n\n```/get remote list```\n\tliat list remote pc"
        bot.sendMessage(chatId, info,{ parseMode: 'Markdown' });
    }
    else if(messageText==='/set lembur'){
        db.connection.query(`SELECT * FROM user_it where username = "${user}";`, (error, results, fields) => {
            if (error) {
            console.error('Error selecting messages from database:', error);
            return;
            }
            let data = results[0]
            // bot.sendMessage(chatId, `data IP addres user RSPelita: \n ${info.join('\n')}`);
            bot.sendMessage(chatId, `berikut contoh form lembur\n\n*form_lembur \nNama : ${data.Nama}\nNIK : ${data.NIK}\nJabatan : Staff IT \nDurasi : \nPerihal :\n`);
        });
    }else if(messageText.includes('*form_lembur')){
        db.insertData(convertTextToJson(messageText, user))
        .then(result => {
            bot.sendMessage(chatId, "data berhasil disimpan")
        })
        .catch(error => {
            console.error(error);
            let info = String(error)
            info.includes("ER_DUP_ENTRY")?bot.sendMessage(chatId, "data sudah ada silahkan diubah jika ingin mengubah data"):bot.sendMessage(chatId, info.substring(0,10));
        });
    }else if(messageText==='/lembur saya'){
        db.connection.query(`SELECT * FROM lembur_it where username = "${user}" order by tanggal desc limit 10;`, (error, results, fields) => {
            if (error) {
            console.error('Error selecting messages from database:', error);
            return;
            }
            let info = []
            results.forEach(ele => {
                ele.tanggal = convertDateToTimezone(ele.tanggal);
            });
            // let data = jsonToHtml(results).join('\n')
            let htmlContent = jsonToHtml(results)
            
            const outputFilePath = 'table.png';

            generateImage(htmlContent, outputFilePath)
            .then(() => {
                bot.sendPhoto(chatId, 'table.png');
            })
            .catch(err => console.error('Error generating image:', err));
        });
    }
});