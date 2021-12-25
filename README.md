# Discord.JS Server Logger
The `discord-server-logger` package is a small and simple addon to bots using Discord.JS, used to log any sent messages from a given server. This was originally made 3 or so years ago, and it's since been updated and changed from D.JS v11 to v13. If you need help or have questions, join my Discord server (https://discord.gg/5MQzK9DdpB).
    
# Explanation & Preview
The addon will watch a given server for any messages sent and log them in the logging server, including any attachments sent. Using webhooks in the logging server messages will have the users tag (e.g, Darko Pendragon#3124) as their username and the users avatar. Right below is a screenshot of the channel #gta-chat in a GTA server:  
![GTACHAT](https://user-images.githubusercontent.com/28911975/147382405-b344adeb-cf5a-4b87-af7c-fffffaaf717e.png)  
  
Here is a screenshot of what this will now look like in the logging server:  
![GTACHATLOG](https://user-images.githubusercontent.com/28911975/147382402-b5c2d2b5-8c9d-47e5-baa0-3e6bf3de951f.png)  
  
# Setup
## Requirements
* A Discord bot token (see [the Discord developer portal](https://discord.com/developers/applications))
* Node.js v16 or higher
  
## Setup Steps
1. Run `npm install discord-server-logger --save` in your working directory
2. Get the ID of the server you want to log
3. Create a new Discord server for the bot to log to
4. Make sure the bot is in BOTH servers
5. Require the module, and start your bot (example below)
   
## Setup Example
```js
const Discord = require('discord.js');
const DSL = require('discord-server-logger');

const client = new Discord.Client({ // these are the min required intents to run correctly
    intents: [
        Discord.Intents.FLAGS.GUILDS,
        Discord.Intents.FLAGS.GUILD_INTEGRATIONS,
        Discord.Intents.FLAGS.GUILD_WEBHOOKS,
        Discord.Intents.FLAGS.GUILD_MESSAGES
    ]
});

const Logger = new DSL(client, { // the only required options
    watchID: "SERVER TO WATCH ID (FROM STEP 2)"
    loggingID: "LOGGING SERVER ID (FROM STEP 3)",
});

client.login('BOT TOKEN');
```

# Other Features
You can send messages as the bot from the logging server (W.I.P), quick example:
```js
const Logger = new DSL(client, {
    sendAsBot: ["YOUR ID"],
    loggingID: "LOGGING SERVER ID",
    watchID: "SERVER TO WATCH ID"
});
```
Adding the `sendAsBot` option and including your ID in the array will then make your bot send messages you send in the logging server. For example, if you send "Error: no signs of intelligent life" in the logging server to the channel `#general`, your bot will then send the same message in the channel named `#general` within the server it's watching. Adding someone elses ID into the array will also allow them to do this. So far, this is the only extra feature.

# Notes
* The bot MUST be in the server you want to log.
* The bot will NOT be able to log messages in channels it cannot see.
* For easier setup in the logging server, give the bot the Administrator permission.
* While this is updated for newer Discord.JS and Node.js versions, the code is still "sloppy."

# Troubleshooting & Problems
If you run into any issues, or just have any questions/suggestions, you can join my Discord server (https://discord.gg/5MQzK9DdpB) or add me on Discord, `Darko Pendragon#3219`.

