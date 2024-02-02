
const fs = require("fs");
const util = require("util");
const chalk = require("chalk");
const {
  Configuration,
  OpenAIApi
} = require("openai");



module.exports = sansekai = async (client, m, chatUpdate, store, setting) => {
  try {
      var body =
          m.mtype === "conversation" ?
          m.message.conversation :
          m.mtype == "imageMessage" ?
          m.message.imageMessage.caption :
          m.mtype == "videoMessage" ?
          m.message.videoMessage.caption :
          m.mtype == "extendedTextMessage" ?
          m.message.extendedTextMessage.text :
          m.mtype == "buttonsResponseMessage" ?
          m.message.buttonsResponseMessage.selectedButtonId :
          m.mtype == "listResponseMessage" ?
          m.message.listResponseMessage.singleSelectReply.selectedRowId :
          m.mtype == "templateButtonReplyMessage" ?
          m.message.templateButtonReplyMessage.selectedId :
          m.mtype === "messageContextInfo" ?
          m.message.buttonsResponseMessage?.selectedButtonId || m.message.listResponseMessage?.singleSelectReply.selectedRowId || m.text :
          "";
      var budy = typeof m.text == "string" ? m.text : "";
      // var prefix = /^[\\/!#.]/gi.test(body) ? body.match(/^[\\/!#.]/gi) : "/"
      // var prefix = /^[\\/!#.]/gi.test(body) ? body.match(/^[\\/!#.]/gi) : "/";
    var prefix = /^[^\w\s@]*/.test(body) ? body.match(/^[^\w\s@]*/) : "/";

      const isCmd2 = body.startsWith(prefix);
      const command = body.replace(prefix, "")
          .trim()
          .split(/ +/)
          .shift()
          .toLowerCase();
      const args = body.trim()
          .split(/ +/)
          .slice(1);
      const pushname = m.pushName || "No Name";
      const BOT_owner = "RAONE";
      const donet = "13233063590"
      let text = (q = args.join(" "));
      const from = m.chat;
      const reply = m.reply;
      const mek = chatUpdate.messages[0];

      const color = (text, color) => {
          return !color ? chalk.green(text) : chalk.keyword(color)(text);
      };

      // Group
      const groupMetadata = m.isGroup ? await client.groupMetadata(m.chat)
          .catch(() => {}) : "";
      const groupName = m.isGroup ? groupMetadata.subject : "";

      // Push Message To Console
      let argsLog = budy.length > 30 ? `${q.substring(0, 30)}...` : budy;

      if (isCmd2 && !m.isGroup) {
          console.log(chalk.black(chalk.bgWhite("[ LOGS ]")), color(argsLog, "turquoise"), chalk.magenta("From"), chalk.green(pushname), chalk.yellow(`[ ${m.sender.replace("@s.whatsapp.net", "")} ]`));
      } else if (isCmd2 && m.isGroup) {
          console.log(
              chalk.black(chalk.bgWhite("[ LOGS ]")), color(argsLog, "turquoise"), chalk.magenta("From"), chalk.green(pushname), chalk.yellow(`[ ${m.sender.replace("@s.whatsapp.net", "")} ]`), chalk.blueBright("IN"), chalk.green(groupName)
          );
      }

      if (isCmd2) {
          switch (command) {
          case "help":
    case "menu":
        m.reply(`*❒═════❬ NXT v-2.0 MENU ❭═════╾❒*
YO!! ${pushname} 😎 
*『I"M RA-1, A CHAT-BOT DEVELOPED BY ${BOT_owner} 🏆』*

Here is my command list 👇

*(ASK TO RA-1)*
Cmd: ${prefix}ra1
*Ask anything to AI.* 

*(IMG GENERATING AI)*
Cmd: ${prefix}img
*Generate images by text.*

*(FUN COMMANDS)*
Cmd: ${prefix}ra1 tell me a joke
*Get a random joke.*

Cmd: ${prefix}afk 
*A surprise reply.*

Cmd: ${prefix}ra1 give me a fact
*Get a random fact.*

Cmd: ${prefix}ra1 give me a quote 
*Get a random quote.*

*(USE AT YOUR OWN RISK)*
Cmd: ${prefix}play <song name>
*Play a song from YouTube.*

*(CONTACT INFO)*
🗣️ *OWNER:* ${BOT_owner}
🤖 *CONTACT:* ${donet}
💚 *INSTAGRAM:* [NXT_7R](https://www.instagram.com/nxt_7r/)

Feel free to explore and enjoy! 😊
        `);
              break;
          case "afk":
              m.reply('What are you donig here go away from keyboard 😂')
              break;
          case "fact":
              m.reply("A group of flamingos is called a flamboyance. 🦩");
              break;
          case "actra1": case "hi": case "hello": 
              m.reply(`*❒═════❬ NXT v-2.0 ❭═════╾❒*
        YO!! ${pushname} 😎 \n Type ${prefix} menu or help to get full command list  
      `)
              break;
          case "play":
              m.reply(" Bro i'm not doing this \ngo to https://www.youtube.com/  and play what you want 🤣 \n*BAKA!!*");

              break;
          case "owner":
              m.reply(`Hi there, you can contact my owner at: ${donet}`)

              break;
          case "ai":
          case "openai":
          case "ra1":
          case "gpt":
              try {
                 // if () return reply("\n\nPlease fill in the apikey first in the file key.json\n\n ");
                  if (!text) return reply(`I'm RA-1 I am artificial intelligence 
           developed by RAONE .\n\nfor use Example:\n\n${prefix}${command} What is a recession`);
                  const configuration = new Configuration({
                      apiKey: process.env.OPENAIKEY,
                  });
                  const openai = new OpenAIApi(configuration);

                  const response = await openai.createChatCompletion({
                      model: "gpt-3.5-turbo",
                      messages: [{
                          role: "user",
                          content: text
                      }],
                  });
                  m.reply(`${response.data.choices[0].message.content}`);
              } catch (error) {
                  if (error.response) {
                      console.log(error.response.status);
                      console.log(error.response.data);
                      console.log(`${error.response.status}\n\n${error.response.data}`);
                  } else {
                      console.log(error);
                      m.reply("Sorry an  error :" + error.message);
                  }
              }
              break; //replace this if not working properly
          case "img":
          case "ai-img":
          case "image":
          case "images":
              try {
                  //if () return reply("\n\n Key is required\n\n ");
                  if (!text) return reply(`Creating an image from AI.\n\nContoh:\n${prefix}${command} Wooden house on snow mountain`);
                  const configuration = new Configuration({
                      apiKey: process.env.OPENAIKEY||"AIzaSyCyouca1_KKy4W_MG1xsPzuku5oa8W358c"
                  });


                  const openai = new OpenAIApi(configuration);
                  const response = await openai.createImage({

                      /*engine: "davinci",
                      prompt: text,
                      maxTokens: 0,
                      temperature: 0.7,*/
                      prompt: text,
                      model: "image-alpha-001",
                      size: "512x512",
                      n: 1,
                      /*stop: "\n",*/
                  });
                  /*const imageUrl = response.choices[0].text.trim();*/
                  client.sendImage(from, response.data.data[0].url, text, mek);
              } catch (error) {
                  if (error.response) {
                      console.log(error.response.status);
                      console.log(error.response.data);
                      console.log(`${error.response.status}\n\n${error.response.data}`);
                  } else {
                      console.log(error);
                      m.reply("sorry an internal error :" + error.message);
                  }
              }

              /*case "img": case "ai-img": case "image": case "images":
                try {
                  if (setting.keyopenai === "ISI_APIKEY_OPENAI_DISINI") return reply("Apikey belum diisi\n\nSilahkan isi terlebih dahulu apikeynya di file key.json\n\nApikeynya bisa dibuat di website: https://beta.openai.com/account/api-keys");
                  if (!text) return reply(`Creating an image from AI.\n\nContoh:\n${prefix}${command} Wooden house on snow mountain`);
                  const configuration = new Configuration({
                    apiKey: setting.keyopenai,
                  });
                  const openai = new OpenAIApi(configuration);
                  const response = await openai.createImage({
                    prompt: text,
                    n: 1,
                    size: "512x512",
                  });
                  //console.log(response.data.data[0].url)
                  client.sendImage(from, response.data.data[0].url, text, mek);
                  } catch (error) {
                if (error.response) {
                  console.log(error.response.status);
                  console.log(error.response.data);
                  console.log(`${error.response.status}\n\n${error.response.data}`);
                } else {
                  console.log(error);
                  m.reply("sorry an internal error :"+ error.message);
                }
              }*/
              ////////////////////////////////////////////////////////////////////////////////////////////////////////



              ///////////////////////////96        
              break;
              break;
          default: {
              if (isCmd2 && budy.toLowerCase() != undefined) {
                  if (m.chat.endsWith("broadcast")) return;
                  if (m.isBaileys) return;
                  if (!budy.toLowerCase()) return;
                  if (argsLog || (isCmd2 && !m.isGroup)) {
                      // client.sendReadReceipt(m.chat, m.sender, [m.key.id])
                      console.log(chalk.black(chalk.bgRed("[ ERROR ]")), color("command", "turquoise"), color(`${prefix}${command}`, "turquoise"), color("Not found", "turquoise"));
                  } else if (argsLog || (isCmd2 && m.isGroup)) {
                      // client.sendReadReceipt(m.chat, m.sender, [m.key.id])
                      console.log(chalk.black(chalk.bgRed("[ ERROR ]")), color("command", "turquoise"), color(`${prefix}${command}`, "turquoise"), color("Not found", "turquoise"));
                  }
              }
          }
          }
      }
  } catch (err) {
      m.reply(util.format(err));
  }
};


let file = require.resolve(__filename); ////global////
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(chalk.redBright(`Update ${__filename}`));
  delete require.cache[file];
  require(file);
});
