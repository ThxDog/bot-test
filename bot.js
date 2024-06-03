require('dotenv').config();

const { Telegraf } = require('telegraf');
const axios = require('axios');
const cheerio = require('cheerio');
const { Configuration, OpenAIApi } = require('openai');

// Configuração da API do OpenAI
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const searchBaseURL = process.env.SEARCH_BASE_URL;

bot.start((ctx) => ctx.reply('Olá! Eu sou o bot do projeto Haramborghini. Estou aqui para ajudar você com qualquer dúvida sobre nosso projeto de criptomoeda. Como posso ajudar você hoje?'));

bot.on('text', async (ctx) => {
  const userMessage = ctx.message.text;

  // Função para buscar informações no site
  async function searchWebsite(query) {
    try {
      const response = await axios.get(`${searchBaseURL}/search`, {
        params: {
          q: query
        }
      });

      const $ = cheerio.load(response.data);
      const result = $('.result-snippet').first().text();  // Ajuste o seletor conforme a estrutura do site

      return result;
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  // Função para gerar resposta usando OpenAI
  async function generateAIResponse(query) {
    try {
      const response = await openai.createCompletion({
        model: 'text-davinci-003',
        prompt: query,
        max_tokens: 150,
        temperature: 0.7,
      });

      return response.data.choices[0].text.trim();
    } catch (error) {
      console.error(error);
      return 'Desculpe, não consegui processar sua solicitação no momento.';
    }
  }

  const searchResponse = await searchWebsite(userMessage);

  if (searchResponse) {
    ctx.reply(`😊 Aqui está o que encontrei sobre "${userMessage}":\n\n${searchResponse}\n\nSe precisar de mais alguma coisa, estou aqui para ajudar!`);
  } else {
    const aiResponse = await generateAIResponse(userMessage);
    ctx.reply(aiResponse);
  }
});

bot.launch();
