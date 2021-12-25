const Discord = require("discord.js");

class Logger {
    constructor(client, options) {
        this.client = client
        this.watchGuild = null
        this.logGuild = null
        this.loggingID = (options && options.loggingID)
        this.watchID = (options && options.watchID)
        this.sendAsBot = (options && options.sendAsBot) || []
        this._creation = (async () => {
            if (!this.loggingID || !this.watchID) throw Error('[LOGGER] no ID was passed for watch/log guilds')
            await this.getGuilds()
            this.client.on('messageCreate', async (message) => {
                if (message.guild?.id == this.loggingID && this.sendAsBot?.includes(message.author.id) && !message.author.bot && !message.author.system) return this.sendBotMsg(message).catch(console.error) 
                if (message.guild && message.guild.id != this.watchID) return;
                if (!this.logGuild || !this.watchGuild) await this.getGuilds()
                var MSG = {
                    content: message?.content.trim() || "",
                    attachments: message.attachments.size > 0 ? [] : false,
                    attachments_size: 0,
                    attachments_extra: [],
                    attachments_extra_size: 0,
                    embeds: message.embeds.length > 0 ? message.embeds : false,
                    has_category: false
                }

                if (message.attachments) message.attachments.forEach(a => {
                    let n_size = MSG.attachments_size + a.size
                    if (n_size < 8000000) {
                        MSG.attachments.push({ attachment: a.url, name: a.name })
                        MSG.attachments_size = n_size
                    } else {
                        MSG.attachments_extra.push({ attachment: a.url, name: a.name })
                        MSG.attachments_extra_size = MSG.attachments_extra_size + a.size;
                    }
                })


                message.channel.fetch(true).then(async MESSAGE_CHANNEL => {
                    if (MESSAGE_CHANNEL.type == "GUILD_TEXT") {
                        if (MESSAGE_CHANNEL.parent) {
                            MSG.has_category = true
                            var CATEGORY = this.logGuild.channels.cache.filter(c => c.type == "GUILD_CATEGORY" && c.name.toLowerCase() == MESSAGE_CHANNEL.parent.name.toLowerCase())
                            if (CATEGORY.size < 1) {
                                this.logGuild.channels.create(MESSAGE_CHANNEL.parent.name, { type: "GUILD_CATEGORY" })
                                CATEGORY = this.logGuild.channels.cache.find(c => c.name == MESSAGE_CHANNEL.parent.name && c.type == "GUILD_CATEGORY")
                            } else {
                                CATEGORY = CATEGORY.first()
                            }
                        }
                        var MSG_CHANNEL = this.logGuild.channels.cache.filter(c => c.type == "GUILD_TEXT" && c.name.toLowerCase() == MESSAGE_CHANNEL?.name?.toLowerCase())
                        if (MSG_CHANNEL.size == 0) {
                            this.logGuild.channels.create(MESSAGE_CHANNEL.name, { type: "GUILD_TEXT", topic: MESSAGE_CHANNEL.topic }).then(async c => {
                                const hook = await c.fetchWebhooks().then(async h => {
                                    if (h?.size == 0) {
                                        const hk = await c.createWebhook('Logger')
                                        return hk;
                                    } else if (h?.size > 0) {
                                        h = h.filter(x => x.name.toLowerCase() == "logger").first()
                                        if (!h) {
                                            const hk = await c.createWebhook('Logger')
                                            return hk;
                                        } else {
                                            return h;
                                        }
                                    } else return h;
                                })
                                let cat = this.logGuild.channels.cache.find(c => c.name == MESSAGE_CHANNEL.parent.name && c.type == "GUILD_CATEGORY")
                                if (MSG.has_category && !c.parent) c.setParent(cat.id).catch(console.error)
                                this.sendMessage(MSG, message, c, hook)
                            }).catch(console.log)
                        } else {
                            MSG_CHANNEL = MSG_CHANNEL.first()
                            const hook = await MSG_CHANNEL.fetchWebhooks().then(async h => {
                                if (h?.size == 0) {
                                    const hk = await MSG_CHANNEL.createWebhook('Logger')
                                    return hk;
                                } else if (h?.size > 0) {
                                    h = h.filter(x => x.name.toLowerCase() == "logger").first()
                                    if (!h) {
                                        const hk = await MSG_CHANNEL.createWebhook('Logger')
                                        return hk;
                                    } else {
                                        return h;
                                    }
                                } else return h;
                            })
                            if (MSG.has_category && !MSG_CHANNEL.parent) MSG_CHANNEL.setParent(CATEGORY.id).catch(console.error)
                            this.sendMessage(MSG, message, MSG_CHANNEL, hook)
                        }
                    } else if (MESSAGE_CHANNEL.type == "GUILD_PUBLIC_THREAD" || MESSAGE_CHANNEL.type == "GUILD_PRIVATE_THREAD") {
                        var parent = this.logGuild?.channels.cache.filter(x => x.name == MESSAGE_CHANNEL.parent.name)
                        if (parent.size > 0) parent = parent.first()
                        else parent = await this.logGuild.channels.create(MESSAGE_CHANNEL.parent.name, { type: "GUILD_TEXT", topic: MESSAGE_CHANNEL.parent?.topic }).then(async ch => { return ch; })
                        
                        const hook = await parent.fetchWebhooks().then(async h => {
                            if (h?.size == 0) {
                                const hk = await parent.createWebhook('Logger')
                                return hk;
                            } else if (h?.size > 0) {
                                h = h.filter(x => x.name.toLowerCase() == "logger").first()
                                if (!h) {
                                    const hk = await parent.createWebhook('Logger')
                                    return hk;
                                } else {
                                    return h;
                                }
                            } else return h;
                        })

                        const active = await parent.threads.fetchActive()
                        const archived = await parent.threads.fetchArchived()
                        let filt = active.threads.filter(x => x.name.toLowerCase() == MESSAGE_CHANNEL.name.toLowerCase())
                        if (filt && filt.size > 0) {
                            let chan = filt.first()
                            this.sendMessage(MSG, message, chan, hook, chan.id)
                        } else {
                            let arch = archived.threads.filter(x => x.name.toLowerCase() == MESSAGE_CHANNEL.name.toLowerCase())
                            if (arch && arch.size > 0) {
                                let chan = arch.first()
                                this.sendMessage(MSG, message, chan, hook, chan.id)
                            } else {
                                parent.threads.create({ name: MESSAGE_CHANNEL.name }).then(channel => {
                                    this.sendMessage(MSG, message, channel, hook, channel.id)
                                })
                            }
                        }
                    }
                }).catch(console.error)
            })
        })();
    }

