const TelegramBot = require('node-telegram-bot-api');
const db = require('./db');
const config = require('./config');
const jsonToTable = require('json-to-table');
const bot = new TelegramBot(config.telegramBotToken, { polling: true });
const prettier = require('prettier');
const puppeteer = require('puppeteer');
const fs = require('fs');
const GitHubIssueCreator = require('./issuemodule');
const { githubAccessToken } = require('./config');
const githubIssueCreator = new GitHubIssueCreator(githubAccessToken);

const CRUDModule = require('./catatan_infras');

const crudModule = new CRUDModule(db.connection);

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

function convertTextToJson2(text) {
    try {
        const currentDate = new Date().toISOString().slice(0, 10);
        const lines = text.split('\n').filter(line => line.trim() !== '');
        const jenis = lines.find(line => line.includes('Jenis')).split(':')[1].trim();
        const keteranganIndex = lines.findIndex(line => line.includes('Keterangan'));
        const keteranganLines = [];
        for (let i = keteranganIndex + 1; i < lines.length; i++) {
            if (lines[i].trim() === '') break; // Stop if an empty line is encountered
            keteranganLines.push(lines[i].trim());
        }
        const perihal = keteranganLines.join('\n'); // Join all perihal lines with newline character
        const result = {
            jenis : jenis,
            sub_judul : perihal.substring(0, 20),
            perihal: perihal
        };
        return result;
    } catch (error) {
        console.error("An error occurred:", error.message);
    }
}

function convertTextToJson3(text) {
    try {
        const currentDate = new Date().toISOString().slice(0, 10);
        const lines = text.split('\n').filter(line => line.trim() !== '');
        const judul = lines.find(line => line.includes('Judul')).split(':')[1].trim();
        const keteranganIndex = lines.findIndex(line => line.includes('Ket'));
        const keteranganLines = [];
        for (let i = keteranganIndex + 1; i < lines.length; i++) {
            if (lines[i].trim() === '') break; // Stop if an empty line is encountered
            keteranganLines.push(lines[i].trim());
        }
        const perihal = keteranganLines.join('\n'); // Join all perihal lines with newline character
        const result = {
            judul : judul,
            Ket: perihal
        };
        return result;
    } catch (error) {
        console.error("An error occurred:", error.message);
    }
}

