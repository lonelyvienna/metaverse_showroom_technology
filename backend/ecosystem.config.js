module.exports = {
  /**
   * Application configuration section
   * http://pm2.keymetrics.io/docs/usage/application-declaration/
   */
  apps : [
    {
      name      : 'technology-showroom-match-server',
      script    : 'matchServer.js',
      env: {
        PORT: '10513'
      }
    },
    {
      name      : 'technology-showroom-room-server-1',
      script    : 'roomServer.js',
      env: {
        PORT: '10507',
        MATCH_SERVER_URL: 'http://120.25.74.1:10513',
        THIS_SERVER_URL: 'ws://120.25.74.1:10507'
      }
    },
    // {
    //   name      : 'room-server-2',
    //   script    : 'roomServer.js',
    //   env: {
    //     PORT: '3202',
    //     MATCH_SERVER_URL: 'http://127.0.0.1:3200',
    //     THIS_SERVER_URL: 'wss://你的域名:3202'
    //   }
    // },
  ]
};