    async sendBotMsg(message) {
        return new Promise(async (resolve, reject) => {
            if (!message || !message.author || !message.channel) return reject('invalid message object')
            const from = await message.guild.channels.fetch(message.channel.id)
            var to = await this.watchGuild?.channels.cache.find(x => x.name == from.name)
            if (!to) {
                to = await this.watchGuild?.channels.fetch().then(async channels => {
                    const filt = await channels.filter(x => x.name == from.name)?.first()
                    return filt;
                }).catch(() => { return null; })
                if (!to) return reject('no channel to')
            }
            const MSG = await to?.send(message.content).catch(e => { return e; })
            resolve(MSG)
        })
    }

    async sendMessage(msg, message, channel, hook, target) {
        return new Promise(async (resolve, reject) => {
            let payload = { username: message.author.tag, avatarURL: message.author?.displayAvatarURL({ dynamic: true }) || "" }
            if (msg.content?.length > 0) payload.content = message.content
            if (msg.attachments && msg.attachments.length > 0) payload.files = msg.attachments;
            if (msg.embeds) payload.embeds = msg.embeds
            if (target) payload.threadId = target
            await hook.send(payload).catch(console.error)
            if (msg.attachments_extra.length > 0) {
                async function doNext() {
                    let next = msg.attachments_extra.shift()
                    if (next) {
                        await hook.send({ username: message.author.tag, avatarURL: message.author?.displayAvatarURL({ dynamic: true }) || "", files: [next] }).catch(console.log)
                        doNext()
                    } else {
                        resolve()
                    }
                }
                doNext()
            } else {
                resolve()
            }
        })
    }

    async getGuilds() {
        const lg = await this.client.guilds?.fetch(this.loggingID).catch(() => { return null; })
        if (!lg) return false;
        this.logGuild = lg
        const wg = await this.client.guilds?.fetch(this.watchID).catch(() => { return null; })
        if (!lg) return false;
        this.watchGuild = wg
        return true;
    }
}

module.exports = Logger;