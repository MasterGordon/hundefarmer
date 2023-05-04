const tmi = require("tmi.js");
const dotenv = require("dotenv");
const axios = require("axios");
dotenv.config();

const steamId = "409490419";

const getMMR = async () => {
  const response = await axios.get(
    `https://api.opendota.com/api/players/${steamId}`
  );
  const { mmr_estimate } = response.data;
  return mmr_estimate.estimate;
};

let heroes = [];
axios.get("https://api.opendota.com/api/heroes").then((response) => {
  heroes = response.data;
});

const getLastMatch = async () => {
  const response = await axios.get(
    `https://api.opendota.com/api/players/${steamId}/matches`
  );
  const {
    radiant_win,
    duration,
    kills,
    deaths,
    assists,
    player_slot,
    hero_id,
  } = response.data[0];
  const { localized_name } = heroes.find((hero) => hero.id === hero_id);

  const radiant = player_slot <= 127 === radiant_win;
  return {
    win: radiant,
    duration,
    kills,
    deaths,
    assists,
    hero: localized_name,
  };
};

const client = new tmi.Client({
  options: { debug: true },
  connection: {
    secure: true,
    reconnect: true,
  },
  identity: {
    username: "HundeFarmer",
    password: process.env.TWITCH_OAUTH_TOKEN,
  },
  channels: ["lowm8"],
});

client.connect();

const commands = {
  "!dog": (channel, message, tags) => {
    client.say(channel, `@${tags["display-name"]}, Wuff Wuff!`);
  },
  "!mmr": (channel, message) => {
    getMMR().then((mmr) => {
      client.say(channel, `${mmr} MMR, Wuff Wuff!`);
    });
  },
  "!lastmatch": (channel, message, tags) => {
    getLastMatch().then((match) => {
      const { win, duration, kills, deaths, assists, hero } = match;
      if (win)
        client.say(
          channel,
          `Stefan hat als ${hero} abgefarmt mit ${kills}/${deaths}/${assists} in ${Math.floor(
            duration / 60
          )}:${duration % 60} , Wuff Wuff!`
        );
      else
        client.say(
          channel,
          `Stefan wurde als ${hero} abgefarmt mit ${kills}/${deaths}/${assists} in ${Math.floor(
            duration / 60
          )}:${duration % 60} , Wuff Wuff!`
        );
    });
  },
  "!randomhero": (channel, message, tags) => {
    const randomHero = heroes[Math.floor(Math.random() * heroes.length)];
    client.say(
      channel,
      `@${tags["display-name"]}, ${randomHero.localized_name}, Wuff Wuff!`
    );
  },
  "!pudge": (channel, message, tags) => {
    client.say(channel, `Game is over, Wuff Wuff! OhMyDog`);
  },
  "!smoke": (channel, message, tags) => {
    client.say(channel, `Rauchen Rauchen Rauchen 🚬`);
  },
  "!armin": (channel, message, tags) => {
    axios.get("https://excuser-three.vercel.app/v1/excuse").then((response) => {
      client.say(channel, `Armin: "${response.data[0].excuse}"`);
    });
  },
  "!5050": (channel, message, tags) => {
    const random = Math.random();
    if (random < 0.5) {
      client.say(channel, `@${tags["display-name"]}, Gewonnen, Wuff Wuff!`);
    } else {
      client.say(channel, `@${tags["display-name"]}, Verloren, Wuff Wuff!`);
    }
  },
  "!uptime": (channel, message, tags) => {
    axios
      .get(`https://beta.decapi.me/twitch/uptime/${channel.slice(1)}`)
      .then((response) => {
        client.say(channel, `@${tags["display-name"]}, ${response.data}`);
      });
  },
  "!iq": (channel, message, tags) => {
    const random = 50 + Math.floor(Math.random() * 80);
    client.say(channel, `@${tags["display-name"]}, ${random} IQ, Wuff Wuff!`);
  },
};

const aliases = {
  "!lm": "!lastmatch",
  "!lg": "!lastmatch",
  "!rh": "!randomhero",
};

client.on("message", (channel, tags, message, self) => {
  console.log(`${tags["display-name"]}: ${message}`);
  const command =
    commands[message.toLowerCase()] || commands[aliases[message.toLowerCase()]];
  if (command) command(channel, message, tags);
  if (message.toLowerCase() === "!commands") {
    client.say(
      channel,
      `@${tags["display-name"]}, ${Object.keys(commands).join(", ")}`
    );
  }
});
