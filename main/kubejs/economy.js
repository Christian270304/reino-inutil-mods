const CURRENCY_NAME = 'monedas'

const CHIPS = [
  { id: 'casinochips:rich_7', value: 1000 },
  { id: 'casinochips:rich_6', value: 500 },
  { id: 'casinochips:rich_5', value: 100 },
  { id: 'casinochips:rich_4', value: 50 },
  { id: 'casinochips:rich_3', value: 10 },
  { id: 'casinochips:rich_2', value: 5 },
  { id: 'casinochips:rich', value: 1 }
]

const CASH = [
  { id: 'good_ol_currency_reforged:onehundred_dollar', value: 100 },
  { id: 'good_ol_currency_reforged:fifty_dollar', value: 50 },
  { id: 'good_ol_currency_reforged:twenty_dollar', value: 20},
  { id: 'good_ol_currency_reforged:ten_dollar', value: 10 },
  { id: 'good_ol_currency_reforged:five_dollar', value: 5 },
  { id: 'good_ol_currency_reforged:one_dollar', value: 1 }
]

function giveCash(player, amount) {
  let remaining = parseInt(amount)

  for (const cash of CASH) {
    let value = parseInt(cash.value)
    let count = 0

    while (remaining >= value) {
      count++
      remaining -= value
    }

    if (count > 0) {
      player.tell(`Dando ${count} billetes de ${value}`)

      for (let i = 0; i < count; i++) {
        player.give(Item.of(cash.id))
      }
    }

    if (remaining <= 0) break
  }
}

function sellAllCash(player) {
  let total = 0

  for (const cash of CASH) {

    let found = true

    while (found) {

      found = false

      for (let slot = 0; slot < 36; slot++) {

        const item = player.inventory.getItem(slot)

        if (item.empty) continue

        const itemId = String(item.id)

        if (itemId === cash.id) {

          total += Number(cash.value)

          item.count--

          if (item.count <= 0) {
            player.inventory.setItem(slot, Item.empty)
          }

          found = true

          break
        }
      }
    }
  }

  return total
}

function getMoney(player) {
  if (player.persistentData.money == null) {
    player.persistentData.money = 0
  }

  return Number(player.persistentData.money)
}

function setMoney(player, amount) {
  player.persistentData.money = Math.max(0, Math.floor(amount))
  syncMoney(player)
}

function addMoney(player, amount) {
  setMoney(player, getMoney(player) + amount)
}

function removeMoney(player, amount) {
  if (getMoney(player) < amount) return false

  setMoney(player, getMoney(player) - amount)
  return true
}

function syncMoney(player) {
  player.sendData('money_sync', {
    money: getMoney(player)
  })
}

function giveChips(player, amount) {
  let remaining = parseInt(amount)

  for (const chip of CHIPS) {
    let value = parseInt(chip.value)
    let count = 0

    while (remaining >= value) {
      count++
      remaining -= value
    }

    if (count > 0) {
      player.tell(`Dando ${count} fichas de ${value}`)

      for (let i = 0; i < count; i++) {
        player.give(Item.of(chip.id))
      }
    }

    if (remaining <= 0) break
  }
}

function countPlayerChips(player) {
  let total = 0
  const name = player.username

  player.server.runCommandSilent('scoreboard objectives add chipcnt dummy')

  for (let i = 0; i < CHIPS.length; i++) {
    const chip = CHIPS[i]

    player.server.runCommandSilent(`scoreboard players set ${name} chipcnt 0`)
    player.server.runCommandSilent(`execute store result score ${name} chipcnt run clear ${name} ${chip.id} 0`)

    const scoreData = player.server.getScoreboard()
    const objective = scoreData.getObjective('chipcnt')
    const score = scoreData.getOrCreatePlayerScore(name, objective)
    const count = score.getScore()

    player.tell(`${chip.id} = ${count}`)
    total += count * Number(chip.value)
  }

  player.server.runCommandSilent('scoreboard objectives remove chipcnt')
  return total
}

function removeAllChips(player) {
  const name = player.username

  for (let i = 0; i < CHIPS.length; i++) {
    player.server.runCommandSilent(
      `clear ${name} ${CHIPS[i].id}`
    )
  }
}

function getChipValue(itemId) {
  for (const chip of CHIPS) {
    if (chip.id == itemId) return chip.value
  }

  return 0
}

