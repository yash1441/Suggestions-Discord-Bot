const { Events, ChannelType } = require('discord.js');
const logger = require('../logging/logger.js');
const feishu = require('../utils/feishu.js');

module.exports = {
    name: Events.ThreadCreate,
    async execute(thread) {
        if (thread.parent.type != ChannelType.GuildForum || thread.parentId != process.env.VOTE_SUGGESTIONS_CHANNEL) return;

        const channel = interaction.client.channels.cache.get(process.env.VOTE_SUGGESTIONS_CHANNEL);
        const availableTags = channel.availableTags;

        const messages = await thread.messages.fetch();
        const message = messages.first()

        const embed = message.embeds[0];

        await message.react('🔼').then(() => message.react('🔽'));

        let category;

        for (const tag of availableTags) {
            if (tag.id == thread.appliedTags[0]) {
                category = tag.name;
                break;
            }
        }

        const data = {
			fields: {
				"Suggestion": embed.description,
                "Category": category,
				"🔼": 0,
				"🔽": 0,
                "Discord ID": embed.footer.text,
                "Discord Name": embed.author.name,
			},
		};

		const tenantToken = await feishu.authorize(
			process.env.FEISHU_ID,
			process.env.FEISHU_SECRET
		);

        await feishu.createRecord(
			tenantToken,
			"NeVObULOOaraZasdu4Iccix8n5b",
			"tbleOFyvlqnVOcOu",
			data
		);
    }
};