function convertTextToJson(text, username) {
    try {
        const currentDate = new Date().toISOString().slice(0, 10);
        const lines = text.split('\n').filter(line => line.trim() !== '');
        const id = lines.find(line => line.includes('NIK')).split(':')[1].trim();
        const tanggal = lines.find(line => line.includes('Tanggal')).split(':')[1].trim();
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
            id: generateRandomId(id, tanggal),
            username: username,
            tanggal: tanggal,
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

function deleteAllMessages(chatId) {
    sentMessageIds.forEach((messageId) => {
        bot.deleteMessage(chatId, messageId)
            .then(() => {
                console.log(`Message ${messageId} deleted successfully`);
            })
            .catch((error) => {
                console.error(`Error deleting message ${messageId}:`, error.response.body);
            });
    });
}

function extractIdFromMessage(messageText) {
    if (typeof messageText !== 'string') {
        console.error("format yang benar \"nik:tanggal\" tanpa strip\n contoh /edit lembur : 474.100822_20240223");
        return null;
    }

    if (!messageText.includes(":")) {
        console.error("format yang benar \"nik:tanggal\" tanpa strip\n contoh /edit lembur : 474.100822_20240223");
        return null;
    }

    const parts = messageText.split(':');

    if (parts.length < 2) {
        console.error("format yang benar \"nik:tanggal\" tanpa strip\n contoh /edit lembur : 474.100822_20240223");
        return null;
    }

    const id = parts[1].trim();
    return id;
}

bot.on('message', (msg) => {

  const chatId = msg.chat.id;
  const messageText = msg.text;
  let user 
  if(msg.chat.type == 'group'){
    user = msg.from.username
  }else{
    user = msg.chat.username
  }

    if(messageText==='/get_iplist'){
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
    else if(messageText==='/clear'){
        if(user=='hcalldee'){
            deleteAllMessages(chatId);
        }else{
            bot.sendMessage(chatId, `Unauthorized`);
        }
    }
    else if(messageText==='/set_iplist'){    
        bot.sendMessage(chatId, `http://192.168.1.227/itutl/`);
    }
    // catatan mikrotik
    else if(messageText==='/set_info'){
        bot.sendMessage(chatId, `berikut contoh buat catatan kode mikrotik\n\n*catatan_kode \nJudul : \nKet :\n`);
    }
    else if(messageText==='/get_catatan_mikrotik'){
        crudModule.read()
            .then(result => {
                bot.sendMessage(chatId, result.map(row => `${row.id} ${row.judul}`).join('\n'));
            })
            .catch(error => {
                console.error(error); // Handle errors if any
            });
    }
    else if(messageText.includes('/get_catatan_mikrotik : ')){
        let id = extractIdFromMessage(messageText);
        if(id!=null){
            crudModule.read(id)
                .then(result => {
                    bot.sendMessage(chatId, `${result.judul}\n\n\t${result.Ket}`);
                })
                .catch(error => {
                    console.error(error); // Handle errors if any
                });
        }else{
            crudModule.read()
            .then(result => {
                bot.sendMessage(chatId, result.map(row => `${row.id} ${row.judul}`).join('\n'));
            })
            .catch(error => {
                console.error(error); // Handle errors if any
            });
        }
    }
    else if(messageText.includes('/del_catatan_mikrotik : ')){
        let id = extractIdFromMessage(messageText);
        if(id!=null){
            crudModule.delete(id)
                .then(result => {
                    bot.sendMessage(chatId, `data berhasil dihapus`);
                })
                .catch(error => {
                    console.error(error); // Handle errors if any
                });
        }else{
            crudModule.read()
            .then(result => {
                bot.sendMessage(chatId, result.map(row => `${row.id} ${row.judul}`).join('\n'));
            })
            .catch(error => {
                console.error(error); // Handle errors if any
            });
        }
    }
    else if(messageText.includes('/edit_catatan_mikrotik')){
        let id = extractIdFromMessage(messageText);
        if(id==null){
            bot.sendMessage(chatId, `format yang benar /edit_catatan_mikrotik : 1`);
        }else{
            let query =`SELECT * FROM catatan_Infras where id = "${id}";`
            db.connection.query(query, (error, results, fields) => {
                if (error) {
                    console.error('Error selecting messages from database:', error);
                    return;
                }
                let data = results[0]
                bot.sendMessage(chatId, `berikut contoh buat catatan kode mikrotik\n\n*catatan_kode_edit-${data.id} \nJudul : ${data.judul} \nKet :\n${data.Ket}`);
            });
        }
    }
    else if(messageText.includes('*catatan_kode_edit')){
        // Extract the line using regular expression
        // const result = messageText.match(/.*\*catatan_kode_edit.*/);
        let id = messageText.match(/.*\*catatan_kode_edit.*/)[0].split('-')[1]
        let data = convertTextToJson3(messageText)
        crudModule.update(id,data)
        .then(result => {
            bot.sendMessage(chatId, `catatan kode berhasil diubah`);
        })
        .catch(error => {
            console.error(error); // Handle errors if any
        });
    }
    else if(messageText.includes('*catatan_kode')){
        console.log(convertTextToJson3(messageText)); 
        data = convertTextToJson3(messageText)
        crudModule.create(data)
        bot.sendMessage(chatId, `catatan kode berhasil disimpan`);
    }

    else if(messageText==='/get_remote_list'){    
        bot.sendMessage(chatId, `list anydesk remot\n\n210766838 inacb\n269900226 linux server\n1867185632 linux proxmox\n953790503 win proxmox\n1819903078 adminakre`);
    }
    else if(messageText==='/help' || messageText.includes('/help')){    
        let info = "help:\n\n/get_iplist\n\tliat semua ip list di pelita\n\n/set_iplist\n\tcrud semua ip list di pelita dan web lembur\n\n/set_info\n\tmembuat catatan kode mikrotik untuk koding jaringan\n\n /set_lembur\n\tbikin lemburan unit it\n\n/lembur_saya\n\tliat lemburan unit it\n\n/edit lembur : NIK_tgl\n\tedit lemburan, id lembur liat di lembur saya\n\n/get_remote_list\n\tliat list remote pc\n\n/set_info\n\tbuat contoh catatan\n\t/get_catatan_mikrotik\n\t/edit_catatan_mikrotik\n\t/del_catatan_mikrotik"
        bot.sendMessage(chatId, info,{ parseMode: 'Markdown' });
    }else if(messageText==='/lapor_issue_mlite'){
        // githubIssueCreator.createIssue('hcalldee', 'mlite_rspi', 'module a error', 'module error ketika a', ['bug']);
        bot.sendMessage(chatId, `berikut contoh form laporan\n\n*form_laporan \nNama : \nUnit : \nTanggal : ${new Date().toISOString().slice(0, 10)}\nJenis : permintaan/error (pilih salah satu)\nKeterangan :\n`);
        // bot.sendMessage(chatId, 'laporan diterima dan dikirim ke Repositori,\n terimakasih atas kontribusi anda');
    }
    else if(messageText.includes('*form_laporan')){
        console.log(convertTextToJson2(messageText)); 
        data = convertTextToJson2(messageText)
        githubIssueCreator.createIssue('hcalldee', 'mlite_rspi', data.sub_judul, data.perihal, [data.jenis]);
        bot.sendMessage(chatId, 'laporan diterima dan dikirim ke Repositori,\n terimakasih atas kontribusi anda');
    }
    else if(messageText==='/set_lembur'){
        db.connection.query(`SELECT * FROM user_it where username = "${user}";`, (error, results, fields) => {
            if (error) {
                console.error('Error selecting messages from database:', error);
                return;
            }
            let data = results[0]
            bot.sendMessage(chatId, `berikut contoh form lembur\n\n*form_lembur \nNama : ${data.Nama}\nNIK : ${data.NIK}\nJabatan : Staff IT \nTanggal : ${new Date().toISOString().slice(0, 10)}\nDurasi : \nPerihal :\n`);
        });
    }else if(messageText.includes('/edit lembur')){
        // let id = messageText.match(/.*\*form_edit_lembur.*/)[0].split('-')[1]
        let id = extractIdFromMessage(messageText);
        if(id==null){
            bot.sendMessage(chatId, `format yang benar \"nik:tanggal\" tanpa strip\n contoh:\n /edit lembur : 474.100822_20240223`);
        }else{
            let query =`SELECT * FROM lembur_it AS a JOIN user_it AS b ON a.username = b.username where a.id = "${id}";`
            db.connection.query(query, (error, results, fields) => {
                if (error) {
                    console.error('Error selecting messages from database:', error);
                    return;
                }
                let data = results[0]
                console.log(results);
                bot.sendMessage(chatId, `berikut contoh form lembur\n\n*form_edit_lembur-${data.id}\nNama : ${data.Nama}\nNIK : ${data.NIK}\nJabatan : Staff IT \nTanggal : ${data.tanggal}\nDurasi : ${data.durasi}\nPerihal :\n${data.perihal}`);
            });
        }
    }
    else if(messageText.includes('*form_lembur')){
        db.insertData(convertTextToJson(messageText, user))
        .then(result => {
            bot.sendMessage(chatId, "data berhasil disimpan")
        })
        .catch(error => {
            console.error(error);
            let info = String(error)
            info.includes("ER_DUP_ENTRY")?bot.sendMessage(chatId, "data sudah ada silahkan diubah jika ingin mengubah data"):bot.sendMessage(chatId, info.substring(0,10));
        });
    }
    else if(messageText.includes('*form_edit_lembur')){
        let id = messageText.match(/.*\*form_edit_lembur.*/)[0].split('-')[1]
        let data = convertTextToJson(messageText, user)
        data.id = generateRandomId(id.split('_')[0],data.tanggal);
        delete data.username;
        
        db.editData(id,data)
        .then(result => {
            bot.sendMessage(chatId, "data berhasil diubah")
        })
        .catch(error => {
            console.error(error);
            let info = String(error)
            info.includes("ER_DUP_ENTRY")?bot.sendMessage(chatId, "data sudah ada silahkan diubah jika ingin mengubah data"):bot.sendMessage(chatId, info.substring(0,10));
        });
    }
    else if(messageText==='/lembur_saya'){
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
    else{
        bot.sendMessage(chatId, 'klik ini : /help');
    }
});