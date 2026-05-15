let clientMoney = 0

NetworkEvents.dataReceived('money_sync', event => {
  clientMoney = event.data.money
})

ClientEvents.tick(event => {
  const player = Client.player
  if (!player) return

  player.paint({

    money_bg: {
      type: 'rectangle',

      // Derecha con margen de 15px
      x: '$screenW - 110',

      // Centro vertical
      y: '$screenH / 2 - 11',

      w: 95,
      h: 22,

      color: 0x88000000,
      draw: 'ingame'
    },

    money_text: {
      type: 'text',

      // Dentro del rectángulo
      x: '$screenW - 100',

      // Centrado verticalmente
      y: '$screenH / 2 - 4',

      text: `🪙 ${clientMoney}`,

      color: '#FFD700',
      scale: 1,

      shadow: true,
      draw: 'ingame'
    }
  })
})