function sellAllChips(player) {
  let total = 0

  for (let slot = 0; slot < 36; slot++) {
    let item = player.inventory.getItem(slot)
    if (item.empty) continue

    const itemId = String(item.id)

    for (let i = 0; i < CHIPS.length; i++) {
      if (CHIPS[i].id === itemId) {
        total += Number(CHIPS[i].value) * item.count
        player.inventory.setItem(slot, Item.empty)
        break
      }
    }
  }

  return total
}

function sellChipsCommand(player) {
  const name = player.username
  let total = 0

  for (let i = 0; i < CHIPS.length; i++) {
    const chip = CHIPS[i]
    // El resultado de runCommandSilent con /clear SIN el 0 al final
    // elimina los items y devuelve cuántos eliminó
    const removed = player.server.runCommandSilent(`clear ${name} ${chip.id}`)
    player.tell(`${chip.id} removed=${removed}`)
    total += removed * Number(chip.value)
  }

  return total
}


BlockEvents.rightClicked(event => {
  const hand = String(event.hand)
  if (hand === 'OFF_HAND') return

  const player = event.player
  const blockId = String(event.block.id)

  if (!player) return
  if (blockId !== 'minecraft:cauldron') return // o el bloque que uses para vender fichas

  const item = player.mainHandItem
  const itemId = String(item.id)
  let chip = null

  for (let i = 0; i < CHIPS.length; i++) {
    if (CHIPS[i].id === itemId) {
      chip = CHIPS[i]
      break
    }
  }

  if (!chip) {
    player.tell('§cNo tienes fichas en la mano')
    return
  }

  const count = item.getCount()
  player.tell(`Fichas detectadas: ${count}`)
  const total = count * Number(chip.value)

  item.shrink(count) // quita todas
  addMoney(player, total)
  syncMoney(player)
  player.tell(`§aHas cobrado §e${total} ${CURRENCY_NAME}`)
})


PlayerEvents.loggedIn(event => {
  const player = event.player
  getMoney(player)
  syncMoney(player)

  player.tell(`§aEconomía cargada. Saldo: §e${getMoney(player)} ${CURRENCY_NAME}`)
})

PlayerEvents.tick(event => {
  const player = event.player

  if (player.age % 40 != 0) return

  syncMoney(player)
})

