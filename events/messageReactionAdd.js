const { Events, Partials } = require('discord.js');
const logger = require('../logging/logger.js');
const feishu = require('../utils/feishu.js');

module.exports = {
    name: Events.MessageReactionAdd,
    async execute(reaction, user) {
        if (reaction.partial) {
            try {
                await reaction.fetch();
            } catch (error) {
                logger.error('Something went wrong when fetching the message:');
                console.error(error);
                return;
            }
        }

        if (user.id == process.env.BOT_ID) return;

        if (reaction.emoji.name != '🔼' && reaction.emoji.name != '🔽') return;

        let votesChannel, bitableBase, bitableTable;

        switch (reaction.message.guildId) {
            case process.env.GRVR_ID:
                votesChannel = process.env.GRVR_VOTE;
                bitableBase = process.env.GRVR_BASE;
                bitableTable = process.env.GRVR_TABLE;
                break;
            case process.env.LIGHT_ID:
                votesChannel = process.env.LIGHT_VOTE;
                bitableBase = process.env.LIGHT_BASE;
                bitableTable = process.env.LIGHT_TABLE;
                break;
        }

        if (reaction.message.channel.parentId != votesChannel || reaction.message.channelId === '1135942632573517824') return;

        const upCount = reaction.message.reactions.cache.get('🔼').count - 1;
        const downCount = reaction.message.reactions.cache.get('🔽').count - 1;

        const tenantToken = await feishu.authorize(
            process.env.FEISHU_ID,
            process.env.FEISHU_SECRET
        );

        const response = JSON.parse(
            await feishu.getRecords(
                tenantToken,
                bitableBase,
                bitableTable,
                `CurrentValue.[Suggestion] = "${reaction.message.embeds[0].description}"`
            )
        );

        if (response.data == undefined || !response.data.total) {
            return logger.warn('Could not add ' + reaction.emoji.name + ' to ' + reaction.message.id);
        }
        
        const data = {
            fields: {
                "🔼": upCount,
                "🔽": downCount
            }
        }

        await feishu.updateRecord(
            tenantToken,
            bitableBase,
            bitableTable,
            response.data.items[0].record_id,
            data
        );
    }
};