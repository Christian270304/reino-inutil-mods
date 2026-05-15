BlockEvents.rightClicked(event => {
  const hand = String(event.hand)
  if (hand === 'OFF_HAND') return

  const player = event.player
  const blockId = String(event.block.id)

  if (!player) return
  if (blockId !== 'kubejs:atm') return

  player.tell('§6=== CAJERO ===')
  player.tell('§eSaldo: §a' + getMoney(player) + ' monedas')
  player.tell('')
  player.tell(Text.of('§a[Ingresar dinero]').clickRunCommand('/atm deposit'))
  player.tell(Text.of('§b[Sacar 100]').clickRunCommand('/atm withdraw 100'))
  player.tell(Text.of('§b[Sacar 500]').clickRunCommand('/atm withdraw 500'))
  player.tell(Text.of('§b[Sacar 1000]').clickRunCommand('/atm withdraw 1000'))
  player.tell(Text.of('§e[Ver saldo]').clickRunCommand('/money'))
})