ServerEvents.commandRegistry(event => {
  const { commands: Commands, arguments: Arguments } = event

  event.register(
    Commands.literal('money')
      .executes(ctx => {
        const player = ctx.source.player
        if (!player) return 0

        player.tell(`§6Tienes §e${getMoney(player)} ${CURRENCY_NAME}`)
        syncMoney(player)

        return 1
      })
  )

  event.register(
  Commands.literal('atm')

    .then(
      Commands.literal('withdraw')
        .then(
          Commands.argument('amount', Arguments.INTEGER.create(event))
            .executes(ctx => {
              const player = ctx.source.player
              const amount = Arguments.INTEGER.getResult(ctx, 'amount')

              if (!player) return 0

              if (amount <= 0) {
                player.tell('§cCantidad inválida')
                return 0
              }

              if (!removeMoney(player, amount)) {
                player.tell('§cNo tienes suficiente dinero en el banco')
                syncMoney(player)
                return 0
              }

              giveCash(player, amount)
              syncMoney(player)

              player.tell(`§aHas retirado §e${amount} monedas §aen efectivo`)
              return 1
            })
        )
    )

    .then(
      Commands.literal('deposit')
        .executes(ctx => {
          const player = ctx.source.player
          if (!player) return 0

          const total = sellAllCash(player)

          if (total <= 0) {
            player.tell('§cNo tienes dinero físico para ingresar')
            return 0
          }

          addMoney(player, total)
          syncMoney(player)

          player.tell(`§aHas ingresado §e${total} monedas §aal banco`)
          return 1
        })
    )

    .then(
      Commands.literal('balance')
        .executes(ctx => {
          const player = ctx.source.player
          if (!player) return 0

          player.tell(`§6Saldo bancario: §e${getMoney(player)} monedas`)
          syncMoney(player)

          return 1
        })
    )
  )

  event.register(
    Commands.literal('pay')
      .then(
        Commands.argument('player', Arguments.PLAYER.create(event))
          .then(
            Commands.argument('amount', Arguments.INTEGER.create(event))
              .executes(ctx => {
                const sender = ctx.source.player
                const target = Arguments.PLAYER.getResult(ctx, 'player')
                const amount = Arguments.INTEGER.getResult(ctx, 'amount')

                if (!sender) return 0

                if (amount <= 0) {
                  sender.tell('§cCantidad inválida')
                  return 0
                }

                if (sender.username == target.username) {
                  sender.tell('§cNo puedes pagarte a ti mismo')
                  return 0
                }

                if (!removeMoney(sender, amount)) {
                  sender.tell('§cNo tienes suficiente dinero')
                  return 0
                }

                addMoney(target, amount)

                sender.tell(`§aHas enviado §e${amount} ${CURRENCY_NAME} §aa ${target.username}`)
                target.tell(`§a${sender.username} te ha enviado §e${amount} ${CURRENCY_NAME}`)

                syncMoney(sender)
                syncMoney(target)

                return 1
              })
          )
      )
  )

  event.register(
    Commands.literal('chips')
      .then(
        Commands.literal('buy')
          .then(
            Commands.argument('amount', Arguments.INTEGER.create(event))
              .executes(ctx => {
                const player = ctx.source.player
                const amount = Arguments.INTEGER.getResult(ctx, 'amount')

                if (!player) return 0

                if (amount <= 0) {
                  player.tell('§cCantidad inválida')
                  return 0
                }

                if (!removeMoney(player, amount)) {
                  player.tell('§cNo tienes suficiente dinero')
                  return 0
                }

                giveChips(player, amount)
                syncMoney(player)

                player.tell(`§aHas comprado fichas por §e${amount} ${CURRENCY_NAME}`)
                return 1
              })
          )
      )

      .then(
          Commands.literal('sell')
            .executes(ctx => {
              const player = ctx.source.player
              if (!player) return 0

              const total = sellChipsCommand(player)  // ya funciona bien

              if (total <= 0) {
                player.tell('§cNo tienes fichas para vender')
                return 0
              }

              addMoney(player, total)
              syncMoney(player)

              player.tell(`§aHas vendido fichas por §e${total} ${CURRENCY_NAME}`)
              return 1
            })
        )

      .then(
        Commands.literal('value')
          .executes(ctx => {
            const player = ctx.source.player
            if (!player) return 0

            const total = countPlayerChips(player)
            player.tell(`§6Tus fichas valen §e${total} ${CURRENCY_NAME}`)

            return 1
          })
      )
  )

  event.register(
    Commands.literal('eco')
      .requires(source => source.hasPermission(2))

      .then(
        Commands.literal('give')
          .then(
            Commands.argument('player', Arguments.PLAYER.create(event))
              .then(
                Commands.argument('amount', Arguments.INTEGER.create(event))
                  .executes(ctx => {
                    const target = Arguments.PLAYER.getResult(ctx, 'player')
                    const amount = Arguments.INTEGER.getResult(ctx, 'amount')

                    if (amount <= 0) return 0

                    addMoney(target, amount)
                    syncMoney(target)

                    target.tell(`§aHas recibido §e${amount} ${CURRENCY_NAME}`)
                    ctx.source.sendSuccess(`Añadidas ${amount} monedas a ${target.username}`, false)

                    return 1
                  })
              )
          )
      )

      .then(
        Commands.literal('take')
          .then(
            Commands.argument('player', Arguments.PLAYER.create(event))
              .then(
                Commands.argument('amount', Arguments.INTEGER.create(event))
                  .executes(ctx => {
                    const target = Arguments.PLAYER.getResult(ctx, 'player')
                    const amount = Arguments.INTEGER.getResult(ctx, 'amount')

                    if (amount <= 0) return 0

                    removeMoney(target, amount)
                    syncMoney(target)

                    target.tell(`§cTe han quitado §e${amount} ${CURRENCY_NAME}`)
                    ctx.source.sendSuccess(`Quitadas ${amount} monedas a ${target.username}`, false)

                    return 1
                  })
              )
          )
      )

      .then(
        Commands.literal('set')
          .then(
            Commands.argument('player', Arguments.PLAYER.create(event))
              .then(
                Commands.argument('amount', Arguments.INTEGER.create(event))
                  .executes(ctx => {
                    const target = Arguments.PLAYER.getResult(ctx, 'player')
                    const amount = Arguments.INTEGER.getResult(ctx, 'amount')

                    if (amount < 0) return 0

                    setMoney(target, amount)
                    syncMoney(target)

                    target.tell(`§6Tu saldo ahora es §e${amount} ${CURRENCY_NAME}`)
                    ctx.source.sendSuccess(`Saldo de ${target.username} establecido a ${amount}`, false)

                    return 1
                  })
              )
          )
      )
  )
})